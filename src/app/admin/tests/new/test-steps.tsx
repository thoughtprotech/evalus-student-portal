"use client";

import { useEffect, useRef, useState } from "react";
import type {
  TestCategoryOData,
  TestDifficultyLevelOData,
  TestInstructionOData,
  TestTypeOData,
} from "@/utils/api/types";
import StepWizard from "@/components/StepWizard/StepWizard";
import StepSection from "@/components/StepWizard/StepSection";
import Step1CreateTestDetails from "./step1-test-details";
import Step2TestSettings from "./step2-test-settings";
import Step3AddQuestions from "./step3-add-questions";
import Step4Publish from "./step4-publish";
import Step5Assign from "./step5-assign";
import ImportantInstructions from "@/components/ImportantInstructions";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  SlidersHorizontal,
  FilePlus2,
  Rocket,
  Users,
} from "lucide-react";
import { TestDraftProvider } from "@/contexts/TestDraftContext";
import { useTestDraft } from "@/contexts/TestDraftContext";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import Toast from "@/components/Toast";
import { apiHandler as clientApiHandler } from "@/utils/api/client";

type Props = {
  testTypes: TestTypeOData[];
  categories: TestCategoryOData[];
  instructions: TestInstructionOData[];
  difficultyLevels: TestDifficultyLevelOData[];
  // Edit mode support
  initialDraft?: any;
  editMode?: boolean;
  testId?: number;
};

export default function TestSteps({
  testTypes,
  categories,
  instructions,
  difficultyLevels,
  initialDraft,
  editMode,
  testId,
}: Props) {
  // Toast wiring
  const [toast, setToast] = useState<{ message: string; type: "success"|"error"|"info"|"warning" } | null>(null);
  const [current, setCurrent] = useState(0);
  const [queryHydrated, setQueryHydrated] = useState(false);
  const step1FormRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const search = useSearchParams();
  // Stable primitives derived from search params
  const stepParamString = search?.get("step") ?? null;
  const searchString = search?.toString() ?? "";

  const [draftInitial, setDraftInitial] = useState<any | null>(() => initialDraft ?? null);
  // Step validators registry (lightweight): currently only Step 4
  const step4ValidatorRef = useRef<(() => boolean) | null>(null);
  const step5ValidatorRef = useRef<(() => boolean) | null>(null);
  const step1ValidatorRef = useRef<(() => boolean) | null>(null);
  const step3ValidatorRef = useRef<(() => boolean) | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (editMode) {
        // In edit mode, trust the server-provided initialDraft
        if (mounted) setDraftInitial(initialDraft ?? {});
        // Seed session for consistency
        try { sessionStorage.setItem('admin:newTest:model', JSON.stringify(initialDraft ?? {})); } catch {}
        return;
      }
      try {
        // Prefer cached model to avoid duplicate New Test calls
        const cached = typeof window !== 'undefined' ? sessionStorage.getItem('admin:newTest:model') : null;
        if (cached) {
          const parsed = JSON.parse(cached);
          if (mounted) setDraftInitial(parsed ?? {});
          return;
        }
      } catch {}
      try {
        const res = await apiHandler(endpoints.getNewTestModel, null as any);
        const data = res?.data ?? {};
        if (typeof window !== 'undefined') {
          try { sessionStorage.setItem('admin:newTest:model', JSON.stringify(data)); } catch {}
        }
        if (mounted) setDraftInitial(data);
      } catch {
        if (mounted) setDraftInitial({});
      }
    })();
    return () => { mounted = false; };
  }, [editMode, initialDraft]);

  const steps = [
    {
      key: "details",
      title: "Test Details",
      description: "Create / Add test details",
  icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      key: "settings",
      title: "Test Settings",
      description: "Configure settings",
      icon: <SlidersHorizontal className="w-4 h-4" />,
    },
    {
      key: "questions",
  title: "Add Questions",
      description: "Add or import questions",
  icon: <FilePlus2 className="w-4 h-4" />,
    },
    {
      key: "publish",
      title: "Publish",
      description: "Make test available",
  icon: <Rocket className="w-4 h-4" />,
    },
    {
      key: "assign",
      title: "Assign Test",
      description: "Assign to candidates/groups",
      icon: <Users className="w-4 h-4" />,
    },
  ];

  const stepsLength = steps.length;

  // Normalize API test payload into the draft shape expected by the wizard (client-side fallback)
  const normalizeTestToDraft = (test: any): any => {
    const d: any = { ...(test || {}) };
    // Prefer model-provided totals first (both PascalCase and camelCase), do not override unless missing
    if (d.TotalQuestions == null) {
      d.TotalQuestions = (test && (test.TotalQuestions ?? test.totalQuestions)) ?? null;
    }
    if (d.TotalMarks == null) {
      d.TotalMarks = (test && (test.TotalMarks ?? test.totalMarks)) ?? null;
    }
    if (typeof d.TestStatus === "string") {
      const s = d.TestStatus.toLowerCase();
      d.TestStatus = s === "published" ? "Published" : s === "new" ? "New" : d.TestStatus;
    }
    // Map TestSettings[0] -> top-level draft fields used by Step 2 UI (client hydrator path)
    const settingsArr = Array.isArray(d.TestSettings) ? d.TestSettings : Array.isArray((test as any)?.testSettings) ? (test as any).testSettings : [];
    const s0: any = settingsArr && settingsArr.length > 0 ? settingsArr[0] : null;
    if (s0) {
      const pick = (a: any, b: any) => (a !== undefined ? a : b);
      d.GroupQuestionsBySubjects = pick(s0.GroupQuestionsBySubjects, s0.groupQuestionsBySubjects);
      d.QuestionNumberingBySections = pick(s0.QuestionNumberingBySections, s0.questionNumberingBySections);
      d.RandomizeQuestionByTopics = pick(s0.RandomizeQuestionByTopics, s0.randomizeQuestionByTopics);
      d.RandomizeAnswerOptionsByQuestions = pick(s0.RandomizeAnswerOptionsByQuestions, s0.randomizeAnswerOptionsByQuestions);
      d.AttemptAllQuestions = pick(s0.AttemptAllQuestions, s0.attemptAllQuestions);
      d.DisplayMarksDuringTest = pick(s0.DisplayMarksDuringTest, s0.displayMarksDuringTest);

      d.MinimumTestTime = pick(s0.MinimumTestTime, s0.minimumTestTime);
      d.MaximumTestTimePer = pick(s0.MaximumTestTimePer, s0.maximumTestTimePer);
  // Removed deprecated per-question and per-section timing fields (Minimum/MaximumTimePerQuestion/Section)

      d.LockSectionsOnSubmission = pick(s0.LockSectionsOnSubmission, s0.lockSectionsOnSubmission);
      d.LogTestActivity = pick(s0.LogTestActivity, s0.logTestActivity);
      d.DisplayTestTime = pick(s0.DisplayTestTime, s0.displayTestTime);
      d.DisplaySectionTime = pick(s0.DisplaySectionTime, s0.displaySectionTime);

      d.TestMinimumPassMarks = pick(s0.TestMinimumPassMarks, s0.testMinimumPassMarks);

      d.TestCompletionMessage = pick(s0.TestCompletionMessage, s0.testCompletionMessage);
      d.TestPassFeedbackMessage = pick(s0.TestPassFeedbackMessage, s0.testPassFeedbackMessage);
      d.TestFailFeedbackMessage = pick(s0.TestFailFeedbackMessage, s0.testFailFeedbackMessage);
      d.TestSubmissionMessage = pick(s0.TestSubmissionMessage, s0.testSubmissionMessage);

      d.AutomaticRankCalculation = pick(s0.AutomaticRankCalculation, s0.automaticRankCalculation);
      d.AllowDuplicateRank = pick(s0.AllowDuplicateRank, s0.allowDuplicateRank);
      d.SkipRankForDuplicateTank = pick(s0.SkipRankForDuplicateTank, s0.skipRankForDuplicateTank);
    }
    const tq: any[] = Array.isArray(d.TestQuestions ?? d.testQuestions) ? (d.TestQuestions ?? d.testQuestions) : [];
    d.testQuestions = tq
      .map((q: any) => {
        const qObj = q?.Question ?? q?.question ?? null;
        let Question: any = null;
        if (qObj) {
          const opts = qObj.Questionoptions ?? qObj.questionoptions ?? qObj.QuestionOptions ?? qObj.questionOptions ?? [];
          const normOpts = Array.isArray(opts)
            ? opts.map((o: any) => ({
                QuestionText: o?.QuestionText ?? o?.questionText ?? o?.text ?? null,
              }))
            : [];
          // Normalize Subject as well if available (prefer parent subject fields)
          const subj = qObj.Subject ?? qObj.subject;
          const Subject = subj
            ? {
                ParentSubjectId: subj.ParentSubjectId ?? subj.parentSubjectId ?? undefined,
                ParentSubjectName: subj.ParentSubjectName ?? subj.parentSubjectName ?? undefined,
                SubjectId: subj.SubjectId ?? subj.subjectId ?? undefined,
                SubjectName: subj.SubjectName ?? subj.subjectName ?? undefined,
              }
            : undefined;
          Question = { Questionoptions: normOpts, ...(Subject ? { Subject } : {}) };
        }
        return {
          TestQuestionId: Number(
            q?.TestQuestionId ?? q?.testQuestionId ?? q?.QuestionId ?? q?.Question?.QuestionId ?? q?.QuestionID ?? q?.questionId ?? 0
          ),
          Marks: Number(q?.Marks ?? q?.marks ?? 0),
          NegativeMarks: Number(q?.NegativeMarks ?? q?.negativeMarks ?? 0),
          Duration: Number(q?.Duration ?? q?.duration ?? 0),
          Question,
        };
      })
      .filter((q) => q.TestQuestionId > 0);
    // Derive totals for Step 1 pre-population if missing
    if (!('TotalQuestions' in d) || d.TotalQuestions == null) {
      d.TotalQuestions = Array.isArray(d.testQuestions) ? d.testQuestions.length : 0;
    }
    if (!('TotalMarks' in d) || d.TotalMarks == null) {
      d.TotalMarks = Array.isArray(d.testQuestions)
        ? d.testQuestions.reduce((sum: number, q: any) => sum + (Number(q?.Marks ?? 0) || 0), 0)
        : 0;
    }
    return d;
  };

  // Mark that we're inside the wizard and clear cached draft when leaving it,
  // unless Step 3 explicitly set a suppression flag to allow intra-wizard navigation
  // (e.g., to /admin/tests/new/questions/select).
  useEffect(() => {
    try {
      sessionStorage.setItem("admin:newTest:inWizard", "1");
    } catch {}
    return () => {
      try {
        const suppress = sessionStorage.getItem("admin:newTest:suppressClear");
        if (!suppress) {
          sessionStorage.removeItem("admin:newTest:model");
          sessionStorage.removeItem("admin:newTest:preselectedIds");
          sessionStorage.removeItem("admin:newTest:selectedQuestions");
        }
        sessionStorage.removeItem("admin:newTest:inWizard");
      } catch {}
    };
  }, []);

  // Initialize current step from query param (?step=1-based), then mark hydrated
  useEffect(() => {
    if (stepParamString) {
      const idx = Math.max(
        0,
        Math.min(stepsLength - 1, Number(stepParamString) - 1 || 0)
      );
      if (!Number.isNaN(idx) && idx !== current) setCurrent(idx);
    }
    setQueryHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepParamString, stepsLength]);

  // Note: We no longer reflect current -> URL automatically.
  // URL updates are performed explicitly in navigation handlers to avoid routing loops.

  const handleBack = () => {
  // If we are on Step 4 (index 3), prevent navigating back if invalid
  if (current === 2 && step3ValidatorRef.current) {
    const ok3 = step3ValidatorRef.current();
    if (!ok3) return;
  }
  if (current === 3 && step4ValidatorRef.current) {
    const ok = step4ValidatorRef.current();
    if (!ok) return;
  }
  if (current === 4 && step5ValidatorRef.current) {
    const ok = step5ValidatorRef.current();
    if (!ok) return;
  }
  const next = Math.max(0, current - 1);
  setCurrent(next);
  const params = new URLSearchParams(searchString);
  params.set("step", String(next + 1));
  router.replace(`?${params.toString()}`);
  };
  const handleNext = () => {
    if (current === 0 && step1ValidatorRef.current) {
      const ok = step1ValidatorRef.current();
      if (!ok) return;
    }
    if (current === 2 && step3ValidatorRef.current) {
      const ok3 = step3ValidatorRef.current();
      if (!ok3) return;
    }
    if (current === 3 && step4ValidatorRef.current) {
      const ok = step4ValidatorRef.current();
      if (!ok) return;
    }
    if (current === 4 && step5ValidatorRef.current) {
      const ok = step5ValidatorRef.current();
      if (!ok) return;
    }
  const next = Math.min(stepsLength - 1, current + 1);
  setCurrent(next);
  const params = new URLSearchParams(searchString);
  params.set("step", String(next + 1));
  router.replace(`?${params.toString()}`);
  };
  // We'll call API inside an inner component that can read draft from context
  const SaveButton: React.FC = () => {
    const { draft } = useTestDraft();
    const [saving, setSaving] = useState(false);
    const router2 = useRouter();
    const runSave = async () => {
      if (saving) return;
      // Helper fallback validators for when a step component isn't mounted (e.g., user jumped directly to Step 5)
      const validateStep1Fallback = (d: any): { ok: boolean; msg?: string } => {
        try {
          if (typeof window !== 'undefined' && sessionStorage.getItem('admin:newTest:step1valid') === '1') {
            return { ok: true };
          }
        } catch { /* ignore */ }
        const compute = (src: any) => {
          const name = (src?.TestName ?? "").toString().trim();
          // Field name alignment with Step1 component
          const typeOk = Number.isFinite(Number(src?.TestTypeId ?? src?.TypeId));
          // TestCategoryId is removed; Step1 will ensure selection via testAssignedTestCategories.
          const catOk = true;
          const lvlOk = Number.isFinite(Number(src?.DifficultyLevelId ?? src?.TestDifficultyLevelId));
          const priOk = Number.isFinite(Number(src?.PrimaryInstructionId ?? src?.TestPrimaryInstructionId));
          // Duration/marks/totals are computed from Step 3; only require core Step 1 fields here
          const ok = !!name && typeOk && lvlOk && priOk;
          return ok;
        };
        try {
          if (compute(d)) return { ok: true };
          // Attempt one-time snapshot restore before failing
          try {
            const snapRaw = typeof window !== 'undefined' ? sessionStorage.getItem('admin:newTest:step1snapshot') : null;
            if (snapRaw) {
              const snap = JSON.parse(snapRaw);
              if (compute(snap)) return { ok: true };
            }
          } catch { /* ignore */ }
          return { ok: false, msg: "Please complete required fields in Step 1 (Test Details)." };
        } catch {
          return { ok: false, msg: "Please complete required fields in Step 1 (Test Details)." };
        }
      };
      const validateStep3Fallback = (d: any): { ok: boolean; msg?: string } => {
        try {
          const rows: any[] = Array.isArray(d?.testQuestions) ? d.testQuestions : [];
          const problems: string[] = [];
          rows.forEach((q: any, idx: number) => {
            const marks = Number(q?.Marks === "" ? 0 : (q?.Marks ?? 0));
            const neg = Number(q?.NegativeMarks === "" ? 0 : (q?.NegativeMarks ?? 0));
            const dur = Number(q?.Duration === "" ? 0 : (q?.Duration ?? 0));
            const errs: string[] = [];
            if (!Number.isFinite(marks) || marks < 0) errs.push("Marks must be a non-negative number");
            if (!Number.isFinite(neg) || neg < 0) errs.push("Negative Marks must be non-negative");
            if (neg > marks) errs.push("Negative Marks cannot exceed Marks");
            if (!Number.isFinite(dur) || dur < 0) errs.push("Duration must be non-negative");
            if (errs.length) problems.push(`Row ${idx + 1}: ${errs.slice(0, 2).join("; ")}`);
          });
          if (problems.length) {
            const msg = `Fix inline errors in Step 3 before saving.\n${problems.slice(0, 3).join("\n")}${problems.length > 3 ? " …" : ""}`;
            return { ok: false, msg };
          }
          return { ok: true };
        } catch {
          return { ok: false, msg: "Fix inline errors in Step 3 (Add Questions) before saving." };
        }
      };
      const validateStep4Fallback = (d: any): { ok: boolean; msg?: string } => {
        try {
          const s = d?.TestStartDate;
          const e = d?.TestEndDate;
          if (!s || !e) return { ok: false, msg: "Please provide Start and End date/time in Step 4 (Publish)." };
          const sMs = new Date(s).getTime();
          const eMs = new Date(e).getTime();
          if (isNaN(sMs) || isNaN(eMs) || eMs <= sMs) {
            return { ok: false, msg: "End date/time must be later than Start date/time in Step 4 (Publish)." };
          }
          return { ok: true };
        } catch {
          return { ok: false, msg: "Please resolve date/time in Step 4 (Publish)." };
        }
      };
      const validateStep5Fallback = (_d: any): { ok: boolean; msg?: string } => ({ ok: true });

      // Validate Step1 prioritizing draft & snapshot (component may be unmounted or ref stale after external navigation)
      let step1Result = validateStep1Fallback(draft);
      if (!step1Result.ok) {
        // Try snapshot restore once
        try {
          const snapRaw = typeof window !== 'undefined' ? sessionStorage.getItem('admin:newTest:step1snapshot') : null;
          if (snapRaw) {
            const snap = JSON.parse(snapRaw);
            const snapCheck = validateStep1Fallback(snap);
            if (snapCheck.ok) step1Result = snapCheck;
          }
        } catch { /* ignore */ }
      }
      if (!step1Result.ok && step1ValidatorRef.current && current === 0) {
        // If user is actually on Step1, allow live validator to run (could clear transient errors)
        try {
          const liveOk = step1ValidatorRef.current();
          if (liveOk) step1Result = { ok: true };
        } catch { /* ignore */ }
      }
      if (!step1Result.ok) {
        setToast({ message: step1Result.msg || "Please complete required fields in Step 1 (Test Details).", type: "error" });
        setCurrent(0);
        const params = new URLSearchParams(searchString);
        params.set("step", "1");
        router.replace(`?${params.toString()}`);
        return;
      }
      const ok3 = step3ValidatorRef.current ? step3ValidatorRef.current() : validateStep3Fallback(draft).ok;
      if (!ok3) {
        const fallback = !step3ValidatorRef.current ? validateStep3Fallback(draft) : { ok: false, msg: undefined };
        setToast({ message: fallback.msg || "Please resolve validation issues in Step 3 (Add Questions).", type: "error" });
        // Focus Step 3
        setCurrent(2);
        const params = new URLSearchParams(searchString);
        params.set("step", "3");
        router.replace(`?${params.toString()}`);
        return;
      }
      const ok4 = step4ValidatorRef.current ? step4ValidatorRef.current() : validateStep4Fallback(draft).ok;
      if (!ok4) {
        const fallback = !step4ValidatorRef.current ? validateStep4Fallback(draft) : { ok: false, msg: undefined };
        setToast({ message: fallback.msg || "Please resolve validation issues in Step 4 (Publish).", type: "error" });
        // Focus Step 4
        setCurrent(3);
        const params = new URLSearchParams(searchString);
        params.set("step", "4");
        router.replace(`?${params.toString()}`);
        return;
      }
      const ok5 = step5ValidatorRef.current ? step5ValidatorRef.current() : validateStep5Fallback(draft).ok;
      if (!ok5) {
        setToast({ message: "Please resolve validation issues in Step 5 (Assign).", type: "error" });
        // Focus Step 5
        setCurrent(4);
        const params = new URLSearchParams(searchString);
        params.set("step", "5");
        router.replace(`?${params.toString()}`);
        return;
      }
      try {
        setSaving(true);
        
        // Debug: Log the entire draft at the start of save
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Save] Complete draft at save start:', JSON.stringify(draft, null, 2));
        }
        
        // Compute edit state early
        const isEdit = (!!editMode && !!testId) || !!(draft as any)?.TestId;
        const updateId: number | undefined = (testId as number | undefined) ?? ((draft as any)?.TestId as number | undefined);

        // --- Recompute authoritative totals (even if user never visited Step 3 in edit mode) ---
        const rows: any[] = Array.isArray((draft as any)?.testQuestions) ? (draft as any).testQuestions : [];
        const recomputedTotalQuestions = rows.length;
        const recomputedTotalMarks = rows.reduce((sum: number, q: any) => {
          const v = q?.Marks === "" ? 0 : (q?.Marks ?? 0);
          return sum + (Number(v) || 0);
        }, 0);

        // Build payload from draft (after recomputation)
  const toNum = (v: any) => (v === null || v === undefined || v === "" ? null : Number(v));
        const testQuestions = rows.map((r: any, idx: number) => ({
          TestQuestionId: toNum(
            r?.TestQuestionId ??
            r?.testQuestionId ??
            r?.QuestionId ??
            r?.Question?.QuestionId ??
            r?.QuestionID ??
            r?.questionId
          ),
          // Treat empty as 0 for numeric fields per requirement
          Marks: Number(r?.Marks ?? 0),
          NegativeMarks: Number(r?.NegativeMarks ?? 0),
          Duration: Number(r?.Duration ?? 0),
          TestQuestionSequenceNo: idx + 1,
          Question: null, // ensure server ignores nested question validation
        }));

        // Validate QuestionId presence and positivity, and required inline fields
        if (testQuestions.some((q: any) => !q.TestQuestionId || q.TestQuestionId <= 0)) {
          setToast({ message: "Some selected questions are invalid (missing TestQuestionId). Please review Step 3 and reselect.", type: "error" });
          setSaving(false);
          return;
        }
  // Empty values are allowed and treated as 0; only negative or inconsistent values are prevented earlier in Step 3

        // Build TestSettings[0] from Step 2 fields
        const d2: any = draft ?? {};
  const toUlong = (v: any) => (v === 1 || v === "1" || v === true ? 1 : 0);
        const settings0: any = {
          // Booleans/toggles -> always 0/1
          GroupQuestionsBySubjects: toUlong(d2.GroupQuestionsBySubjects),
          QuestionNumberingBySections: toUlong(d2.QuestionNumberingBySections),
          RandomizeQuestionByTopics: toUlong(d2.RandomizeQuestionByTopics ?? 0),
          RandomizeAnswerOptionsByQuestions: toUlong(d2.RandomizeAnswerOptionsByQuestions),
          AttemptAllQuestions: toUlong(d2.AttemptAllQuestions),
          DisplayMarksDuringTest: toUlong(d2.DisplayMarksDuringTest),

          MinimumTestTime: d2.MinimumTestTime ?? null,
          MaximumTestTimePer: d2.MaximumTestTimePer ?? null,
          // Deprecated timing fields removed from payload

          LockSectionsOnSubmission: toUlong(d2.LockSectionsOnSubmission),
          LogTestActivity: toUlong(d2.LogTestActivity),
          DisplayTestTime: toUlong(d2.DisplayTestTime),
          DisplaySectionTime: toUlong(d2.DisplaySectionTime),

          TestMinimumPassMarks: d2.TestMinimumPassMarks ?? null,

          TestCompletionMessage: d2.TestCompletionMessage ?? null,
          TestPassFeedbackMessage: d2.TestPassFeedbackMessage ?? null,
          TestFailFeedbackMessage: d2.TestFailFeedbackMessage ?? null,
          TestSubmissionMessage: d2.TestSubmissionMessage ?? null,

          AutomaticRankCalculation: toUlong(d2.AutomaticRankCalculation),
          AllowDuplicateRank: toUlong(d2.AllowDuplicateRank),
          SkipRankForDuplicateTank: toUlong(d2.SkipRankForDuplicateTank),
        };
        // Compose payload
        const payload: any = {
          ...draft,
          // Preserve user-entered totals; only fill if missing or zero.
          TotalQuestions: (draft as any)?.TotalQuestions && Number((draft as any).TotalQuestions) > 0
            ? (draft as any).TotalQuestions
            : recomputedTotalQuestions,
          TotalMarks: (draft as any)?.TotalMarks && Number((draft as any).TotalMarks) > 0
            ? (draft as any).TotalMarks
            : recomputedTotalMarks,
          TestStatus:
            String((draft as any)?.TestStatus || "New").toLowerCase() === "published"
              ? "Published"
              : "New",
          TestQuestions: testQuestions,
          TestSettings: [settings0],
          // Persist independent selections from Step 5 and categories from Step 1
          // Products: prefer { TestProductId } shape; if consumer added { ProductId }, normalize it here
          testAssignedProducts: Array.isArray((draft as any)?.testAssignedProducts)
            ? (draft as any).testAssignedProducts.map((p: any) => ({ TestProductId: Number(p?.TestProductId ?? p?.ProductId) }))
            : [],
          // Categories: maintained by Step 1 as [{ TestCategoryId }]. If absent (e.g., component unmounted), fallback to session snapshot
          testAssignedTestCategories: (() => {
            const arr = Array.isArray((draft as any)?.testAssignedTestCategories) ? (draft as any).testAssignedTestCategories : [];
            if (arr.length > 0) return arr;
            try {
              const raw = typeof window !== 'undefined' ? sessionStorage.getItem('admin:newTest:selectedCategoryIds') : null;
              if (!raw) return [] as any[];
              const ids = JSON.parse(raw);
              if (!Array.isArray(ids)) return [] as any[];
              const uniq = Array.from(new Set(ids.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))));
              return uniq.map((id) => ({ TestCategoryId: id }));
            } catch { return [] as any[]; }
          })(),
        };
        
        // No sections to log or include
        // Ensure TestCode is always present (fallback if Step 1 sync was missed)
        if (!payload.TestCode) {
          try {
            const g = (globalThis as any)?.crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() :
              'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0;
                const v = c === 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
              });
            payload.TestCode = g;
          } catch {}
        }
        // Remove Step 2 fields from root to avoid sending them at top-level
        const step2Keys = [
          "GroupQuestionsBySubjects",
          "QuestionNumberingBySections",
          "RandomizeQuestionByTopics",
          "RandomizeAnswerOptionsByQuestions",
          "AttemptAllQuestions",
          "DisplayMarksDuringTest",
          "MinimumTestTime",
          "MaximumTestTimePer",
          "LockSectionsOnSubmission",
          "LogTestActivity",
          "DisplayTestTime",
          "DisplaySectionTime",
          "TestMinimumPassMarks",
          "TestCompletionMessage",
          "TestPassFeedbackMessage",
          "TestFailFeedbackMessage",
          "TestSubmissionMessage",
          "AutomaticRankCalculation",
          "AllowDuplicateRank",
          "SkipRankForDuplicateTank",
        ];
  step2Keys.forEach((k) => { if (k in payload) delete (payload as any)[k]; });
        // Remove client-only fields
  delete (payload as any).testQuestions;
  // Remove legacy assignment fields
  delete (payload as any).SelectedCandidateGroupIds;
  delete (payload as any).SelectedProductIds;
  delete (payload as any).TestAssignments;

  // isEdit/updateId computed earlier
        if (isEdit && !(updateId && updateId > 0)) {
          setToast({ message: "Cannot update: missing TestId.", type: "error" });
          setSaving(false);
          return;
        }
        const res = await apiHandler(
          isEdit ? endpoints.updateTest : endpoints.createTest,
          (isEdit ? { id: updateId as number, ...payload } : payload) as any
        );
        if ((res as any)?.error) {
          const data = (res as any)?.data;
          let msg = (res as any)?.message || "Failed to save test.";
          if (data && typeof data === "object" && data.errors) {
            const errs = data.errors as Record<string, string[]>;
            const flat = Object.entries(errs)
              .flatMap(([key, arr]) => (Array.isArray(arr) ? arr.map((m) => `${m}`) : []));
            if (flat.length > 0) msg = flat.slice(0, 3).join("; ");
          }
          setToast({ message: msg, type: "error" });
          return;
        }
  setToast({ message: isEdit ? "Test Updated Sucessfuly" : "Created Test Sucessfuly", type: "success" });
        // Clear draft cache because we're done
        try {
          sessionStorage.removeItem("admin:newTest:model");
          sessionStorage.removeItem("admin:newTest:preselectedIds");
          sessionStorage.removeItem("admin:newTest:selectedQuestions");
          sessionStorage.removeItem("admin:newTest:suppressClear");
          sessionStorage.removeItem("admin:newTest:inWizard");
        } catch {}
        // Navigate back to grid after a short delay to allow the toast to be seen
  setTimeout(() => {
          router2.push("/admin/tests");
  }, 2000);
      } catch (e: any) {
        const msg = e?.message || "Failed to save test.";
        setToast({ message: msg, type: "error" });
      } finally {
        setSaving(false);
      }
    };
    return (
      <button
        type="button"
        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white text-base font-semibold shadow hover:bg-green-700 transition-colors disabled:opacity-50"
        onClick={runSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Test"}
      </button>
    );
  };

  const handleStepChange = (idx: number) => {
    // Allow moving back freely
    if (idx <= current) {
      // Validate Step 3 as well when navigating away via step icons
      if (current === 2 && step3ValidatorRef.current) {
        const ok = step3ValidatorRef.current();
        if (!ok) return;
      }
      // If leaving Step 4 backward, still validate to keep UX consistent
      if (current === 3 && step4ValidatorRef.current) {
        const ok = step4ValidatorRef.current();
        if (!ok) return;
      }
      if (current === 4 && step5ValidatorRef.current) {
        const ok = step5ValidatorRef.current();
        if (!ok) return;
      }
      setCurrent(idx);
      return;
    }
    // Moving forward: enforce validation for Step 1
    if (current === 0 && step1ValidatorRef.current) {
      const ok = step1ValidatorRef.current();
      if (!ok) return;
    }
    // Moving forward from Step 3 must also pass validation
    if (current === 2 && step3ValidatorRef.current) {
      const ok = step3ValidatorRef.current();
      if (!ok) return;
    }
    if (current === 3 && step4ValidatorRef.current) {
      const ok = step4ValidatorRef.current();
      if (!ok) return;
    }
    if (current === 4 && step5ValidatorRef.current) {
      const ok = step5ValidatorRef.current();
      if (!ok) return;
    }
  setCurrent(idx);
  const params = new URLSearchParams(searchString);
  params.set("step", String(idx + 1));
  router.replace(`?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-[85%] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">{editMode ? "Edit Test" : "Create Test"}</h1>
            </div>
            <div>
              <Link
                href="/admin/tests"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Tests
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="w-[85%] mx-auto px-6 py-8">
  <TestDraftProvider initial={draftInitial ?? {}}>
        {/** Seed categories into draft from session if missing (works for both new and edit flows) **/}
        {(() => {
          function SeedCategoriesHydrator() {
            const { draft, setDraft } = useTestDraft();
            useEffect(() => {
              try {
                const hasCats = Array.isArray((draft as any)?.testAssignedTestCategories) && (draft as any).testAssignedTestCategories.length > 0;
                if (hasCats) return;
                const raw = typeof window !== 'undefined' ? sessionStorage.getItem('admin:newTest:selectedCategoryIds') : null;
                if (!raw) return;
                const ids = JSON.parse(raw);
                if (!Array.isArray(ids) || ids.length === 0) return;
                const uniq = Array.from(new Set(ids.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))));
                if (uniq.length === 0) return;
                setDraft((prev: any) => ({ ...(prev || {}), testAssignedTestCategories: uniq.map((id) => ({ TestCategoryId: id })) }));
              } catch { /* ignore */ }
            }, [draft, setDraft]);
            return null;
          }
          return <SeedCategoriesHydrator />;
        })()}
        {/* Client-side hydration fallback for Edit mode in case SSR fetch failed or session was empty */}
        {editMode && testId ? (
          <EditHydrator testId={testId} normalize={normalizeTestToDraft} />
        ) : null}
        <StepWizard
          steps={steps}
          current={current}
          onStepChange={handleStepChange}
        >
        {current === 0 && (
          <StepSection>
            <Step1CreateTestDetails
              testTypes={testTypes}
              categories={categories}
              instructions={instructions}
              difficultyLevels={difficultyLevels}
              formRef={step1FormRef}
              registerValidator={(fn) => { step1ValidatorRef.current = fn; }}
              infoTitle="Before you start"
              infoDetail="Fill out the test details including name, type, category, and defaults. You can adjust settings later."
            />
          </StepSection>
        )}

        {current === 1 && (
          <StepSection>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Step2TestSettings />
              </div>
              <ImportantInstructions
                title="Settings Guide"
                detail="Configure timing, randomization, and display options for your test. These settings affect the candidate experience."
              />
            </div>
          </StepSection>
        )}

    {current === 2 && (
          <StepSection>
      <Step3AddQuestions editMode={!!editMode} testId={testId} registerValidator={(fn) => { step3ValidatorRef.current = fn; }} />
          </StepSection>
        )}

    {current === 3 && (
          <StepSection>
      <Step4Publish registerValidator={(fn) => { step4ValidatorRef.current = fn; }} />
          </StepSection>
        )}

        {current > 3 && current < stepsLength && (
          <StepSection>
            {current === 4 ? (
              <Step5Assign registerValidator={(fn) => { step5ValidatorRef.current = fn; }} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-4 text-sm text-gray-700">
                  Step {current + 1} content goes here.
                </div>
                <ImportantInstructions
                  title={`Step ${current + 1} Notes`}
                  detail="Follow the guidance for this step. Provide the required data before moving forward."
                />
              </div>
            )}
          </StepSection>
        )}

  <div className="sticky bottom-0 z-20 flex items-center justify-between p-6 border-t bg-white">
          <div className="flex items-center gap-4">
            {current > 0 && (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-300 text-base font-semibold bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
                onClick={handleBack}
              >
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {current < stepsLength - 1 ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-base font-semibold shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
                onClick={handleNext}
              >
                Next
              </button>
            ) : (
              <SaveButton />
            )}
          </div>
        </div>
        </StepWizard>
        {/* Toast outlet */}
        {toast && (
          <div className="fixed top-4 right-4 z-[100]">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </div>
        )}
      </TestDraftProvider>
    </div>
    </div>
  );
}

// Small client-only hydrator to fetch test by id in edit mode if SSR failed or session is empty
function EditHydrator({ testId, normalize }: { testId: number; normalize: (t: any) => any }) {
  const { draft, setDraft } = useTestDraft();
  useEffect(() => {
    let mounted = true;
    (async () => {
      // If already hydrated (has at least a TestName or TestId), skip
      if ((draft && (draft.TestId || draft.TestName)) || !testId) return;
      const res = await clientApiHandler(endpoints.getTestById, { id: testId } as any);
      if (!res.error && res.data && mounted) {
        const d = normalize(res.data);
        setDraft(d);
        try { sessionStorage.setItem('admin:newTest:model', JSON.stringify(d)); } catch {}
      }
    })();
    return () => { mounted = false; };
  }, [testId]);
  return null;
}
