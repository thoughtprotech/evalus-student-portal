"use client";

import { useEffect, useState } from "react";
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
  const [groupBySubjects, setGroupBySubjects] = useState(false);
  const [numberBySections, setNumberBySections] = useState(false);
  const [randomizeByTopics, setRandomizeByTopics] = useState(false);
  const [randomizeAnswerOptions, setRandomizeAnswerOptions] = useState(false);
  const [attemptAll, setAttemptAll] = useState(false);
  const [displayMarks, setDisplayMarks] = useState(false);

  // Time configuration
  const [minTestTime, setMinTestTime] = useState<string>("");
  const [maxTestTimePer, setMaxTestTimePer] = useState<string>("");
  const [minTimePerQ, setMinTimePerQ] = useState<string>("");
  const [maxTimePerQ, setMaxTimePerQ] = useState<string>("");
  const [minTimePerSection, setMinTimePerSection] = useState<string>("");
  const [maxTimePerSection, setMaxTimePerSection] = useState<string>("");

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

  // Hydrate from draft
  useEffect(() => {
    if (!draft) return;
    setGroupBySubjects(fromUlong(draft.GroupQuestionsBySubjects));
    setNumberBySections(fromUlong(draft.QuestionNumberingBySections));
  // Force Randomize by Topics off regardless of draft value
  setRandomizeByTopics(false);
    setRandomizeAnswerOptions(fromUlong(draft.RandomizeAnswerOptionsByQuestions));
    setAttemptAll(fromUlong(draft.AttemptAllQuestions));
    setDisplayMarks(fromUlong(draft.DisplayMarksDuringTest));

    setMinTestTime(draft.MinimumTestTime != null ? String(draft.MinimumTestTime) : "");
    setMaxTestTimePer(draft.MaximumTestTimePer != null ? String(draft.MaximumTestTimePer) : "");
    setMinTimePerQ(draft.MinimumTimePerQuestion != null ? String(draft.MinimumTimePerQuestion) : "");
    setMaxTimePerQ(draft.MaximumTimePerQuestion != null ? String(draft.MaximumTimePerQuestion) : "");
    setMinTimePerSection(draft.MinimumTimePerSection != null ? String(draft.MinimumTimePerSection) : "");
    setMaxTimePerSection(draft.MaximumTimePerSection != null ? String(draft.MaximumTimePerSection) : "");

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
                right={{ label: "Continuous", value: false }}
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
          </div>
        </div>
      </section>

      {/* Time Limits */}
      <section className="border rounded-lg bg-white shadow-sm">
        <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">Time Limits</div>
        <div className="p-4 space-y-4 text-sm">
          {/* Row 1: Min/Max Test Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-800 mb-1">Minimum Test Time (mins)</label>
              <input
                type="number"
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={minTestTime}
                onChange={(e) => {
                  const v = e.target.value;
                  setMinTestTime(v);
                  setDraft((d: any) => ({ ...d, MinimumTestTime: toNumberOrNull(v) }));
                }}
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <label className="block text-gray-800 mb-1">Maximum Test Time (mins)</label>
              <input
                type="number"
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={maxTestTimePer}
                onChange={(e) => {
                  const v = e.target.value;
                  setMaxTestTimePer(v);
                  setDraft((d: any) => ({ ...d, MaximumTestTimePer: toNumberOrNull(v) }));
                }}
                placeholder="e.g., 120"
              />
            </div>
          </div>

          {/* Row 2: Min/Max Time per Question */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-800 mb-1">Minimum Time per Question (secs)</label>
              <input
                type="number"
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={minTimePerQ}
                onChange={(e) => {
                  const v = e.target.value;
                  setMinTimePerQ(v);
                  setDraft((d: any) => ({ ...d, MinimumTimePerQuestion: toNumberOrNull(v) }));
                }}
                placeholder="e.g., 30"
              />
            </div>
            <div>
              <label className="block text-gray-800 mb-1">Maximum Time per Question (secs)</label>
              <input
                type="number"
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={maxTimePerQ}
                onChange={(e) => {
                  const v = e.target.value;
                  setMaxTimePerQ(v);
                  setDraft((d: any) => ({ ...d, MaximumTimePerQuestion: toNumberOrNull(v) }));
                }}
                placeholder="e.g., 120"
              />
            </div>
          </div>

          {/* Row 3: Min/Max Time per Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-800 mb-1">Minimum Time per Section (mins)</label>
              <input
                type="number"
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={minTimePerSection}
                onChange={(e) => {
                  const v = e.target.value;
                  setMinTimePerSection(v);
                  setDraft((d: any) => ({ ...d, MinimumTimePerSection: toNumberOrNull(v) }));
                }}
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <label className="block text-gray-800 mb-1">Maximum Time per Section (mins)</label>
              <input
                type="number"
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={maxTimePerSection}
                onChange={(e) => {
                  const v = e.target.value;
                  setMaxTimePerSection(v);
                  setDraft((d: any) => ({ ...d, MaximumTimePerSection: toNumberOrNull(v) }));
                }}
                placeholder="e.g., 60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Visibility & Logging */}
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

      {/* Feedback Messages */}
      <section className="border rounded-lg bg-white shadow-sm">
        <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">Feedback Messages</div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="grid gap-2">
            <label className="text-gray-800">Test Completion Message</label>
            <textarea className="w-full min-h-[72px] border rounded-md px-3 py-2" value={completionMsg} onChange={(e) => { const v = e.target.value; setCompletionMsg(v); setDraft((d: any) => ({ ...d, TestCompletionMessage: v })); }} />
          </div>
          <div className="grid gap-2">
            <label className="text-gray-800">Test Submission Message</label>
            <textarea className="w-full min-h-[72px] border rounded-md px-3 py-2" value={submissionMsg} onChange={(e) => { const v = e.target.value; setSubmissionMsg(v); setDraft((d: any) => ({ ...d, TestSubmissionMessage: v })); }} />
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

      {/* Ranking & Results / Resume & Breaks */}
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
              <span className="text-gray-800">Skip Rank for Duplicate Tank</span>
              <YesNoToggle className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={skipRankForDuplicateTank} onChange={(v) => { setSkipRankForDuplicateTank(v); setDraft((d: any) => ({ ...d, SkipRankForDuplicateTank: toUlong(v) })); }} />
            </label>
          </div>
          {/* Right column removed per requirements */}
        </div>
      </section>

  {/* Schedule moved to Step 4 */}
    </div>
  );
}
