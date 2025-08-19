import type {
  ODataList,
  TestCategoryOData,
  TestDifficultyLevelOData,
  TestInstructionOData,
  TestTypeOData,
} from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import React from "react";
import TestSteps from "./test-steps";

export default async function NewTestPage() {
  // Fetch OData on the server using existing endpoints
  const [typesRes, catsRes, instRes, lvlsRes] = await Promise.all([
    apiHandler(endpoints.getTestTypes, null),
    apiHandler(endpoints.getTestCategories, null),
    apiHandler(endpoints.getTestInstructions, null),
    apiHandler(endpoints.getTestDifficultyLevelsOData, null),
  ]);

  const testTypes: TestTypeOData[] =
    (typesRes.data as ODataList<TestTypeOData> | undefined)?.value ?? [];
  const categories: TestCategoryOData[] =
    (catsRes.data as ODataList<TestCategoryOData> | undefined)?.value ?? [];
  const instructions: TestInstructionOData[] =
    (instRes.data as ODataList<TestInstructionOData> | undefined)?.value ?? [];
  const difficultyLevels: TestDifficultyLevelOData[] =
    (lvlsRes.data as ODataList<TestDifficultyLevelOData> | undefined)?.value ??
    [];

  return (
    <React.Suspense fallback={<div className="w-[85%] mx-auto px-6 py-8">Loading test editor...</div>}>
      <TestSteps
        testTypes={testTypes}
        categories={categories}
        instructions={instructions}
        difficultyLevels={difficultyLevels}
      />
    </React.Suspense>
  );
}
