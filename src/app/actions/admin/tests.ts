"use server";

import { ApiResponse } from "@/utils/api/types";
import { env } from "@/utils/env";
import getCookie from "@/utils/getCookie";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

// Row model consumed by the grid UI
export interface TestRow {
  id: number;
  name: string;
  // legacy
  date: string; // Back-compat: mirrors startDate
  // fields used by grid
  startDate?: string; // TestStartDate
  endDate?: string; // TestEndDate
  status?: boolean; // IsActive
  testStatus?: string; // TestStatus (e.g., 'New' | 'Published')
  questions?: number; // TestQuestions@$count
  level?: string; // TestDifficultyLevel.TestDifficultyLevel1
  candidates?: number; // TestAssignments@$count
  category?: string; // TestCategory.TestCategoryName
  template?: string; // TestTemplate.TestTemplateName
  code?: string; // TestCode (kept for potential links)
}

// Minimal shapes from OData response
interface ODataSubject {
  SubjectName: string;
}

interface ODataQuestion {
  Subject?: ODataSubject;
}

interface ODataTestQuestion {
  Question?: ODataQuestion;
}

interface ODataTestItem {
  TestId: number;
  TestName: string;
  CreatedDate?: string;
  TestStartDate?: string;
  TestEndDate?: string;
  IsActive?: boolean;
  TestCode?: string;
  TestQuestions?: ODataTestQuestion[];
  TestDifficultyLevel?: { TestDifficultyLevel1?: string };
  // TestCategoryId removed from Test; categories now come via assignment table
  TestAssignedTestCategories?: Array<{
    TestCategory?: { TestCategoryName?: string };
  }>;
  TestTemplate?: { TestTemplateName?: string };
}

interface ODataResponse<T> {
  "@odata.count"?: number;
  value: T[];
}

export interface FetchTestsParams {
  top?: number; // $top
  skip?: number; // $skip
  orderBy?: string; // $orderby e.g., "CreatedDate desc"
  filter?: string; // $filter e.g., "contains(TestName,'math')"
}

function buildQuery(params: FetchTestsParams): string {
  const searchParams = new URLSearchParams();
  // Include required fields and counts per row
  // - TestQuestions($count=true)
  // - TestAssignments($count=true)
  // - Level/Category/Template names
  const expandParts = [
    "TestQuestions($count=true)",
      "TestAssignmentCandidateGroups($count=true)",
    "TestDifficultyLevel($select=TestDifficultyLevel1)",
    // Categories now via assignment table
    "TestAssignedTestCategories($expand=TestCategory($select=TestCategoryName))",
    "TestTemplate($select=TestTemplateName)",
  ];
  searchParams.set("$expand", expandParts.join(","));
  searchParams.set("$select", "TestId,TestCode,TestName,TestStartDate,TestEndDate,IsActive,TestStatus,CreatedDate");
  searchParams.set("$count", "true");
  if (typeof params.top === "number") searchParams.set("$top", String(params.top));
  if (typeof params.skip === "number") searchParams.set("$skip", String(params.skip));
  if (params.orderBy) searchParams.set("$orderby", params.orderBy);
  if (params.filter) searchParams.set("$filter", params.filter);
  return searchParams.toString();
}

function mapToRows(items: ODataTestItem[]): TestRow[] {
  return items.map((it) => {
    const start = it.TestStartDate || it.CreatedDate || "";
    const end = it.TestEndDate || "";
    const qCount = (it as any)["TestQuestions@odata.count"] as number | undefined;
      const candCount = (it as any)["TestAssignmentCandidateGroups@odata.count"] as number | undefined;
    const isActiveRaw = (it as any).IsActive as any;
    const isActiveBool = isActiveRaw === true || isActiveRaw === 1 || isActiveRaw === "1" ? true
      : isActiveRaw === false || isActiveRaw === 0 || isActiveRaw === "0" ? false
      : undefined;
    // Build a comma-separated category list from assignments
    const categoryNames = Array.isArray(it.TestAssignedTestCategories)
      ? it.TestAssignedTestCategories
          .map((t) => t?.TestCategory?.TestCategoryName)
          .filter((n): n is string => !!n && n.trim().length > 0)
      : [];
    return {
      id: it.TestId,
      name: it.TestName,
      code: it.TestCode,
      startDate: start,
      endDate: end,
      status: isActiveBool,
      testStatus: (it as any).TestStatus ?? undefined,
      questions: typeof qCount === "number" ? qCount : undefined,
      level: it.TestDifficultyLevel?.TestDifficultyLevel1,
      candidates: typeof candCount === "number" ? candCount : undefined,
  category: categoryNames.length ? Array.from(new Set(categoryNames)).join(", ") : undefined,
      template: it.TestTemplate?.TestTemplateName,
      date: start,
    };
  });
}

export async function fetchTestsAction(
  params: FetchTestsParams = { top: 25, skip: 0 }
): Promise<ApiResponse<{ rows: TestRow[]; total: number }>> {
  try {
    const query = buildQuery(params);
    const response = await apiHandler(endpoints.getAdminTests, { query } as any);

    if (response.error || response.status !== 200) {
      return {
        status: response.status,
        error: true,
        message: response.message || `Failed to fetch tests`,
        errorMessage: response.errorMessage,
      };
    }

    const json = response.data as any as ODataResponse<ODataTestItem>;
    const rows = mapToRows(json?.value || []);
    const total = json?.["@odata.count"] ?? rows.length;

    return {
      status: 200,
      message: "Fetching Tests Successful",
      data: { rows, total },
    };
  } catch (error: any) {
    console.log("Error Fetching Tests", error);
    return {
      status: 500,
      error: true,
      message: "Error Fetching Tests",
      errorMessage: error?.message || "Unknown error",
    };
  }
}

export async function deleteTestAction(id: number): Promise<ApiResponse<null>> {
  try {
  const res = await apiHandler(endpoints.deleteAdminTest, { id } as any);
  if (res.error) return { status: res.status, error: true, message: res.message };
  return { status: 200, message: "Deleted" };
  } catch (error: any) {
    return {
      status: 500,
      error: true,
      message: "Network error",
      errorMessage: error?.message,
    };
  }
}
