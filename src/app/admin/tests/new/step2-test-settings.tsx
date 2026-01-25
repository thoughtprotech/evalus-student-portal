"use client";

import { useEffect, useState, useRef } from "react";
import YesNoToggle from "@/components/ui/YesNoToggle";
import TogglePair from "@/components/ui/TogglePair";
import { useTestDraft } from "@/contexts/TestDraftContext";

// Helper transforms for mapping UI state <-> draft (DTO)
const toUlong = (b: boolean): number => (b ? 1 : 0);
const fromUlong = (v: any): boolean => v === 1 || v === "1" || v === true;

const toNumberOrNull = (v: string): number | null => (v.trim() === "" ? null : Number(v));

// Schedule handling moved to Step 4; local date/time helpers no longer needed here.

export default function Step2TestSettings() {
  const { draft, setDraft } = useTestDraft();

  // Grouping & Randomization
  // Default Group by Subjects = true (unless explicitly set in draft)
  const [groupBySubjects, setGroupBySubjects] = useState(true);
  const [numberBySections, setNumberBySections] = useState(false);
  const [randomizeByTopics, setRandomizeByTopics] = useState(false);
  const [randomizeAnswerOptions, setRandomizeAnswerOptions] = useState(false);
  // Helper to coerce mixed backend truthy representations
  const coerceBool = (v: any): boolean => {
    if (v === 1 || v === "1" || v === true) return true;
    if (typeof v === "string" && v.trim().toLowerCase() === "true") return true;
    return false;
  };
  const initialAllowMultipleAttempts = (() => {
    const d: any = draft || {};
    const variants = [
      d?.AllowMultipleAttempts,
      d?.allowMultipleAttempts,
      d?.AllowMultipleAttempt,
      d?.allowMultipleAttempt,
      d?.Allowmultipleattempts,
      d?.allowmultipleattempts,
    ];
    const first = variants.find((v) => v !== undefined && v !== null);
    return coerceBool(first);
  })();
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(initialAllowMultipleAttempts);
  const [attemptAll, setAttemptAll] = useState(false);
  const [displayMarks, setDisplayMarks] = useState(false);
  const [durationBasedOnSection, setDurationBasedOnSection] = useState(false);

  // Time configuration removed per requirement (UI no longer exposes these settings)

  // Visibility & Logging
  const [lockSectionsOnSubmission, setLockSectionsOnSubmission] = useState(false);
  const [logTestActivity, setLogTestActivity] = useState(false);
  const [displayTestTime, setDisplayTestTime] = useState(false);
  const [displaySectionTime, setDisplaySectionTime] = useState(false);

  // Scoring
  const [testMinimumPassMarks, setTestMinimumPassMarks] = useState<string>("");

  // Feedback messages
  const [completionMsg, setCompletionMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [failMsg, setFailMsg] = useState("");
  const [submissionMsg, setSubmissionMsg] = useState("");

  // Ranking & results
  const [automaticRankCalculation, setAutomaticRankCalculation] = useState(false);
  const [allowDuplicateRank, setAllowDuplicateRank] = useState(false);
  const [skipRankForDuplicateTank, setSkipRankForDuplicateTank] = useState(false);
  // Removed: Allow Test Pause/Resume, Detailed Test Report on Completion, Treat Negative Score as Zero

  // Schedule removed from Step 2

  // Normalize & default AllowMultipleAttempts (default = true if absent)
  const normalizedAllowMultipleAttempts = useRef(false);
  useEffect(() => {
    if (!draft || normalizedAllowMultipleAttempts.current) return;
    const d: any = draft;
    const variantKeys = [
      'AllowMultipleAttempts','allowMultipleAttempts','AllowMultipleAttempt','allowMultipleAttempt','Allowmultipleattempts','allowmultipleattempts'
    ];
    let firstDefined: any = undefined; let sourceKey: string | null = null;
    for (const k of variantKeys) {
      if (d[k] !== undefined && d[k] !== null) { firstDefined = d[k]; sourceKey = k; break; }
    }
    const hasCanonical = d.AllowMultipleAttempts !== undefined && d.AllowMultipleAttempts !== null;
    // Determine canonical value: if anything defined use coercion; else default TRUE (1)
    const canonicalBool = hasCanonical
      ? (d.AllowMultipleAttempts === 1 || d.AllowMultipleAttempts === '1' || d.AllowMultipleAttempts === true || String(d.AllowMultipleAttempts).toLowerCase() === 'true')
      : (firstDefined !== undefined
          ? (firstDefined === 1 || firstDefined === '1' || firstDefined === true || String(firstDefined).toLowerCase() === 'true')
          : true);
    setDraft((prev: any) => {
      const copy = { ...(prev || {}) };
      // Remove all variant keys except canonical
      for (const k of variantKeys) {
        if (k !== 'AllowMultipleAttempts') delete copy[k];
      }
      copy.AllowMultipleAttempts = canonicalBool ? 1 : 0;
      return copy;
    });
    normalizedAllowMultipleAttempts.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Ensure default: if GroupQuestionsBySubjects not present in draft, set to 1 (true)
  useEffect(() => {
    if (!draft) return;
    if (draft.GroupQuestionsBySubjects === undefined || draft.GroupQuestionsBySubjects === null) {
      setDraft((d: any) => ({ ...(d || {}), GroupQuestionsBySubjects: 1 }));
      setGroupBySubjects(true);
    }
  }, [draft, setDraft]);

  // Hydrate from draft
  useEffect(() => {
    if (!draft) return;
    setGroupBySubjects(fromUlong(draft.GroupQuestionsBySubjects));
    setNumberBySections(fromUlong(draft.QuestionNumberingBySections));
  // Force Randomize by Topics off regardless of draft value
  setRandomizeByTopics(false);
    setRandomizeAnswerOptions(fromUlong(draft.RandomizeAnswerOptionsByQuestions));
    // Hydrate AllowMultipleAttempts with variant detection (in case canonical promotion hasn't happened yet)
    const amaVariants = [
      draft.AllowMultipleAttempts,
      (draft as any).allowMultipleAttempts,
      (draft as any).AllowMultipleAttempt,
      (draft as any).allowMultipleAttempt,
      (draft as any).Allowmultipleattempts,
      (draft as any).allowmultipleattempts,
    ];
  const firstDefined = amaVariants.find(v => v !== undefined && v !== null);
  // If still undefined after normalization default true
  setAllowMultipleAttempts(firstDefined === undefined ? true : coerceBool(firstDefined));
    setAttemptAll(fromUlong(draft.AttemptAllQuestions));
    setDisplayMarks(fromUlong(draft.DisplayMarksDuringTest));
    setDurationBasedOnSection(fromUlong(draft.SectionBasedTestDuration));

  // Removed: Time limits hydration (Minimum/Maximum test/section/question times)

    setLockSectionsOnSubmission(fromUlong(draft.LockSectionsOnSubmission));
    setLogTestActivity(fromUlong(draft.LogTestActivity));
    setDisplayTestTime(fromUlong(draft.DisplayTestTime));
    setDisplaySectionTime(fromUlong(draft.DisplaySectionTime));

    setTestMinimumPassMarks(draft.TestMinimumPassMarks != null ? String(draft.TestMinimumPassMarks) : "");

    setCompletionMsg(draft.TestCompletionMessage ?? "");
    setPassMsg(draft.TestPassFeedbackMessage ?? "");
    setFailMsg(draft.TestFailFeedbackMessage ?? "");
    setSubmissionMsg(draft.TestSubmissionMessage ?? "");

    setAutomaticRankCalculation(fromUlong(draft.AutomaticRankCalculation));
    setAllowDuplicateRank(fromUlong(draft.AllowDuplicateRank));
    setSkipRankForDuplicateTank(fromUlong(draft.SkipRankForDuplicateTank));
  // Removed fields hydration

  // Schedule hydration removed; handled in Step 4
  }, [draft]);

  // Enforce: ensure draft.RandomizeQuestionByTopics is 0 (false) after hydration
  useEffect(() => {
    if (!draft) return;
    if (draft.RandomizeQuestionByTopics !== 0) {
      setDraft((d: any) => ({ ...(d || {}), RandomizeQuestionByTopics: 0 }));
    }
  }, [draft?.RandomizeQuestionByTopics, setDraft]);

  return (
    <div className="space-y-4">
      {/* Row: Grouping & Randomization | Visibility & Locking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Grouping & Randomization */}
        <section className="border rounded-lg bg-white shadow-sm">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">Grouping & Randomization</div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Group Questions by Subjects</span>
                <YesNoToggle
                  className="shrink-0"
                  size="sm"
                  segmentWidthClass="w-10 h-5 text-xs"
                  value={groupBySubjects}
                  onChange={(v) => {
                    setGroupBySubjects(v);
                    setDraft((d: any) => ({ ...d, GroupQuestionsBySubjects: toUlong(v) }));
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Question Numbering by Sections</span>
                <TogglePair<boolean>
                  value={numberBySections}
                  onChange={(v: boolean) => {
                    setNumberBySections(v);
                    setDraft((d: any) => ({ ...d, QuestionNumberingBySections: toUlong(v) }));
                  }}
                  left={{ label: "By Section", value: true }}
                  right={{ label: "By Test", value: false }}
                  size="sm"
                  equalWidth
                  segmentWidthClass="w-24"
                />
              </div>
              {/* Randomize Questions by Topics hidden and forced off */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Randomize Answer Options by Questions</span>
                <YesNoToggle
                  className="shrink-0"
                  size="sm"
                  segmentWidthClass="w-10 h-5 text-xs"
                  value={randomizeAnswerOptions}
                  onChange={(v) => {
                    setRandomizeAnswerOptions(v);
                    setDraft((d: any) => ({ ...d, RandomizeAnswerOptionsByQuestions: toUlong(v) }));
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Section-Based Test Duration</span>
                <YesNoToggle
                  className="shrink-0"
                  size="sm"
                  segmentWidthClass="w-10 h-5 text-xs"
                  value={durationBasedOnSection}
                  onChange={(v) => {
                    setDurationBasedOnSection(v);
                    setDraft((d: any) => ({ ...d, SectionBasedTestDuration: toUlong(v) }));
                  }}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Attempt All Questions</span>
                <YesNoToggle
                  className="shrink-0"
                  size="sm"
                  segmentWidthClass="w-10 h-5 text-xs"
                  value={attemptAll}
                  onChange={(v) => {
                    setAttemptAll(v);
                    setDraft((d: any) => ({ ...d, AttemptAllQuestions: toUlong(v) }));
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Display Marks During Test</span>
                <YesNoToggle
                  className="shrink-0"
                  size="sm"
                  segmentWidthClass="w-10 h-5 text-xs"
                  value={displayMarks}
                  onChange={(v) => {
                    setDisplayMarks(v);
                    setDraft((d: any) => ({ ...d, DisplayMarksDuringTest: toUlong(v) }));
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Allow Multiple Attempts</span>
                <YesNoToggle
                  className="shrink-0"
                  size="sm"
                  segmentWidthClass="w-10 h-5 text-xs"
                  value={allowMultipleAttempts}
                  onChange={(v) => {
                    setAllowMultipleAttempts(v);
                    setDraft((d: any) => ({ ...d, AllowMultipleAttempts: toUlong(v) }));
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Visibility & Locking */}
        <section className="border rounded-lg bg-white shadow-sm">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">Visibility & Locking</div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Display Test Time</span>
                <YesNoToggle
                  className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs"
                  value={displayTestTime}
                  onChange={(v) => { setDisplayTestTime(v); setDraft((d: any) => ({ ...d, DisplayTestTime: toUlong(v) })); }}
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Display Section Time</span>
                <YesNoToggle
                  className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs"
                  value={displaySectionTime}
                  onChange={(v) => { setDisplaySectionTime(v); setDraft((d: any) => ({ ...d, DisplaySectionTime: toUlong(v) })); }}
                />
              </label>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Lock Sections on Submission</span>
                <YesNoToggle
                  className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs"
                  value={lockSectionsOnSubmission}
                  onChange={(v) => { setLockSectionsOnSubmission(v); setDraft((d: any) => ({ ...d, LockSectionsOnSubmission: toUlong(v) })); }}
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Log Test Activity</span>
                <YesNoToggle
                  className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs"
                  value={logTestActivity}
                  onChange={(v) => { setLogTestActivity(v); setDraft((d: any) => ({ ...d, LogTestActivity: toUlong(v) })); }}
                />
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Feedback Messages (moved above Scoring) */}
      <section className="border rounded-lg bg-white shadow-sm">
        <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">Feedback Messages</div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="grid gap-2 md:col-span-2">
            <label className="text-gray-800">Test Completion Message</label>
            <textarea className="w-full min-h-[72px] border rounded-md px-3 py-2" value={completionMsg} onChange={(e) => { const v = e.target.value; setCompletionMsg(v); setDraft((d: any) => ({ ...d, TestCompletionMessage: v })); }} />
          </div>
          <div className="grid gap-2">
            <label className="text-gray-800">Test Pass Feedback Message</label>
            <textarea className="w-full min-h-[72px] border rounded-md px-3 py-2" value={passMsg} onChange={(e) => { const v = e.target.value; setPassMsg(v); setDraft((d: any) => ({ ...d, TestPassFeedbackMessage: v })); }} />
          </div>
          <div className="grid gap-2">
            <label className="text-gray-800">Test Fail Feedback Message</label>
            <textarea className="w-full min-h-[72px] border rounded-md px-3 py-2" value={failMsg} onChange={(e) => { const v = e.target.value; setFailMsg(v); setDraft((d: any) => ({ ...d, TestFailFeedbackMessage: v })); }} />
          </div>
        </div>
      </section>

      {/* Row: Scoring | Ranking & Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scoring */}
        <section className="border rounded-lg bg-white shadow-sm">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">Scoring</div>
          <div className="p-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-800 mb-1">Test Minimum Pass Marks</label>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={testMinimumPassMarks}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTestMinimumPassMarks(v);
                    setDraft((d: any) => ({ ...d, TestMinimumPassMarks: v.trim() === "" ? null : Number(v) }));
                  }}
                  placeholder="e.g., 40"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Ranking & Results */}
        <section className="border rounded-lg bg-white shadow-sm">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">Ranking & Results</div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Automatic Rank Calculation</span>
                <YesNoToggle className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={automaticRankCalculation} onChange={(v) => { setAutomaticRankCalculation(v); setDraft((d: any) => ({ ...d, AutomaticRankCalculation: toUlong(v) })); }} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Allow Duplicate Rank</span>
                <YesNoToggle className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={allowDuplicateRank} onChange={(v) => { setAllowDuplicateRank(v); setDraft((d: any) => ({ ...d, AllowDuplicateRank: toUlong(v) })); }} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Skip Rank for Duplicate Rank</span>
                <YesNoToggle className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={skipRankForDuplicateTank} onChange={(v) => { setSkipRankForDuplicateTank(v); setDraft((d: any) => ({ ...d, SkipRankForDuplicateTank: toUlong(v) })); }} />
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Schedule moved to Step 4 */}
    </div>
  );
}
