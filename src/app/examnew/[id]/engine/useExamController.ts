"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Attempt,
  ExamActions,
  ExamState,
  QuestionMeta,
  QuestionPayload,
  UseExamControllerArgs,
  QuestionStatus,
} from "./types";

import { fetchQuestionsMetaAction } from "@/app/actions/exam/questions/getQuestionsMeta";
import { fetchQuestionByIdAction } from "@/app/actions/exam/questions/getQuestionById";

// Optional attempt lifecycle actions; created below in actions folder
import { startAttemptAction } from "@/app/examnew/[id]/actions/attempt/startAttempt";
import { saveAnswerAction } from "@/app/examnew/[id]/actions/attempt/saveAnswer";
import { submitAttemptAction } from "@/app/examnew/[id]/actions/attempt/submitAttempt";

const LS_PREFIX = "evalus-examnew-shadow-";

function deriveCounts(attempts: Record<number, Attempt>, meta: QuestionMeta[]) {
  const base = {
    notVisited: 0,
    viewed: 0,
    answered: 0,
    notAnswered: 0,
    markedForReview: 0,
    answeredMarkedForReview: 0,
  } as Record<string, number>;
  const seen = new Set<number>(Object.keys(attempts).map((k) => Number(k)));
  base.notVisited = meta.filter((m) => !seen.has(m.questionId)).length;
  Object.values(attempts).forEach((a) => (base[a.status] = (base[a.status] || 0) + 1));
  return base as ExamState["counts"];
}

export function useExamController(args: UseExamControllerArgs) {
  const { examId, settings } = args;

  const [attemptId, setAttemptId] = useState<number | undefined>(undefined);
  const [meta, setMeta] = useState<QuestionMeta[]>([]);
  const [questions, setQuestions] = useState<Record<number, QuestionPayload>>({});
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});
  const [current, setCurrent] = useState<{ index: number; questionId: number | null }>({ index: 0, questionId: null });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [timeLeftMs, setTimeLeftMs] = useState<number | undefined>(undefined);

  const counts = useMemo(() => deriveCounts(attempts, meta), [attempts, meta]);

  const unsyncedRef = useRef<Map<number, Attempt>>(new Map());
  const saveTimerRef = useRef<any>(null);
  const lsKey = `${LS_PREFIX}${examId}`;

  const loadMeta = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      const res = await fetchQuestionsMetaAction(examId);
      const { data, status, error, errorMessage } = res as any;
      if (status !== 200 || !data?.length) throw new Error(errorMessage || error || "Failed to load meta");
      const mapped: QuestionMeta[] = data.map((m: any) => ({
        questionId: m.questionId ?? m.id ?? m.qid,
        sectionId: m.sectionId ?? m.section_id,
        marks: m.marks ?? m.maxMarks ?? 1,
        neg: m.neg ?? m.negativeMarks ?? 0,
      }));
      setMeta(mapped);
      setCurrent((prev) => ({ index: 0, questionId: mapped[0]?.questionId ?? null }));
    } catch (e: any) {
      setError(e?.message || "Unable to load exam");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const startOrResume = useCallback(async () => {
    try {
      const res = await startAttemptAction(examId);
      const { status, data, error, errorMessage } = res as any;
      if (status !== 200 || !data?.attemptId) throw new Error(errorMessage || error || "Unable to start attempt");
      setAttemptId(data.attemptId);
      if (typeof data.timeLeftMs === "number") setTimeLeftMs(data.timeLeftMs);
      if (Array.isArray(data.answers)) {
        const byQ: Record<number, Attempt> = {};
        for (const a of data.answers) {
          byQ[a.questionId] = { answer: a.answer ?? "", status: (a.status ?? "viewed") } as Attempt;
        }
        setAttempts(byQ);
      } else {
        const ls = typeof window !== "undefined" ? localStorage.getItem(lsKey) : null;
        if (ls) {
          try { setAttempts(JSON.parse(ls)); } catch {}
        }
      }
    } catch (e: any) {
      setError(e?.message || "Unable to start attempt");
    }
  }, [examId, lsKey]);

  const ensureLoaded = useCallback(
    async (questionId: number) => {
      if (questions[questionId]) return;
      try {
        const res = await fetchQuestionByIdAction(questionId);
        const { data, status, error, errorMessage } = res as any;
        if (status !== 200 || !data) throw new Error(errorMessage || error || "Failed to load question");
        setQuestions((prev) => ({ ...prev, [questionId]: normalizeQuestion(data) }));
      } catch (e: any) {
        setError(e?.message || "Unable to load question");
      }
    },
    [questions]
  );

  useEffect(() => {
    loadMeta();
    startOrResume();
  }, [loadMeta, startOrResume]);

  useEffect(() => {
    if (!current.questionId) return;
    ensureLoaded(current.questionId);
    setAttempts((prev) => {
      if (prev[current.questionId!]) return prev;
      const updated: Record<number, Attempt> = {
        ...prev,
        [current.questionId!]: { answer: "", status: "viewed" },
      };
      return updated;
    });
    const nextId = meta[current.index + 1]?.questionId;
    if (nextId) ensureLoaded(nextId);
  }, [current, meta, ensureLoaded]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem(lsKey, JSON.stringify(attempts));
    } catch {}
  }, [lsKey, attempts]);

  const scheduleFlush = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const items = Array.from(unsyncedRef.current.entries());
      if (!attemptId || items.length === 0) return;
      try {
        const payload = items.map(([questionId, attempt]) => ({ questionId, answer: attempt.answer, status: attempt.status }));
        await saveAnswerAction({ attemptId, items: payload });
        unsyncedRef.current.clear();
      } catch (e) {
        // keep unsynced for retry
        console.error("Save failed; will retry", e);
      }
    }, 500);
  }, [attemptId]);

  const saveAnswer = useCallback(
    async (qid: number, answer: string) => {
      setAttempts((prev) => {
  const next: Attempt = { answer, status: (answer ? "answered" : "notAnswered") as QuestionStatus };
  const updated: Record<number, Attempt> = { ...prev, [qid]: next };
        unsyncedRef.current.set(qid, next);
        scheduleFlush();
        return updated;
      });
    },
    [scheduleFlush]
  );

  const clearAnswer = useCallback(
    (qid: number) => {
      setAttempts((prev) => {
  const next: Attempt = { answer: "", status: "notAnswered" };
  const updated: Record<number, Attempt> = { ...prev, [qid]: next };
        unsyncedRef.current.set(qid, next);
        scheduleFlush();
        return updated;
      });
    },
    [scheduleFlush]
  );

  const markForReview = useCallback(
    (qid: number) => {
      setAttempts((prev) => {
        const existing = prev[qid] ?? { answer: "", status: "viewed" };
  const status: QuestionStatus = (existing.answer ? "answeredMarkedForReview" : "markedForReview");
  const next: Attempt = { ...existing, status } as Attempt;
  const updated: Record<number, Attempt> = { ...prev, [qid]: next };
        unsyncedRef.current.set(qid, next);
        scheduleFlush();
        return updated;
      });
    },
    [scheduleFlush]
  );

  const next = useCallback(() => {
    setCurrent((prev) => {
      const idx = Math.min(prev.index + 1, meta.length - 1);
      return { index: idx, questionId: meta[idx]?.questionId ?? null };
    });
  }, [meta]);

  const previous = useCallback(() => {
    setCurrent((prev) => {
      const idx = Math.max(prev.index - 1, 0);
      return { index: idx, questionId: meta[idx]?.questionId ?? null };
    });
  }, [meta]);

  const jumpTo = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), meta.length - 1);
      setCurrent({ index: clamped, questionId: meta[clamped]?.questionId ?? null });
    },
    [meta]
  );

  const submit = useCallback(async () => {
    if (!attemptId) return;
    try {
      if (unsyncedRef.current.size) {
        const items = Array.from(unsyncedRef.current.entries()).map(([questionId, a]) => ({ questionId, answer: a.answer, status: a.status }));
        await saveAnswerAction({ attemptId, items });
        unsyncedRef.current.clear();
      }
      await submitAttemptAction({ attemptId });
      if (typeof window !== "undefined") alert("Submitted successfully.");
    } catch (e: any) {
      if (typeof window !== "undefined") alert(`Submit failed: ${e?.message || "Unknown error"}`);
    }
  }, [attemptId]);

  const timeout = useCallback(() => {
    // Auto submit on timeout
    submit();
  }, [submit]);

  const actions: ExamActions = {
    loadMeta,
    ensureLoaded,
    saveAnswer,
    clearAnswer,
    markForReview,
    next,
    previous,
    jumpTo,
    submit,
    timeout,
    setTimeLeft: (ms: number) => setTimeLeftMs(ms),
  };

  const state: ExamState = {
    examId,
    attemptId,
    title: "Exam",
    loading,
    error,
    meta,
    questions,
    attempts,
    current,
    counts,
    timeLeftMs,
  };

  return { state, actions, settings };
}

function normalizeQuestion(data: any): QuestionPayload {
  return {
    id: data.id ?? data.questionId ?? data.qid,
    questionType: data.questionType ?? data.type ?? null,
    questionText: data.questionText ?? data.text ?? "",
    passageHtml: data.passageHtml ?? null,
    questionOptionsJson: data.questionOptionsJson ?? data.optionsJson ?? null,
    userAnswer: data.userAnswer ?? "",
    marks: data.marks ?? data.maxMarks ?? 1,
    neg: data.neg ?? data.negativeMarks ?? 0,
    ...data,
  };
}
