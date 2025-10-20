"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type TestDraft = Record<string, any>;

type Ctx = {
  draft: TestDraft;
  setDraft: React.Dispatch<React.SetStateAction<TestDraft>>;
};

const TestDraftContext = createContext<Ctx | undefined>(undefined);

export function TestDraftProvider({ children, initial }: { children: React.ReactNode; initial?: TestDraft }) {
  const [draft, setDraft] = useState<TestDraft>(() => {
    // Decide between session and initial. For Edit mode (initial with a valid TestId), prefer initial
    // especially if session is empty or refers to a different test.
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem("admin:newTest:model");
        const fromSession = raw ? JSON.parse(raw) : null;
        const initialId = Number((initial as any)?.TestId);
        const sessionId = Number((fromSession as any)?.TestId);
        const hasInitialId = Number.isFinite(initialId) && initialId > 0;
        const hasSession = fromSession && Object.keys(fromSession).length > 0;
        // If editing a specific test, and session is empty or for a different test, use initial
        if (hasInitialId && (!hasSession || (Number.isFinite(sessionId) && sessionId !== initialId) || !Number.isFinite(sessionId))) {
          return initial as TestDraft;
        }
        if (hasSession) return fromSession as TestDraft;
      } catch {}
    }
    return (initial as TestDraft) ?? {};
  });
  // One-time seeding: if categories are missing in the cached draft, seed from session snapshot
  useEffect(() => {
    try {
      const d: any = draft || {};
      const hasCats = Array.isArray(d.testAssignedTestCategories) && d.testAssignedTestCategories.length > 0;
      if (!hasCats && typeof window !== 'undefined') {
        const raw = sessionStorage.getItem('admin:newTest:selectedCategoryIds');
        if (raw) {
          const ids = JSON.parse(raw);
          if (Array.isArray(ids) && ids.length > 0) {
            const uniq = Array.from(new Set(ids.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))));
            if (uniq.length > 0) {
              setDraft((prev: any) => ({ ...(prev || {}), testAssignedTestCategories: uniq.map((id) => ({ TestCategoryId: id })) }));
            }
          }
        }
      }
    } catch { /* ignore */ }
    // run once after initial state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // One-time normalization to ensure Question.Subject has ParentSubjectName/Id for Step 3
  useEffect(() => {
    try {
      const d = draft as any;
      const qs: any[] = Array.isArray(d?.testQuestions) ? d.testQuestions : [];
      if (!qs.length) return;
      let changed = false;
      const updated = qs.map((q: any) => {
        const subj = q?.Question?.Subject;
        const lower = q?.Question?.subject;
        const alt = q?.question?.subject || q?.question?.Subject;
        const parentName = subj?.ParentSubjectName ?? lower?.parentSubjectName ?? alt?.parentSubjectName ?? q?.ParentSubjectName ?? q?.parentSubjectName ?? q?.Question?.ParentSubjectName ?? null;
        const parentId = subj?.ParentSubjectId ?? lower?.parentSubjectId ?? alt?.parentSubjectId ?? q?.ParentSubjectId ?? q?.parentSubjectId ?? q?.Question?.ParentSubjectId ?? null;
        const childName = subj?.SubjectName ?? lower?.subjectName ?? alt?.subjectName ?? q?.SubjectName ?? q?.subjectName ?? q?.Question?.SubjectName ?? null;
        const childId = subj?.SubjectId ?? lower?.subjectId ?? alt?.subjectId ?? q?.SubjectId ?? q?.subjectId ?? q?.Question?.SubjectId ?? null;
        const needSubjectContainer = !q?.Question?.Subject && (parentName != null || parentId != null || childName != null || childId != null);
        const needParentName = !!q?.Question && (!q?.Question?.Subject?.ParentSubjectName && parentName != null);
        const needParentId = !!q?.Question && (!q?.Question?.Subject?.ParentSubjectId && parentId != null);
        const needChildName = !!q?.Question && (!q?.Question?.Subject?.SubjectName && childName != null);
        const needChildId = !!q?.Question && (!q?.Question?.Subject?.SubjectId && childId != null);
        if (needSubjectContainer || needParentName || needParentId || needChildName || needChildId) {
          changed = true;
          return {
            ...q,
            Question: {
              ...(q?.Question || {}),
              Subject: {
                ...(q?.Question?.Subject || {}),
                ...(parentName != null ? { ParentSubjectName: parentName } : {}),
                ...(parentId != null ? { ParentSubjectId: parentId } : {}),
                ...(childName != null ? { SubjectName: childName } : {}),
                ...(childId != null ? { SubjectId: childId } : {}),
              },
            },
          };
        }
        return q;
      });
      if (changed) {
        setDraft((prev) => ({ ...(prev || {}), testQuestions: updated }));
      }
    } catch { /* ignore */ }
    // Run once on mount to upgrade legacy session data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Persist on every change
  useEffect(() => {
    try {
      sessionStorage.setItem("admin:newTest:model", JSON.stringify(draft));
    } catch {}
  }, [draft]);
  // Always defer draft updates to the next microtask to avoid setState during another component's render
  const setDraftDeferred: React.Dispatch<React.SetStateAction<TestDraft>> = useMemo(() => {
    return ((action: React.SetStateAction<TestDraft>) => {
      const run = () => {
        if (typeof action === "function") {
          setDraft((prev) => (action as (prev: TestDraft) => TestDraft)(prev));
        } else {
          setDraft(action);
        }
      };
      if (typeof queueMicrotask === "function") {
        queueMicrotask(run);
      } else {
        setTimeout(run, 0);
      }
    }) as React.Dispatch<React.SetStateAction<TestDraft>>;
  }, []);
  const value = useMemo(() => ({ draft, setDraft: setDraftDeferred }), [draft, setDraftDeferred]);
  return <TestDraftContext.Provider value={value}>{children}</TestDraftContext.Provider>;
}

export function useTestDraft() {
  const ctx = useContext(TestDraftContext);
  if (!ctx) throw new Error("useTestDraft must be used within TestDraftProvider");
  return ctx;
}
