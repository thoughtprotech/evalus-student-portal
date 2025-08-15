import { env } from "@/utils/env";
import type {
  ODataList,
  TestCategoryOData,
  TestDifficultyLevelOData,
  TestInstructionOData,
  TestTypeOData,
} from "@/utils/api/types";
import Step1CreateTestDetails from "./Step1CreateTestDetails";

export default async function NewTestPage() {
  // Fetch OData lists on the server to avoid CORS and pass to client
  const [typesRes, catRes, instRes, lvlRes] = await Promise.all([
    fetch(`${env.API_BASE_URL}/odata/TestTypes?$select=TestTypeId,TestType1`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .catch(() => ({ value: [] })),
    fetch(
      `${env.API_BASE_URL}/odata/TestCategories?$select=TestCategoryId,TestCategoryName`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .catch(() => ({ value: [] })),
    fetch(
      `${env.API_BASE_URL}/odata/TestInstructions?$select=TestInstructionId,TestInstructionName`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .catch(() => ({ value: [] })),
    fetch(
      `${env.API_BASE_URL}/odata/TestDifficultyLevels?$select=TestDifficultyLevelId,TestDifficultyLevel1`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .catch(() => ({ value: [] })),
  ]);

  const testTypes = (typesRes as ODataList<TestTypeOData>).value ?? [];
  const categories = (catRes as ODataList<TestCategoryOData>).value ?? [];
  const instructions = (instRes as ODataList<TestInstructionOData>).value ?? [];
  const difficultyLevels =
    (lvlRes as ODataList<TestDifficultyLevelOData>).value ?? [];

  return (
    <Step1CreateTestDetails
      testTypes={testTypes}
      categories={categories}
      instructions={instructions}
      difficultyLevels={difficultyLevels}
    />
  );
}
