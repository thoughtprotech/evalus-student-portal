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
