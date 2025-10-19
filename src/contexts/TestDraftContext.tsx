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
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem("admin:newTest:model");
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return initial ?? {};
  });
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
