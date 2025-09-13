"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse } from "@/utils/api/types";

export type TestSectionRow = {
  id: number;
  name: string;
  language?: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
};

export interface FetchTestSectionParams {
  top?: number;
  skip?: number;
  orderBy?: string; // e.g., "CreatedDate desc"
  filter?: string; // OData $filter
}

export async function fetchTestSectionsAction(
  params: FetchTestSectionParams = { top: 15, skip: 0 }
): Promise<ApiResponse<{ rows: TestSectionRow[]; total: number }>> {
  try {
    const sp = new URLSearchParams();
    if (typeof params.top === "number") sp.set("$top", String(params.top));
    if (typeof params.skip === "number") sp.set("$skip", String(params.skip));
    if (params.orderBy) sp.set("$orderby", params.orderBy);
    if (params.filter) sp.set("$filter", params.filter);
    sp.set("$count", "true");
    sp.set(
      "$select",
      "TestSectionId,TestSectionName,Language,IsActive,CreatedBy,CreatedDate,ModifiedBy,ModifiedDate"
    );

    const res = await apiHandler(
      { method: "GET", path: () => `/Odata/TestSections?${sp.toString()}`, type: "OPEN" } as any,
      null as any
    );
    if (res.status !== 200 || !res.data)
      return {
        status: res.status,
        error: true,
        message: res.message || "Failed to fetch",
        errorMessage: res.errorMessage,
      };

    const payload: any = res.data;
    const total = payload["@odata.count"] ?? 0;
    const list: any[] = Array.isArray(payload.value) ? payload.value : [];
    const rows: TestSectionRow[] = list.map((d: any) => ({
      id: d.TestSectionId ?? d.testSectionId,
      name: d.TestSectionName ?? d.testSectionName,
      language: d.Language ?? d.language,
      isActive: Number(d.IsActive ?? d.isActive) === 1 ? 1 : 0,
      createdBy: d.CreatedBy ?? d.createdBy,
      createdDate: d.CreatedDate ?? d.createdDate,
      modifiedBy: d.ModifiedBy ?? d.modifiedBy,
      modifiedDate: d.ModifiedDate ?? d.modifiedDate,
    }));
    return {
      status: 200,
      data: { rows, total: typeof total === "number" ? total : rows.length },
    };
  } catch (e: any) {
    return {
      status: 500,
      error: true,
      message: "Error fetching",
      errorMessage: e?.message,
    };
  }
}

export async function createTestSectionAction(payload: {
  testSectionName: string;
  language: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  testQuestions?: any[];
}): Promise<ApiResponse<any>> {
  try {
    const body = {
      TestSectionName: payload.testSectionName,
      Language: payload.language,
      IsActive: payload.isActive,
      CreatedBy: payload.createdBy,
      CreatedDate: payload.createdDate,
      ModifiedBy: payload.modifiedBy,
      ModifiedDate: payload.modifiedDate,
    };
  const res = await apiHandler(endpoints.createTestSection, { ...body, TestQuestions: Array.isArray(payload.testQuestions) ? payload.testQuestions : undefined } as any);
    return res as any;
  } catch (e: any) {
    return {
      status: 500,
      error: true,
      message: "Failed to create",
      errorMessage: e?.message,
    };
  }
}

export async function updateTestSectionAction(
  id: number,
  payload: {
    testSectionName: string;
    language: string;
    isActive: number;
    createdBy?: string;
    createdDate?: string;
    modifiedBy?: string;
    modifiedDate?: string;
  testQuestions?: any[];
  }
): Promise<ApiResponse<any>> {
  try {
    const body = {
      TestSectionName: payload.testSectionName,
      Language: payload.language,
      IsActive: payload.isActive,
      CreatedBy: payload.createdBy,
      CreatedDate: payload.createdDate,
      ModifiedBy: payload.modifiedBy,
      ModifiedDate: payload.modifiedDate,
    };
    const res = await apiHandler(
      endpoints.updateTestSection,
      { id, ...body, TestQuestions: Array.isArray(payload.testQuestions) ? payload.testQuestions : undefined } as any
    );
    return res as any;
  } catch (e: any) {
    return {
      status: 500,
      error: true,
      message: "Failed to update",
      errorMessage: e?.message,
    };
  }
}

export async function deleteTestSectionAction(id: number): Promise<ApiResponse<null>> {
  try {
    return (await apiHandler(endpoints.deleteTestSection, { id } as any)) as any;
  } catch (e: any) {
    return {
      status: 500,
      error: true,
      message: "Failed to delete",
      errorMessage: e?.message,
    };
  }
}

export async function getTestSectionByIdAction(
  id: number
): Promise<ApiResponse<TestSectionRow | null>> {
  try {
    const res = await apiHandler(endpoints.getTestSectionById, { id } as any);
    if (res.status === 200 && res.data) {
      const d: any = res.data;
      const row: TestSectionRow = {
        id: d.TestSectionId ?? d.testSectionId,
        name: d.TestSectionName ?? d.testSectionName,
        language: d.Language ?? d.language,
        isActive: Number(d.IsActive ?? d.isActive) === 1 ? 1 : 0,
        createdBy: d.CreatedBy ?? d.createdBy,
        createdDate: d.CreatedDate ?? d.createdDate,
        modifiedBy: d.ModifiedBy ?? d.modifiedBy,
        modifiedDate: d.ModifiedDate ?? d.modifiedDate,
      };
      return { status: 200, data: row };
    }
    return {
      status: res.status,
      error: true,
      message: res.message || "Not found",
      errorMessage: res.errorMessage,
    };
  } catch (e: any) {
    return {
      status: 500,
      error: true,
      message: "Failed to load",
      errorMessage: e?.message,
    };
  }
}
