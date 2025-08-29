import React from "react";
import TestSteps from "../../new/test-steps";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type {
  ODataList,
  TestCategoryOData,
  TestDifficultyLevelOData,
  TestInstructionOData,
  TestTypeOData,
} from "@/utils/api/types";

// Normalize API test payload into the draft shape expected by the wizard
function normalizeTestToDraft(test: any): any {
  const src: any = { ...(test || {}) };
  const d: any = {};
  // Map core fields (lowerCamelCase -> PascalCase expected by wizard)
  d.TestId = src.TestId ?? src.testId ?? null;
  d.TestName = src.TestName ?? src.testName ?? "";
  d.TestCode = src.TestCode ?? src.testCode ?? null;
  d.Description = src.Description ?? src.description ?? null;
  d.TestDurationMinutes = src.TestDurationMinutes ?? src.testDurationMinutes ?? null;
  d.TestDurationForHandicappedMinutes = src.TestDurationForHandicappedMinutes ?? src.testDurationForHandicappedMinutes ?? null;
  d.TestCategoryId = src.TestCategoryId ?? src.testCategoryId ?? null;
  d.TestStartDate = src.TestStartDate ?? src.testStartDate ?? null;
  d.TestEndDate = src.TestEndDate ?? src.testEndDate ?? null;
  d.TestStatus = src.TestStatus ?? src.testStatus ?? "New";
  d.TestTypeId = src.TestTypeId ?? src.testTypeId ?? null;
  d.TestDifficultyLevelId = src.TestDifficultyLevelId ?? src.testDifficultyLevelId ?? null;
  // Totals: prefer values provided by the model
  d.TotalQuestions = src.TotalQuestions ?? src.totalQuestions ?? null;
  d.TotalMarks = src.TotalMarks ?? src.totalMarks ?? null;
  // booleans/numbers
  const allow = src.AllowAttachments ?? src.allowAttachments;
  d.AllowAttachments = allow === 1 || allow === true;
  d.TestTemplateId = src.TestTemplateId ?? src.testTemplateId ?? null;
  d.TestCertificateId = src.TestCertificateId ?? src.testCertificateId ?? null;
  d.Language = src.Language ?? src.language ?? null;
  d.IsActive = src.IsActive ?? src.isActive ?? 1;
  d.ExtraTimeDuration = src.ExtraTimeDuration ?? src.extraTimeDuration ?? null;
  d.EntryRestrictionDuration = src.EntryRestrictionDuration ?? src.entryRestrictionDuration ?? null;

  // Step 2: map TestSettings[0] to draft fields
  const settingsArr = Array.isArray(src.TestSettings ?? src.testSettings) ? (src.TestSettings ?? src.testSettings) : [];
  const s0: any = settingsArr.length > 0 ? settingsArr[0] : null;
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

  // Instructions mapping
  const instr = Array.isArray(src.TestAssignedInstructions ?? src.testAssignedInstructions)
    ? (src.TestAssignedInstructions ?? src.testAssignedInstructions)
    : [];
  d.TestAssignedInstructions = instr.map((i: any) => ({
    TestAssignedInstructionId: i.TestAssignedInstructionId ?? i.testassignedInstructionId ?? i.testAssignedInstructionId ?? null,
    TestPrimaryInstructionId: i.TestPrimaryInstructionId ?? i.testPrimaryInstructionId ?? null,
    TestSecondaryInstructionId: i.TestSecondaryInstructionId ?? i.testSecondaryInstructionId ?? null,
    TestId: i.TestId ?? i.testId ?? d.TestId ?? null,
  }));

  // Assignments mapping (Step 5)
  const assigns = Array.isArray(src.TestAssignments ?? src.testAssignments)
    ? (src.TestAssignments ?? src.testAssignments)
    : [];
  d.TestAssignments = assigns.map((a: any) => ({
    ProductId: a.ProductId ?? a.productId ?? null,
    CandidateGroupId: a.CandidateGroupId ?? a.candidateGroupId ?? null,
    CandidateId: a.CandidateId ?? a.candidateId ?? null,
  }));

  // Test Questions -> draft.testQuestions for Step 3
  const tq: any[] = Array.isArray(src.TestQuestions ?? src.testQuestions)
    ? (src.TestQuestions ?? src.testQuestions)
    : [];
  d.testQuestions = tq
    .map((q: any) => {
      const qObj = q?.Question ?? q?.question ?? null;
      let Question: any = null;
      if (qObj) {
        // Normalize nested options casing
        const opts = qObj.Questionoptions ?? qObj.questionoptions ?? qObj.QuestionOptions ?? qObj.questionOptions ?? [];
        const normOpts = Array.isArray(opts)
          ? opts.map((o: any) => ({
              QuestionText: o?.QuestionText ?? o?.questionText ?? o?.text ?? null,
            }))
          : [];
        Question = { Questionoptions: normOpts };
      }
      return {
        TestQuestionId: Number(
          q?.TestQuestionId ?? q?.testQuestionId ?? q?.QuestionId ?? q?.Question?.QuestionId ?? q?.QuestionID ?? q?.questionId ?? 0
        ),
        Marks: Number(q?.Marks ?? q?.marks ?? 0),
        NegativeMarks: Number(q?.NegativeMarks ?? q?.negativeMarks ?? 0),
        Duration: q?.Duration != null ? Number(q.Duration) : q?.duration != null ? Number(q.duration) : undefined,
        TestSectionId: q?.TestSectionId != null ? Number(q.TestSectionId) : q?.testSectionId != null ? Number(q.testSectionId) : undefined,
        TestQuestionSequenceNo: q?.TestQuestionSequenceNo ?? q?.testQuestionSequenceNo ?? undefined,
        Question,
      };
    })
    .filter((x) => x.TestQuestionId > 0);

  // Derive totals for Step 1 pre-population only if not provided by API
  if (!("TotalQuestions" in d) || d.TotalQuestions == null) {
    d.TotalQuestions = Array.isArray(d.testQuestions) ? d.testQuestions.length : 0;
  }
  if (!("TotalMarks" in d) || d.TotalMarks == null) {
    d.TotalMarks = Array.isArray(d.testQuestions)
      ? d.testQuestions.reduce((sum: number, q: any) => sum + (Number(q?.Marks ?? 0) || 0), 0)
      : 0;
  }

  // Normalize status text
  if (typeof d.TestStatus === "string") {
    const s = d.TestStatus.toLowerCase();
    d.TestStatus = s === "published" ? "Published" : s === "new" ? "New" : d.TestStatus;
  }
  return d;
}

export default async function EditTestPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  // Load dropdown data in parallel
  const [typesRes, catsRes, instRes, lvlsRes, testRes] = await Promise.all([
    apiHandler(endpoints.getTestTypes, null as any),
    apiHandler(endpoints.getTestCategories, null as any),
    apiHandler(endpoints.getTestInstructions, null as any),
    apiHandler(endpoints.getTestDifficultyLevelsOData, null as any),
    apiHandler(endpoints.getTestById, { id } as any),
  ]);

  const testTypes: TestTypeOData[] = ((typesRes.data as ODataList<TestTypeOData> | undefined)?.value) ?? [];
  const categories: TestCategoryOData[] = ((catsRes.data as ODataList<TestCategoryOData> | undefined)?.value) ?? [];
  const instructions: TestInstructionOData[] = ((instRes.data as ODataList<TestInstructionOData> | undefined)?.value) ?? [];
  const difficultyLevels: TestDifficultyLevelOData[] = ((lvlsRes.data as ODataList<TestDifficultyLevelOData> | undefined)?.value) ?? [];

  const initialDraft = normalizeTestToDraft(testRes.data ?? {});

  return (
    <React.Suspense fallback={<div className="w-[85%] mx-auto px-6 py-8">Loading test editor...</div>}>
      <TestSteps
        testTypes={testTypes}
        categories={categories}
        instructions={instructions}
        difficultyLevels={difficultyLevels}
        initialDraft={initialDraft}
        editMode
        testId={id}
      />
    </React.Suspense>
  );
}
