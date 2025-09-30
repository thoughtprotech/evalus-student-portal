"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse } from "@/utils/api/types";

export type TestTypeRow = {
  id: number;
  type: string;
  language?: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
};

export async function fetchTestTypesAdminAction(params: { top?: number; skip?: number; orderBy?: string; filter?: string } = {}): Promise<ApiResponse<{ rows: TestTypeRow[]; total: number }>> {
  const sp = new URLSearchParams();
  if (typeof params.top === 'number') sp.set('$top', String(params.top));
  if (typeof params.skip === 'number') sp.set('$skip', String(params.skip));
  if (params.orderBy) sp.set('$orderby', params.orderBy);
  if (params.filter) sp.set('$filter', params.filter);
  sp.set('$count', 'true');
  sp.set('$select', 'TestTypeId,TestType1,Language,IsActive,CreatedBy,CreatedDate,ModifiedBy,ModifiedDate');

  // Append a URL fragment to bust the short-lived client GET cache so the grid refreshes immediately after mutations
  const res = await apiHandler(endpoints.getAdminTestTypes, { query: `?${sp.toString()}#cb=${Date.now()}` } as any);
  if (res.status === 200 && res.data) {
    const payload: any = res.data;
    const list: any[] = Array.isArray(payload?.value) ? payload.value : [];
    const total = Number(payload['@odata.count'] ?? list.length) || list.length;
    const rows: TestTypeRow[] = list.map((d: any) => ({
      id: d.TestTypeId ?? d.testTypeId ?? d.Id ?? d.id,
      type: d.TestType1 ?? d.testType1 ?? d.Type ?? d.type,
      language: d.Language ?? d.language,
      isActive: Number(d.IsActive ?? d.isActive) === 1 ? 1 : 0,
      createdBy: d.CreatedBy ?? d.createdBy,
      createdDate: d.CreatedDate ?? d.createdDate,
      modifiedBy: d.ModifiedBy ?? d.modifiedBy,
      modifiedDate: d.ModifiedDate ?? d.modifiedDate,
    }));
    return { status: 200, data: { rows, total } } as any;
  }
  return { status: res.status, error: res.error, message: res.message, errorMessage: res.errorMessage } as any;
}

export async function getTestTypeByIdAction(id: number): Promise<ApiResponse<TestTypeRow | null>> {
  const res = await apiHandler(endpoints.getTestTypeById, { id } as any);
  if (res.status === 200 && res.data) {
    const d: any = res.data;
    const row: TestTypeRow = {
      id: d.TestTypeId ?? d.testTypeId ?? id,
      type: d.TestType1 ?? d.testType1 ?? d.Type ?? d.type,
      language: d.Language ?? d.language,
      isActive: Number(d.IsActive ?? d.isActive) === 1 ? 1 : 0,
      createdBy: d.CreatedBy ?? d.createdBy,
      createdDate: d.CreatedDate ?? d.createdDate,
      modifiedBy: d.ModifiedBy ?? d.modifiedBy,
      modifiedDate: d.ModifiedDate ?? d.modifiedDate,
    };
    return { status: 200, data: row } as any;
  }
  return { status: res.status, error: res.error, message: res.message, errorMessage: res.errorMessage } as any;
}

export async function createTestTypeAction(payload: { type: string; language: string; isActive: number; createdBy?: string; createdDate?: string; modifiedBy?: string; modifiedDate?: string }): Promise<ApiResponse<null>> {
  const body = {
    testTypeId: 0,
    testType1: payload.type,
    language: payload.language,
    isActive: payload.isActive,
    createdBy: payload.createdBy,
    createdDate: payload.createdDate,
    modifiedBy: payload.modifiedBy,
    modifiedDate: payload.modifiedDate,
  };
  const res = await apiHandler(endpoints.createTestType, body as any);
  return res as any;
}

export async function updateTestTypeAction(id: number, payload: { type: string; language: string; isActive: number; createdBy?: string; createdDate?: string; modifiedBy?: string; modifiedDate?: string }): Promise<ApiResponse<null>> {
  const body = {
    testTypeId: id,
    testType1: payload.type,
    language: payload.language,
    isActive: payload.isActive,
    createdBy: payload.createdBy,
    createdDate: payload.createdDate,
    modifiedBy: payload.modifiedBy,
    modifiedDate: payload.modifiedDate,
  };
  const res = await apiHandler(endpoints.updateTestType, { id, ...body } as any);
  return res as any;
}

export async function deleteTestTypeAction(id: number): Promise<ApiResponse<null>> {
  const res = await apiHandler(endpoints.deleteTestType, { id } as any);
  return res as any;
}
