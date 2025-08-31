"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse } from "@/utils/api/types";

export interface TestInstructionRow {
  id: number;
  name: string;
  instruction: string;
  language: string;
  isActive: number; // 1 active 0 inactive
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}

export interface FetchTestInstructionsParams {
  top?: number;
  skip?: number;
  orderBy?: string; // e.g. 'CreatedDate desc'
  filter?: string; // OData filter fragment
}

function buildQuery(params: FetchTestInstructionsParams): string {
  const sp = new URLSearchParams();
  if (typeof params.top === 'number') sp.set('$top', String(params.top));
  if (typeof params.skip === 'number') sp.set('$skip', String(params.skip));
  if (params.orderBy) sp.set('$orderby', params.orderBy);
  if (params.filter) sp.set('$filter', params.filter);
  sp.set('$count', 'true');
  // Select needed columns
  sp.set('$select', 'TestInstructionId,TestInstructionName,TestInstruction1,Language,IsActive,CreatedBy,CreatedDate,ModifiedBy,ModifiedDate');
  return sp.toString();
}

export async function fetchTestInstructionsAction(params: FetchTestInstructionsParams = { top: 25, skip: 0 }): Promise<ApiResponse<{ rows: TestInstructionRow[]; total: number }>> {
  try {
    const query = buildQuery(params);
    const res = await apiHandler(endpoints.getAdminTestInstructions, { query } as any);
    if (res.status !== 200 || !res.data) {
      return { status: res.status, error: true, message: res.message || 'Failed to fetch instructions', errorMessage: res.errorMessage };
    }
    const payload: any = res.data;
    const total = payload['@odata.count'] ?? 0;
    const rows: TestInstructionRow[] = Array.isArray(payload.value) ? payload.value.map((it: any) => ({
      id: it.TestInstructionId,
      name: it.TestInstructionName,
      instruction: it.TestInstruction1,
      language: it.Language ?? '',
      isActive: Number(it.IsActive) === 1 ? 1 : 0,
      createdBy: it.CreatedBy,
      createdDate: it.CreatedDate,
      modifiedBy: it.ModifiedBy,
      modifiedDate: it.ModifiedDate,
    })) : [];
    return { status: 200, data: { rows, total }, message: 'Fetched instructions' };
  } catch (e: any) {
    return { status: 500, error: true, message: 'Error fetching test instructions', errorMessage: e?.message };
  }
}

export async function createTestInstructionAction(payload: { testInstructionName: string; testInstruction1: string; language: string; isActive: number; }): Promise<ApiResponse<null>> {
  try {
    const res = await apiHandler(endpoints.createTestInstruction, {
      TestInstructionName: payload.testInstructionName,
      TestInstruction1: payload.testInstruction1,
      Language: payload.language,
      IsActive: payload.isActive,
    } as any);
    if (res.error) return { status: res.status, error: true, message: res.message };
    return { status: 200, message: 'Created' };
  } catch (e: any) { return { status: 500, error: true, message: 'Failed to create', errorMessage: e?.message }; }
}

export async function updateTestInstructionAction(id: number, payload: { testInstructionName: string; testInstruction1: string; language: string; isActive: number; }): Promise<ApiResponse<null>> {
  try {
    const res = await apiHandler(endpoints.updateTestInstruction, { id, TestInstructionName: payload.testInstructionName, TestInstruction1: payload.testInstruction1, Language: payload.language, IsActive: payload.isActive } as any);
    if (res.error) return { status: res.status, error: true, message: res.message };
    return { status: 200, message: 'Updated' };
  } catch (e: any) { return { status: 500, error: true, message: 'Failed to update', errorMessage: e?.message }; }
}

export async function deleteTestInstructionAction(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await apiHandler(endpoints.deleteTestInstruction, { id } as any);
    if (res.error) return { status: res.status, error: true, message: res.message };
    return { status: 200, message: 'Deleted' };
  } catch (e: any) { return { status: 500, error: true, message: 'Failed to delete', errorMessage: e?.message }; }
}

export async function getTestInstructionByIdAction(id: number): Promise<ApiResponse<TestInstructionRow>> {
  try {
    const res = await apiHandler(endpoints.getTestInstructionById, { id } as any);
    if (res.status !== 200 || !res.data) return { status: res.status, error: true, message: res.message || 'Failed', errorMessage: res.errorMessage };
    const it: any = res.data;
    const row: TestInstructionRow = {
      id: it.TestInstructionId ?? it.testInstructionId ?? id,
      name: it.TestInstructionName ?? it.testInstructionName ?? '',
      instruction: it.TestInstruction1 ?? it.testInstruction1 ?? '',
      language: it.Language ?? it.language ?? '',
      isActive: Number(it.IsActive ?? it.isActive) === 1 ? 1 : 0,
      createdBy: it.CreatedBy ?? it.createdBy,
      createdDate: it.CreatedDate ?? it.createdDate,
      modifiedBy: it.ModifiedBy ?? it.modifiedBy,
      modifiedDate: it.ModifiedDate ?? it.modifiedDate,
    };
    return { status: 200, data: row };
  } catch (e: any) {
    return { status: 500, error: true, message: 'Error fetching record', errorMessage: e?.message };
  }
}
