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

/**
 * Create Test Instruction (sends full payload expected by API including metadata fields)
 */
export async function createTestInstructionAction(payload: {
  testInstructionName: string;
  testInstruction1: string;
  language: string;
  isActive: number; // 1 | 0
  createdBy?: string;
  modifiedBy?: string;
  createdDate?: string; // ISO
  modifiedDate?: string; // ISO
}): Promise<ApiResponse<null>> {
  try {
    const nowIso = new Date().toISOString();
    const body: any = {
      // Maintain both PascalCase & camelCase keys for backend flexibility
      TestInstructionId: 0,
      testInstructionId: 0,
      TestInstructionName: payload.testInstructionName,
      testInstructionName: payload.testInstructionName,
      TestInstruction1: payload.testInstruction1,
      testInstruction1: payload.testInstruction1,
      Language: payload.language,
      language: payload.language,
      IsActive: payload.isActive,
      isActive: payload.isActive,
      CreatedBy: payload.createdBy ?? '',
      createdBy: payload.createdBy ?? '',
      CreatedDate: payload.createdDate ?? nowIso,
      createdDate: payload.createdDate ?? nowIso,
      ModifiedBy: payload.modifiedBy ?? payload.createdBy ?? '',
      modifiedBy: payload.modifiedBy ?? payload.createdBy ?? '',
      ModifiedDate: payload.modifiedDate ?? nowIso,
      modifiedDate: payload.modifiedDate ?? nowIso,
    };
    const res = await apiHandler(endpoints.createTestInstruction, body);
    if (res.error) return { status: res.status, error: true, message: res.message };
    return { status: 200, message: 'Created' };
  } catch (e: any) {
    return { status: 500, error: true, message: 'Failed to create', errorMessage: e?.message };
  }
}

/**
 * Update Test Instruction (sends full payload; preserves created metadata if supplied)
 */
export async function updateTestInstructionAction(id: number, payload: {
  testInstructionName: string;
  testInstruction1: string;
  language: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}): Promise<ApiResponse<null>> {
  try {
    const nowIso = new Date().toISOString();
    const body: any = {
      id,
      TestInstructionId: id,
      testInstructionId: id,
      TestInstructionName: payload.testInstructionName,
      testInstructionName: payload.testInstructionName,
      TestInstruction1: payload.testInstruction1,
      testInstruction1: payload.testInstruction1,
      Language: payload.language,
      language: payload.language,
      IsActive: payload.isActive,
      isActive: payload.isActive,
      // Modified audit fields always sent
      ModifiedBy: payload.modifiedBy ?? payload.createdBy ?? '',
      modifiedBy: payload.modifiedBy ?? payload.createdBy ?? '',
      ModifiedDate: payload.modifiedDate ?? nowIso,
      modifiedDate: payload.modifiedDate ?? nowIso,
    };
    // Only include CreatedBy/CreatedDate if provided so we don't overwrite existing values with blanks on the server
    if (payload.createdBy !== undefined) {
      body.CreatedBy = payload.createdBy;
      body.createdBy = payload.createdBy;
    }
    if (payload.createdDate !== undefined) {
      body.CreatedDate = payload.createdDate;
      body.createdDate = payload.createdDate;
    }
    const res = await apiHandler(endpoints.updateTestInstruction, body);
    if (res.error) return { status: res.status, error: true, message: res.message };
    return { status: 200, message: 'Updated' };
  } catch (e: any) {
    return { status: 500, error: true, message: 'Failed to update', errorMessage: e?.message };
  }
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
