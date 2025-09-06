"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse } from "@/utils/api/types";

export type TestDifficultyLevelRow = {
  id: number;
  name: string;
  language?: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
};

export interface FetchTestDifficultyParams {
  top?: number;
  skip?: number;
  orderBy?: string; // e.g., "CreatedDate desc"
  filter?: string;  // OData $filter
}

export async function fetchTestDifficultyLevelsAction(
  params: FetchTestDifficultyParams = { top: 15, skip: 0 }
): Promise<ApiResponse<{ rows: TestDifficultyLevelRow[]; total: number }>> {
  try {
    const sp = new URLSearchParams();
    if (typeof params.top === 'number') sp.set("$top", String(params.top));
    if (typeof params.skip === 'number') sp.set("$skip", String(params.skip));
    if (params.orderBy) sp.set("$orderby", params.orderBy);
    if (params.filter) sp.set("$filter", params.filter);
    sp.set("$count", "true");
  sp.set("$select", "TestDifficultyLevelId,TestDifficultyLevel1,Language,IsActive,CreatedBy,CreatedDate,ModifiedBy,ModifiedDate");

    const path = `/Odata/TestDifficultyLevels?${sp.toString()}`;
    const res = await apiHandler({ method: 'GET', path: () => path, type: 'OPEN' } as any, null as any);
    if (res.status !== 200 || !res.data) return { status: res.status, error: true, message: res.message || 'Failed to fetch', errorMessage: res.errorMessage };

    const payload: any = res.data;
    const total = payload['@odata.count'] ?? 0;
    const list: any[] = Array.isArray(payload.value) ? payload.value : [];
    const rows: TestDifficultyLevelRow[] = list.map((d: any) => ({
      id: d.TestDifficultyLevelId ?? d.testDifficultyLevelId,
      name: d.TestDifficultyLevel1 ?? d.testDifficultyLevel1,
      language: d.Language ?? d.language,
      isActive: Number(d.IsActive ?? d.isActive) === 1 ? 1 : 0,
      createdBy: d.CreatedBy ?? d.createdBy,
      createdDate: d.CreatedDate ?? d.createdDate,
      modifiedBy: d.ModifiedBy ?? d.modifiedBy,
      modifiedDate: d.ModifiedDate ?? d.modifiedDate,
    }));
    return { status: 200, data: { rows, total: typeof total === 'number' ? total : rows.length } };
  } catch (e: any) {
    return { status: 500, error: true, message: 'Error fetching', errorMessage: e?.message };
  }
}

export async function createTestDifficultyLevelAction(payload: {
  testDifficultyLevel1: string;
  language: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}): Promise<ApiResponse<any>> {
  try {
    const body = {
      TestDifficultyLevel1: payload.testDifficultyLevel1,
      Language: payload.language,
      IsActive: payload.isActive,
      CreatedBy: payload.createdBy,
      CreatedDate: payload.createdDate,
      ModifiedBy: payload.modifiedBy,
      ModifiedDate: payload.modifiedDate,
    };
    const res = await apiHandler(endpoints.createTestDifficultyLevel, body as any);
    return res as any;
  } catch (e: any) { return { status: 500, error: true, message: 'Failed to create', errorMessage: e?.message }; }
}

export async function updateTestDifficultyLevelAction(id: number, payload: {
  testDifficultyLevel1: string;
  language: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}): Promise<ApiResponse<any>> {
  try {
    const body = {
      TestDifficultyLevel1: payload.testDifficultyLevel1,
      Language: payload.language,
      IsActive: payload.isActive,
      CreatedBy: payload.createdBy,
      CreatedDate: payload.createdDate,
      ModifiedBy: payload.modifiedBy,
      ModifiedDate: payload.modifiedDate,
    };
    const res = await apiHandler(endpoints.updateTestDifficultyLevel, { id, ...body } as any);
    return res as any;
  } catch (e: any) { return { status: 500, error: true, message: 'Failed to update', errorMessage: e?.message }; }
}

export async function deleteTestDifficultyLevelAction(id: number): Promise<ApiResponse<null>> {
  try { return await apiHandler(endpoints.deleteTestDifficultyLevel, { id } as any) as any; }
  catch (e: any) { return { status: 500, error: true, message: 'Failed to delete', errorMessage: e?.message }; }
}

export async function getTestDifficultyLevelByIdAction(id: number): Promise<ApiResponse<TestDifficultyLevelRow | null>> {
  try {
    const res = await apiHandler(endpoints.getTestDifficultyLevelById, { id } as any);
    if (res.status === 200 && res.data) {
      const d: any = res.data;
      const row: TestDifficultyLevelRow = {
        id: d.TestDifficultyLevelId ?? d.testDifficultyLevelId,
        name: d.TestDifficultyLevel1 ?? d.testDifficultyLevel1,
  language: d.Language ?? d.language,
        isActive: Number(d.IsActive ?? d.isActive) === 1 ? 1 : 0,
        createdBy: d.CreatedBy ?? d.createdBy,
        createdDate: d.CreatedDate ?? d.createdDate,
        modifiedBy: d.ModifiedBy ?? d.modifiedBy,
        modifiedDate: d.ModifiedDate ?? d.modifiedDate,
      };
      return { status: 200, data: row };
    }
    return { status: res.status, error: true, message: res.message || 'Not found', errorMessage: res.errorMessage };
  } catch (e: any) { return { status: 500, error: true, message: 'Failed to load', errorMessage: e?.message }; }
}
