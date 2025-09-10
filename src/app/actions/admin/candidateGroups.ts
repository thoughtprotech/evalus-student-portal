"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse } from "@/utils/api/types";

export interface CandidateGroupRow {
  id: number;
  name: string;
  parentId: number;
  language?: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}

export interface FetchGroupsParams {
  top?: number;
  skip?: number;
  orderBy?: string; // e.g., "CreatedDate desc"
  filter?: string;  // OData $filter
}

export async function fetchCandidateGroupsODataAction(params: FetchGroupsParams = { top: 15, skip: 0 }): Promise<ApiResponse<{ rows: CandidateGroupRow[]; total: number }>> {
  try {
    const sp = new URLSearchParams();
    if (typeof params.top === 'number') sp.set('$top', String(params.top));
    if (typeof params.skip === 'number') sp.set('$skip', String(params.skip));
    if (params.orderBy) sp.set('$orderby', params.orderBy);
    if (params.filter) sp.set('$filter', params.filter);
    sp.set('$count', 'true');
    sp.set('$select', 'CandidateGroupId,CandidateGroupName,ParentId,Language,IsActive,CreatedBy,CreatedDate,ModifiedBy,ModifiedDate');

    const query = `?${sp.toString()}`;
    const res = await apiHandler(endpoints.listCandidateGroupsOData, { query });
    if (res.status !== 200 || !res.data) {
      return { status: res.status, error: true, message: res.message || 'Failed to fetch candidate groups', errorMessage: res.errorMessage };
    }
    const payload: any = res.data;
    const total = payload['@odata.count'] ?? payload['@odata.Count'] ?? payload.count ?? 0;
    const list: any[] = Array.isArray(payload.value) ? payload.value : [];
    const rows: CandidateGroupRow[] = list.map((g: any) => ({
      id: g.CandidateGroupId ?? g.candidateGroupId,
      name: g.CandidateGroupName ?? g.candidateGroupName,
      parentId: g.ParentId ?? g.parentId ?? 0,
      language: g.Language ?? g.language ?? 'English',
      isActive: Number(g.IsActive ?? g.isActive) === 1 ? 1 : 0,
      createdBy: g.CreatedBy ?? g.createdBy,
      createdDate: g.CreatedDate ?? g.createdDate,
      modifiedBy: g.ModifiedBy ?? g.modifiedBy,
      modifiedDate: g.ModifiedDate ?? g.modifiedDate,
    }));
    return { status: 200, data: { rows, total }, message: `Fetched ${rows.length} groups` };
  } catch (e: any) {
    return { status: 500, error: true, message: 'Error fetching candidate groups', errorMessage: e?.message };
  }
}

export async function createCandidateGroupAction(payload: any): Promise<ApiResponse<any>> {
  try {
    const res = await apiHandler(endpoints.createCandidateGroup, payload);
    return res as any;
  } catch (e: any) {
    return { status: 500, error: true, message: 'Failed to create group', errorMessage: e?.message } as any;
  }
}

export async function updateCandidateGroupAction(id: number, payload: any): Promise<ApiResponse<any>> {
  try {
  const res = await apiHandler(endpoints.updateCandidateGroup, { ...payload, id });
    return res as any;
  } catch (e: any) {
    return { status: 500, error: true, message: 'Failed to update group', errorMessage: e?.message } as any;
  }
}

export async function deleteCandidateGroupAction(id: number): Promise<ApiResponse<null>> {
  try {
  const res = await apiHandler(endpoints.deleteCandidateGroup, { id });
    return res as any;
  } catch (e: any) {
    return { status: 500, error: true, message: 'Failed to delete group', errorMessage: e?.message };
  }
}
