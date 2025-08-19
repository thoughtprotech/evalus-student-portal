"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type TestDraft = Record<string, any>;

type Ctx = {
  draft: TestDraft;
  setDraft: React.Dispatch<React.SetStateAction<TestDraft>>;
};

const TestDraftContext = createContext<Ctx | undefined>(undefined);

export function TestDraftProvider({ children, initial }: { children: React.ReactNode; initial?: TestDraft }) {
  const [draft, setDraft] = useState<TestDraft>(initial ?? {});
  const value = useMemo(() => ({ draft, setDraft }), [draft]);
  return <TestDraftContext.Provider value={value}>{children}</TestDraftContext.Provider>;
}

export function useTestDraft() {
  const ctx = useContext(TestDraftContext);
  if (!ctx) throw new Error("useTestDraft must be used within TestDraftProvider");
  return ctx;
}
