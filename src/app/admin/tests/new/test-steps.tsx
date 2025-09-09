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
      d.MinimumTimePerQuestion = pick(s0.MinimumTimePerQuestion, s0.minimumTimePerQuestion);
      d.MaximumTimePerQuestion = pick(s0.MaximumTimePerQuestion, s0.maximumTimePerQuestion);
      d.MinimumTimePerSection = pick(s0.MinimumTimePerSection, s0.minimumTimePerSection);
      d.MaximumTimePerSection = pick(s0.MaximumTimePerSection, s0.maximumTimePerSection);

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
          Question = { Questionoptions: normOpts };
        }
        const toNumOrUndef = (v: any) => (v === null || v === undefined || v === "") ? undefined : Number(v);
        return {
          TestQuestionId: Number(
            q?.TestQuestionId ?? q?.testQuestionId ?? q?.QuestionId ?? q?.Question?.QuestionId ?? q?.QuestionID ?? q?.questionId ?? 0
          ),
          Marks: Number(q?.Marks ?? q?.marks ?? 0),
          NegativeMarks: Number(q?.NegativeMarks ?? q?.negativeMarks ?? 0),
          Duration: Number(q?.Duration ?? q?.duration ?? 0),
          TestSectionId: q?.TestSectionId != null ? Number(q.TestSectionId) : q?.testSectionId != null ? Number(q.testSectionId) : undefined,
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
      // Validate final steps before save with feedback
      // Always use step validators to ensure proper validation and error display
      if (step1ValidatorRef.current && !step1ValidatorRef.current()) {
        setToast({ message: "Please complete required fields in Step 1 (Test Details).", type: "error" });
        return;
      }
      if (step3ValidatorRef.current && !step3ValidatorRef.current()) {
        setToast({ message: "Please resolve validation issues in Step 3 (Add Questions).", type: "error" });
        return;
      }
      if (step4ValidatorRef.current && !step4ValidatorRef.current()) {
        setToast({ message: "Please resolve validation issues in Step 4 (Publish).", type: "error" });
        return;
      }
      if (step5ValidatorRef.current && !step5ValidatorRef.current()) {
        setToast({ message: "Please resolve validation issues in Step 5 (Assign).", type: "error" });
        return;
      }
      try {
        setSaving(true);
        
        // Debug: Log the entire draft at the start of save
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Save] Complete draft at save start:', JSON.stringify(draft, null, 2));
        }
        
        // --- Recompute authoritative totals & section aggregates (even if user never visited Step 3 in edit mode) ---
        const rows: any[] = Array.isArray((draft as any)?.testQuestions) ? (draft as any).testQuestions : [];
        const recomputedTotalQuestions = rows.length;
        const recomputedTotalMarks = rows.reduce((sum: number, q: any) => {
          const v = q?.Marks === "" ? 0 : (q?.Marks ?? 0);
          return sum + (Number(v) || 0);
        }, 0);
        // Section stats
        const sectionStats = new Map<number, { q: number; m: number }>();
        for (const q of rows) {
          const sid = Number(q?.TestSectionId ?? q?.TestAssignedSectionId ?? q?.testAssignedSectionId);
          if (!Number.isFinite(sid) || sid <= 0) continue;
          const marks = Number(q?.Marks === "" ? 0 : (q?.Marks ?? 0)) || 0;
          const rec = sectionStats.get(sid) || { q: 0, m: 0 };
          rec.q += 1; rec.m += marks; sectionStats.set(sid, rec);
        }
        // Get assigned sections directly from draft (skip normalization for now to debug)
        let finalAssigned: any[] = [];
        const draftSections = Array.isArray((draft as any)?.TestAssignedSections) ? (draft as any).TestAssignedSections : [];
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Save] Draft sections (before any processing):', JSON.stringify(draftSections, null, 2));
        }
        
        if (draftSections.length > 0) {
          // Use draft sections directly, convert PascalCase to camelCase for API
          finalAssigned = draftSections.map((r: any) => ({
            ...r,
            TestAssignedSectionId: r.TestAssignedSectionId ?? r.testAssignedSectionId ?? r.TestSectionId,
            // Convert to camelCase property names for API
            sectionMinTimeDuration: r.SectionMinTimeDuration ?? r.sectionMinTimeDuration,
            sectionMaxTimeDuration: r.SectionMaxTimeDuration ?? r.sectionMaxTimeDuration,
          }));
        }
        
        // Temporarily disable normalization to debug
        /*
        try {
          // dynamic import only if utility exists
          const mod = await import("@/utils/normalizeAssignedSections");
          
          // Debug: Log draft data before normalization
          if (process.env.NODE_ENV !== 'production') {
            console.log('[Save] Draft before normalization:', JSON.stringify((draft as any)?.TestAssignedSections, null, 2));
          }
          
          const normalized = mod.normalizeAssignedSections(draft || {});
          
          // Debug: Log normalized result
          if (process.env.NODE_ENV !== 'production') {
            console.log('[Save] Normalized result:', JSON.stringify(normalized, null, 2));
          }
          
          if (normalized.length) {
            finalAssigned = normalized.map(r => ({ ...r }));
          }
        } catch { // noop //
        }
        */
  // Do NOT synthesize assigned sections from questions; only update existing selections made in Step 1.
        // Apply stats to assigned sections (dedup again just in case)
        if (finalAssigned.length > 0) {
          const seen = new Map<number, any>();
          for (const r of finalAssigned) {
            const sid = Number(r?.TestAssignedSectionId ?? r?.TestSectionId);
            if (!Number.isFinite(sid) || sid <= 0) continue;
            if (!seen.has(sid)) seen.set(sid, { ...r }); // first wins
          }
          finalAssigned = Array.from(seen.values());
          finalAssigned.sort((a,b)=>(a.SectionOrder||0)-(b.SectionOrder||0));
          finalAssigned.forEach((r,i)=>{ r.SectionOrder = i+1; });
          for (const row of finalAssigned) {
            const sid = Number(row.TestAssignedSectionId ?? row.TestSectionId);
            const stats = sectionStats.get(sid) || { q: 0, m: 0 };
            row.SectionTotalQuestions = stats.q;
            row.SectionTotalMarks = stats.m;
            // Ensure canonical id present
            row.TestAssignedSectionId = sid;
            
            // Debug logging for time values
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[Save] Section ${sid} time values:`, {
                SectionMinTimeDuration: row.SectionMinTimeDuration,
                SectionMaxTimeDuration: row.SectionMaxTimeDuration,
                SectionMinTime: row.SectionMinTime,
                SectionMaxTime: row.SectionMaxTime
              });
            }
            
            // Preserve existing per-section min/max time values (do not override if user set them in Step1)
            if (row.SectionMinTimeDuration === undefined && row.SectionMinTime !== undefined) {
              row.SectionMinTimeDuration = row.SectionMinTime;
            }
            if (row.SectionMaxTimeDuration === undefined && row.SectionMaxTime !== undefined) {
              row.SectionMaxTimeDuration = row.SectionMaxTime;
            }
          }
        }
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
          TestSectionId: toNum(r?.TestSectionId),
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
          MinimumTimePerQuestion: d2.MinimumTimePerQuestion ?? null,
          MaximumTimePerQuestion: d2.MaximumTimePerQuestion ?? null,
          MinimumTimePerSection: d2.MinimumTimePerSection ?? null,
          MaximumTimePerSection: d2.MaximumTimePerSection ?? null,

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
          ...(finalAssigned.length ? { TestAssignedSections: finalAssigned } : {}),
          TestStatus:
            String((draft as any)?.TestStatus || "New").toLowerCase() === "published"
              ? "Published"
              : "New",
          TestQuestions: testQuestions,
          TestSettings: [settings0],
          // Persist independent selections from Step 5 so server can accept either-or
          SelectedCandidateGroupIds: Array.isArray((draft as any)?.SelectedCandidateGroupIds) ? (draft as any).SelectedCandidateGroupIds : [],
          SelectedProductIds: Array.isArray((draft as any)?.SelectedProductIds) ? (draft as any).SelectedProductIds : [],
        };
        
        // Debug logging for TestAssignedSections
        if (process.env.NODE_ENV !== 'production' && finalAssigned.length > 0) {
          console.log('[Save] TestAssignedSections being sent:', JSON.stringify(finalAssigned, null, 2));
          console.log('[Save] Payload TestAssignedSections:', JSON.stringify(payload.TestAssignedSections, null, 2));
        }
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
          "MinimumTimePerQuestion",
          "MaximumTimePerQuestion",
          "MinimumTimePerSection",
          "MaximumTimePerSection",
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

  // Consider it edit if explicit flags are set OR if the draft carries a TestId
        const isEdit = (!!editMode && !!testId) || !!(draft as any)?.TestId;
        const updateId: number | undefined = (testId as number | undefined) ?? ((draft as any)?.TestId as number | undefined);
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
