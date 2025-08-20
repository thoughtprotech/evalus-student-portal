"use client";

import { useState } from "react";
import InfoTooltip from "@/components/InfoTooltip";
import Accordion from "@/components/Accordion";
import YesNoToggle from "@/components/ui/YesNoToggle";
import TogglePair from "@/components/ui/TogglePair";
import { useTestDraft } from "@/contexts/TestDraftContext";

export default function Step2TestSettings() {
  const [groupBySubject, setGroupBySubject] = useState(false);
  const [groupByTopic, setGroupByTopic] = useState(false);
  const [numberingMode, setNumberingMode] = useState<"section" | "continuous">(
    "continuous"
  );
  const [shuffleWithinTopics, setShuffleWithinTopics] = useState(true);
  const [shuffleAnswerOptions, setShuffleAnswerOptions] = useState(true);
  // Test Options state
  const [mandateAll, setMandateAll] = useState(false);
  const [showMarks, setShowMarks] = useState(true);
  const [showSpeed, setShowSpeed] = useState(false);
  const [partialMarking, setPartialMarking] = useState(false);
  const [scientificCalc, setScientificCalc] = useState(false);
  const [alertEmpty, setAlertEmpty] = useState(false);
  const [secureBrowser, setSecureBrowser] = useState(false);
  const [submitTimeLeft, setSubmitTimeLeft] = useState<number | "">(0);
  const [minTimePerQ, setMinTimePerQ] = useState<number | "">(0);
  const [mobileAppRestriction, setMobileAppRestriction] = useState(false);

  const [allowNav, setAllowNav] = useState(true);
  const [multiLangUI, setMultiLangUI] = useState(false);
  const [webhooks, setWebhooks] = useState(false);
  const [defaultCalc, setDefaultCalc] = useState(false);
  const [watermark, setWatermark] = useState(false);
  const [dndMobile, setDndMobile] = useState(false);
  const [activityLog, setActivityLog] = useState(true);
  const [maxQuestionAttempt, setMaxQuestionAttempt] = useState<number | "">(0);
  const [numericOptions, setNumericOptions] = useState(false);
  const [mobileRestriction, setMobileRestriction] = useState(false);
  const [essayList, setEssayList] = useState(false);

  // Time Setting state
  const { draft, setDraft } = useTestDraft();
  const [displayTimeBound, setDisplayTimeBound] = useState(true);
  const [clockFormat, setClockFormat] = useState<"hh:mm" | "mm:ss">("mm:ss");
  const [sections, setSections] = useState(false);
  const [sectionInstructions, setSectionInstructions] = useState(false);
  const [sampleQuestionPerSection, setSampleQuestionPerSection] = useState(false);
  const [topicAttemptLimits, setTopicAttemptLimits] = useState(false);
  const [individualTimePerQAll, setIndividualTimePerQAll] = useState(false);
  const [essaySpecificTimeAll, setEssaySpecificTimeAll] = useState(false);
  const [minimumQuestionWiseTimeAll, setMinimumQuestionWiseTimeAll] = useState(false);

  // End Test Setting state
  const [showPersonalizedMessage, setShowPersonalizedMessage] = useState(false);
  const [feedbackPass, setFeedbackPass] = useState("");
  const [feedbackFail, setFeedbackFail] = useState("");
  const [displaySubmissionMessage, setDisplaySubmissionMessage] = useState("");
  const [setScoreEnabled, setSetScoreEnabled] = useState(false);
  const [minPassingPercent, setMinPassingPercent] = useState<number | "">("");
  const [studyPortalEnabled, setStudyPortalEnabled] = useState(false);

  // Generate Rank state
  const [generateRankMode, setGenerateRankMode] = useState<"automatic" | "manual">("automatic");
  const [allowDuplicateRanks, setAllowDuplicateRanks] = useState(false);
  const [skipRankAfterDuplicate, setSkipRankAfterDuplicate] = useState(false);

  // Test Attempt & Resume state
  const [multipleAttempt, setMultipleAttempt] = useState(false);
  const [testResume, setTestResume] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [candidateInitiatedBreaks, setCandidateInitiatedBreaks] = useState(false);
  const [allowBioBreaks, setAllowBioBreaks] = useState(false);
  const [showDetailedPerformanceReports, setShowDetailedPerformanceReports] = useState(false);
  const [treatNegativeAsZero, setTreatNegativeAsZero] = useState(false);
  const [enableWhitelistedWebsite, setEnableWhitelistedWebsite] = useState(false);

  // Controlled accordions: only one open at a time
  const [openSection, setOpenSection] = useState<
    | "grouping"
    | "options"
    | "time"
    | "end"
    | "rank"
    | "attempt"
    | "bio"
    | "report"
    | "whitelist"
    | null
  >("grouping");

  return (
    <div className="space-y-4">
      {/* Grouping & Shuffling */}
      <Accordion
        title="Grouping & Shuffling"
        isOpen={openSection === "grouping"}
        onToggle={(next) => setOpenSection(next ? "grouping" : null)}
      >
        <div className="border rounded-lg bg-white shadow-sm">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">
            Organize questions and randomize their order and answer options
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grouping (left column) */}
            <div className="space-y-2 border rounded-md p-3 bg-gray-50">
              <div className="text-sm font-semibold text-gray-800">Grouping</div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700">
                  Group Questions by Subject Area
                </span>
                <YesNoToggle className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={groupBySubject} onChange={setGroupBySubject} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700">
                  Group Questions by Topic
                </span>
                <YesNoToggle className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={groupByTopic} onChange={setGroupByTopic} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700">
                  Choose Section-Specific Question Numbering
                </span>
                <TogglePair
                  value={numberingMode}
                  onChange={setNumberingMode}
                  left={{ label: "By Section", value: "section" }}
                  right={{ label: "Continuous", value: "continuous" }}
                  size="sm"
                  className="shrink-0"
                  equalWidth
                  segmentWidthClass="w-24 h-6 text-xs"
                />
              </div>
            </div>

            {/* Shuffling (right column) */}
            <div className="space-y-2 border rounded-md p-3 bg-gray-50">
              <div className="text-sm font-semibold text-gray-800">Shuffling</div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700">
                  Randomize Question Order Within Topics
                </span>
                <YesNoToggle className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={shuffleWithinTopics} onChange={setShuffleWithinTopics} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700">
                  Randomize Answer Options Within Questions
                </span>
                <YesNoToggle className="shrink-0" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={shuffleAnswerOptions} onChange={setShuffleAnswerOptions} />
              </div>
            </div>
          </div>
        </div>
      </Accordion>

      {/* Test Options */}
      <Accordion
        title="Test Options"
        isOpen={openSection === "options"}
        onToggle={(next) => setOpenSection(next ? "options" : null)}
      >
        <div className="border rounded-lg bg-white shadow-sm">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">
            Set the required fields for a candidate appearing in the test
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1 */}
            <div className="space-y-2 border rounded-md p-3 bg-gray-50">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={mandateAll}
                  onChange={(e) => setMandateAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm font-medium">Mandate All Question Attempts <span className="text-red-500">*</span></span>
                <InfoTooltip text="The Candidate has to provide at-least one input for a question" />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={showMarks}
                  onChange={(e) => setShowMarks(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm font-medium">Show Marks/Points During Test</span>
                <InfoTooltip text="Show the scores against every question" />               
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={showSpeed}
                  onChange={(e) => setShowSpeed(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm font-medium">Show Internet Speed During Test</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={partialMarking}
                  onChange={(e) => setPartialMarking(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm font-medium">Apply Partial Marking</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={scientificCalc}
                  onChange={(e) => setScientificCalc(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm font-medium">Show Scientific Calculator</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={alertEmpty}
                  onChange={(e) => setAlertEmpty(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm font-medium">Show Alerts for Empty Responses</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={secureBrowser}
                  onChange={(e) => setSecureBrowser(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm font-medium">Secure Browser</span>
                <InfoTooltip text="Secure Browser is for candidate portal. You can request Super Admin to activate it in your admin portal." />
              </label>
              <div className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
                <span className="flex items-center gap-1 text-sm">
                  Time left for submit (in min)
                  <InfoTooltip maxWidthClass="max-w-sm" text="Candidate can only submit the test before the given time of the test duration (Total time - Given time)." />
                </span>
                <input
                  type="number"
                  className="w-24 border rounded px-2 py-1 text-sm"
                  value={submitTimeLeft}
                  onChange={(e) =>
                    setSubmitTimeLeft(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
                <span className="text-sm">Set Minimum Time Required Per Question</span>
                <input
                  type="number"
                  className="w-24 border rounded px-2 py-1 text-sm"
                  value={minTimePerQ}
                  onChange={(e) =>
                    setMinTimePerQ(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={mobileAppRestriction}
                  onChange={(e) => setMobileAppRestriction(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm font-medium">Enable Mobile Application Restriction</span>
                <InfoTooltip text="Enables/Disables candidate to attempt test from Mobile/Tab App." />
              </label>
            </div>

            {/* Column 2 */}
            <div className="space-y-2 border rounded-md p-3 bg-gray-50">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={allowNav}
                  onChange={(e) => setAllowNav(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                Allow Back and Forward Navigation Between Questions
                <InfoTooltip text="This will provide the liberty to switch in between the last and next question. If it is not checked then the candidate can only move to the next question" />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={multiLangUI}
                  onChange={(e) => setMultiLangUI(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                Support Multiple Languages for Interface Test
                 <InfoTooltip text="English is the default language for your question bank. However, if required you can select this option to use multiple languages while creating a test" />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={webhooks}
                  onChange={(e) => setWebhooks(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                Integrate with Web Hooks for External Tracking
                <InfoTooltip text="Store data onto your personalized database" />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={defaultCalc}
                  onChange={(e) => setDefaultCalc(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                Show Default Calculator
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={watermark}
                  onChange={(e) => setWatermark(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                Display Watermark with Student Enrollment Number
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={dndMobile}
                  onChange={(e) => setDndMobile(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                Enable Do Not Disturb Mode on Mobile Devices
                <InfoTooltip text="Supported on Android only" />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={activityLog}
                  onChange={(e) => setActivityLog(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                Activity Log
                <InfoTooltip text="Track candidate actions and key events during the test" />
              </label>
              <div className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
                <span className="text-sm">Maximum Question Attempt</span>
                <input
                  type="number"
                  className="w-24 border rounded px-2 py-1 text-sm"
                  value={maxQuestionAttempt}
                  onChange={(e) =>
                    setMaxQuestionAttempt(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={numericOptions}
                  onChange={(e) => setNumericOptions(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                Show Question options in Numeric
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={mobileRestriction}
                  onChange={(e) => setMobileRestriction(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                Enable Mobile Restriction
              </label>
              <label className="flex items-center gap-2 text-[11px] font-medium">
                <input
                  type="checkbox"
                  checked={essayList}
                  onChange={(e) => setEssayList(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm font-medium">Essay List View</span>
              </label>
            </div>
          </div>
        </div>
      </Accordion>
      <Accordion
        title="Time Setting"
        isOpen={openSection === "time"}
        onToggle={(next) => setOpenSection(next ? "time" : null)}
      >
        <div className="border rounded-md">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">
            Amend the clock settings for a test
          </div>
          <div className="divide-y">
            {/* Row: Display Time Bound for Entire Test */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="text-sm font-medium text-gray-800">Display Time Bound for Entire Test</div>
              <div className="text-gray-600">The Candidate has to finish the test in between the allocated time frame</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={displayTimeBound} onChange={setDisplayTimeBound} />
            </div>

            {/* Row: Choose Clock Format */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="text-sm font-medium text-gray-800">Choose Clock Format</div>
              <div className="text-gray-600">Select Clock Format</div>
              <TogglePair
                value={clockFormat}
                onChange={setClockFormat}
                left={{ label: "hh:mm", value: "hh:mm" }}
                right={{ label: "mm:ss", value: "mm:ss" }}
                className="justify-self-start"
                size="sm"
                segmentWidthClass="w-20 h-6 text-xs"
              />
            </div>

            {/* Row: Sections */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="text-sm font-medium text-gray-800">Sections</div>
              <div className="text-gray-600">In order to set up sections according to your exam</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={sections} onChange={setSections} />
            </div>

            {/* Row: Provide Descriptive Instructions for Each Section */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="text-sm font-medium text-gray-800">Provide Descriptive Instructions for Each Section</div>
              <div className="text-gray-600">If required you can allocate Instruction to each section</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={sectionInstructions} onChange={setSectionInstructions} />
            </div>

            {/* Row: Show Specific Sample Question for Each Section */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="text-sm font-medium text-gray-800">Show Specific Sample Question for Each Section</div>
              <div className="text-gray-600">Display Sample Question Before Test Start</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={sampleQuestionPerSection} onChange={setSampleQuestionPerSection} />
            </div>

            {/* Row: Set Topic-Wise Attempt Limits for Students */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="text-sm font-medium text-gray-800">Set Topic-Wise Attempt Limits for Students</div>
              <div className="text-gray-600">If required you can allocate attempt to each topic</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={topicAttemptLimits} onChange={setTopicAttemptLimits} />
            </div>

            {/* Row: Set Individual Time Limits for Each Question */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="text-sm font-medium text-gray-800">Set Individual Time Limits for Each Question</div>
              <div className="text-gray-600">Automize time for all questions in a test</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={individualTimePerQAll} onChange={setIndividualTimePerQAll} />
            </div>

            {/* Row: Set Specific Time Limit for Essay Questions (Minutes) */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="text-sm font-medium text-gray-800">Set Specific Time Limit for Essay Questions (Minutes)</div>
              <div className="text-gray-600">Automize time for all essay questions in a test</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={essaySpecificTimeAll} onChange={setEssaySpecificTimeAll} />
            </div>

            {/* Row: Minimum Question Wise Time */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="text-sm font-medium text-gray-800">Minimum Question Wise Time</div>
              <div className="text-gray-600">Automize Minimum time for all questions in a test</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={minimumQuestionWiseTimeAll} onChange={setMinimumQuestionWiseTimeAll} />
            </div>
          </div>
        </div>
      </Accordion>
      <Accordion
        title="End Test Setting"
        isOpen={openSection === "end"}
        onToggle={(next) => setOpenSection(next ? "end" : null)}
      >
        <div className="border rounded-md">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium">Amend final phase changes to the test that includes result, score, message, etc.</div>
          <div className="divide-y">
            {/* Row: Custom Message (merged toggle + feedback fields under one centered label with separator) */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] items-stretch gap-3 px-4 py-3 text-sm">
              <div className="h-full text-sm font-medium text-gray-800 flex items-center gap-1">
                Custom Message
                <InfoTooltip text="Show personalized messages at end of test" />
              </div>
              <div className="w-full border-l border-gray-200 pl-4">
                {/* Toggle row */}
                <div className="grid grid-cols-[1fr_auto] items-center gap-2 mb-3">
                  <div className="text-sm text-gray-800">Show Personalized Message</div>
                  <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={showPersonalizedMessage} onChange={setShowPersonalizedMessage} />
                </div>
                {/* Feedback fields */}
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <label className="text-sm text-gray-800">Feedback for pass</label>
                    <textarea
                      className="w-full min-h-[72px] border rounded-md px-3 py-2 disabled:opacity-50"
                      value={feedbackPass}
                      onChange={(e) => setFeedbackPass(e.target.value)}
                      disabled={!showPersonalizedMessage}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm text-gray-800">Feedback for fail</label>
                    <textarea
                      className="w-full min-h-[72px] border rounded-md px-3 py-2 disabled:opacity-50"
                      value={feedbackFail}
                      onChange={(e) => setFeedbackFail(e.target.value)}
                      disabled={!showPersonalizedMessage}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Row: Display Message Upon Submission (aligned to Custom Message) */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] items-stretch gap-3 px-4 py-3 text-sm">
              <div className="h-full font-medium text-gray-800 flex items-center gap-1">
                Display Message Upon Submission
                <InfoTooltip text="Show a message to the candidate after submitting the test" />
              </div>
              <div className="w-full border-l border-gray-200 pl-4">
                <div className="grid gap-2">
                  <label className="text-sm text-gray-800">Submission Message</label>
                  <textarea
                    className="w-full min-h-[72px] border rounded-md px-3 py-2"
                    value={displaySubmissionMessage}
                    onChange={(e) => setDisplaySubmissionMessage(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {/* Row: Set Score enable */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="text-sm font-medium text-gray-800">Set Score</div>
              <div className="text-gray-800">Set Minimum Passing Percentage</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={setScoreEnabled} onChange={setSetScoreEnabled} />
            </div>
            {setScoreEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] items-center gap-3 px-4 py-3 text-sm">
                <div className="hidden md:block" />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-28 border rounded px-2 py-1"
                    placeholder="e.g., 40"
                    value={minPassingPercent}
                    onChange={(e) => setMinPassingPercent(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                  <span className="text-gray-600">%</span>
                </div>
              </div>
            )}
            {/* Row: Study Portal Enable */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="font-medium text-gray-800">Study Portal Enable</div>
              <div className="text-gray-800">Enable study portal integration with thinkexam</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={studyPortalEnabled} onChange={setStudyPortalEnabled} />
            </div>
          </div>
        </div>
      </Accordion>
      <Accordion
        title="Generate Rank"
        isOpen={openSection === "rank"}
        onToggle={(next) => setOpenSection(next ? "rank" : null)}
      >
        <div className="border rounded-md">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium">To produce the position of the candidates appearing in a test</div>
          <div className="divide-y">
            {/* Row: Generate Rank (merged controls on right, centered label with separator) */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] items-stretch gap-3 px-4 py-3 text-sm">
              <div className="h-full font-medium text-gray-800 flex items-center">Generate Rank</div>
              <div className="w-full border-l border-gray-200 pl-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div className="text-gray-800">Calculate Ranks</div>
                    <TogglePair
                      value={generateRankMode}
                      onChange={setGenerateRankMode}
                      left={{ label: "Automatic", value: "automatic" }}
                      right={{ label: "Manual", value: "manual" }}
                      className="justify-self-start"
                      equalWidth
                      segmentWidthClass="w-20 h-7 text-sm flex items-center"
                      size="sm"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div className="text-gray-800">Allow/Disallow Duplicate Ranks</div>
                    <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={allowDuplicateRanks} onChange={setAllowDuplicateRanks} />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div className="text-gray-800">Skip Rank After Duplicate</div>
                    <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={skipRankAfterDuplicate} onChange={setSkipRankAfterDuplicate} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Accordion>
      <Accordion
        title="Test Attempt & Resume"
        isOpen={openSection === "attempt"}
        onToggle={(next) => setOpenSection(next ? "attempt" : null)}
      >
        <div className="border rounded-md">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium">Attempt limits and resume policy</div>
          <div className="divide-y">
            {/* Row: Multiple Attempt */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="font-medium text-gray-800">Multiple Attempt</div>
              <div className="text-gray-800">Allow Multiple Attempt</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={multipleAttempt} onChange={setMultipleAttempt} />
            </div>
            {/* Row: Test Resume */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="font-medium text-gray-800">Test Resume</div>
              <div className="text-gray-800">
                <div>Enable Test Resumption After Stopping</div>
                <div className="text-gray-600 text-xs">Candidates can resume test up to a certain number of times</div>
              </div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={testResume} onChange={setTestResume} />
            </div>
            {/* Row: Optional Break - Allow Candidate-Initiated Breaks */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="font-medium text-gray-800">Optional Break</div>
              <div className="text-gray-800">Allow Candidate-Initiated Breaks</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={candidateInitiatedBreaks} onChange={setCandidateInitiatedBreaks} />
            </div>
            {/* Row: Full Screen Mode */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="font-medium text-gray-800">Full Screen Mode</div>
              <div className="text-gray-800">Provide Full-Screen Mode Option During Test</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={fullScreenMode} onChange={setFullScreenMode} />
            </div>
          </div>
        </div>
      </Accordion>
      
      <Accordion
        title="Bio Break"
        isOpen={openSection === "bio"}
        onToggle={(next) => setOpenSection(next ? "bio" : null)}
      >
        <div className="border rounded-md">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium">Bio break configuration</div>
          <div className="divide-y">
            {/* Row: Allow Breaks for Biological Needs */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <div className="font-medium text-gray-800">Allow Breaks for Biological Needs</div>
              <div className="text-gray-600">Permit candidates to take short bio breaks during the test</div>
              <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={allowBioBreaks} onChange={setAllowBioBreaks} />
            </div>
          </div>
        </div>
      </Accordion>
      <Accordion
        title="Report Setting"
        isOpen={openSection === "report"}
        onToggle={(next) => setOpenSection(next ? "report" : null)}
      >
        <div className="border rounded-md">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium">Report visibility and analytics</div>
          <div className="divide-y">
            {/* Row: Test Taker Report (centered label; right has two toggles) */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] items-stretch gap-3 px-4 py-3 text-sm">
              <div className="h-full text-sm font-medium text-gray-800 flex items-center">Test Taker Report</div>
              <div className="w-full border-l border-gray-100 pl-4">
                <div className="grid gap-3">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div className="text-sm text-gray-800">Show Detailed Performance Reports</div>
                    <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={showDetailedPerformanceReports} onChange={setShowDetailedPerformanceReports} />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div className="text-sm text-gray-800">Treat Negative Scores as Zero</div>
                    <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={treatNegativeAsZero} onChange={setTreatNegativeAsZero} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Accordion>
      <Accordion
        title="Whitelisted Website (Open Book Test)"
        isOpen={openSection === "whitelist"}
        onToggle={(next) => setOpenSection(next ? "whitelist" : null)}
      >
        <div className="border rounded-md">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium">Add allowed websites for open book tests</div>
          <div className="divide-y">
            {/* Row: Whitelisted Website toggle */}
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] items-stretch gap-3 px-4 py-3 text-sm">
              <div className="h-full text-sm font-medium text-gray-800 flex items-center">Whitelisted Website</div>
              <div className="w-full border-l border-gray-100 pl-4">
                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <div className="text-sm text-gray-800">Enable Whitelisted Website of test by a candidate</div>
                  <YesNoToggle className="justify-self-start" size="sm" segmentWidthClass="w-10 h-5 text-xs" value={enableWhitelistedWebsite} onChange={setEnableWhitelistedWebsite} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Accordion>
    </div>
  );
}
