"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse } from "@/utils/api/types";

export interface WriteUpRow {
  id: number;
  name: string;
  writeup: string; // rich text html
  language: string;
  isActive: number; // 1 active 0 inactive
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}

export interface FetchWriteUpsParams {
  top?: number;
  skip?: number;
  orderBy?: string; // e.g. 'ModifiedDate desc'
  filter?: string; // OData filter fragment
}

function buildQuery(params: FetchWriteUpsParams): string {
  const sp = new URLSearchParams();
  if (typeof params.top === 'number') sp.set('$top', String(params.top));
  if (typeof params.skip === 'number') sp.set('$skip', String(params.skip));
  if (params.orderBy) sp.set('$orderby', params.orderBy);
  if (params.filter) sp.set('$filter', params.filter);
  sp.set('$count', 'true');
  sp.set('$select', 'WriteUpId,WriteUpName,WriteUp1,Language,IsActive,CreatedBy,CreatedDate,ModifiedBy,ModifiedDate');
  return sp.toString();
}

export async function fetchWriteUpsAction(params: FetchWriteUpsParams = { top: 25, skip: 0 }): Promise<ApiResponse<{ rows: WriteUpRow[]; total: number }>> {
  try {
    const query = buildQuery(params);
    // First try OData admin listing (supports server paging)
    const res = await apiHandler(endpoints.getAdminWriteUps, { query } as any);
    if (res.status === 200 && res.data) {
      const payload: any = res.data;
      let rows: WriteUpRow[] = [];
      let total = 0;
      if (Array.isArray(payload.value)) { // OData shape
        total = payload['@odata.count'] ?? payload.value.length;
        rows = payload.value.map((it: any) => ({
          id: it.WriteUpId ?? it.writeUpId,
          name: it.WriteUpName ?? it.writeUpName ?? '',
          writeup: it.WriteUp1 ?? it.writeUp1 ?? '',
          language: it.Language ?? it.language ?? '',
          isActive: Number(it.IsActive ?? it.isActive) === 1 ? 1 : 0,
          createdBy: it.CreatedBy ?? it.createdBy,
          createdDate: it.CreatedDate ?? it.createdDate,
          modifiedBy: it.ModifiedBy ?? it.modifiedBy,
          modifiedDate: it.ModifiedDate ?? it.modifiedDate,
        }));
        return { status: 200, data: { rows, total }, message: 'Fetched writeups' };
      }
      // Non-OData REST shape fallback (payload may itself be the array OR have data array)
      const rawList: any[] | undefined = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : undefined);
      if (rawList) {
        const mapped = rawList.map((it: any) => ({
          id: it.WriteUpId ?? it.writeUpId ?? it.writeUpId ?? it.writeupId ?? it.writeUpID ?? it.writeUpId,
          name: it.WriteUpName ?? it.writeUpName ?? '',
          writeup: it.WriteUp1 ?? it.writeUp1 ?? '',
          language: it.Language ?? it.language ?? '',
          isActive: Number(it.IsActive ?? it.isActive) === 1 ? 1 : 0,
          createdBy: it.CreatedBy ?? it.createdBy,
          createdDate: it.CreatedDate ?? it.createdDate,
          modifiedBy: it.ModifiedBy ?? it.modifiedBy,
          modifiedDate: it.ModifiedDate ?? it.modifiedDate,
        }));
        // Apply client-side paging & sorting when server did not
        let sorted = mapped;
        if (params.orderBy) {
          const [fieldRaw, dirRaw] = params.orderBy.split(/\s+/);
            const dir = (dirRaw || 'asc').toLowerCase();
            const fieldMap: Record<string,string> = { WriteUpName:'name', WriteUp1:'writeup', Language:'language', ModifiedDate:'modifiedDate', CreatedDate:'createdDate', IsActive:'isActive' };
            const localField = fieldMap[fieldRaw] || fieldRaw;
            sorted = [...mapped].sort((a: any,b: any)=>{ const av=a[localField]; const bv=b[localField]; if(av==null && bv==null) return 0; if(av==null) return 1; if(bv==null) return -1; if(av < bv) return dir==='asc'? -1:1; if(av>bv) return dir==='asc'?1:-1; return 0; });
        }
        const top = params.top ?? 25; const skip = params.skip ?? 0;
        const paged = sorted.slice(skip, skip+top);
        return { status: 200, data: { rows: paged, total: mapped.length }, message: 'Fetched writeups' };
      }
    }
    return { status: res.status, error: true, message: res.message || 'Failed to fetch writeups', errorMessage: res.errorMessage };
  } catch (e: any) {
    return { status: 500, error: true, message: 'Error fetching writeups', errorMessage: e?.message };
  }
}

export async function createWriteUpAction(payload: {
  writeUpName: string;
  writeUp1: string;
  language: string;
  isActive: number;
  createdBy?: string;
  modifiedBy?: string;
  createdDate?: string;
  modifiedDate?: string;
  writeuptags?: { writeUpTagId: number; writeUpTag1: string; writeUpId?: number }[];
}): Promise<ApiResponse<null>> {
  try {
    const nowIso = new Date().toISOString();
    const body: any = {
      WriteUpId: 0,
      writeUpId: 0,
      WriteUpName: payload.writeUpName,
      writeUpName: payload.writeUpName,
      WriteUp1: payload.writeUp1,
      writeUp1: payload.writeUp1,
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
      writeuptags: payload.writeuptags ?? [],
    };
    const res = await apiHandler(endpoints.createWriteUp, body);
    if (res.error) return { status: res.status, error: true, message: res.message };
    return { status: 200, message: 'Created' };
  } catch (e: any) {
    return { status: 500, error: true, message: 'Failed to create', errorMessage: e?.message };
  }
}

export async function updateWriteUpAction(id: number, payload: {
  writeUpName: string;
  writeUp1: string;
  language: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  writeuptags?: { writeUpTagId: number; writeUpTag1: string; writeUpId?: number }[];
}): Promise<ApiResponse<null>> {
  try {
    const nowIso = new Date().toISOString();
    const body: any = {
      id,
      WriteUpId: id,
      writeUpId: id,
      WriteUpName: payload.writeUpName,
      writeUpName: payload.writeUpName,
      WriteUp1: payload.writeUp1,
      writeUp1: payload.writeUp1,
      Language: payload.language,
      language: payload.language,
      IsActive: payload.isActive,
      isActive: payload.isActive,
      ModifiedBy: payload.modifiedBy ?? payload.createdBy ?? '',
      modifiedBy: payload.modifiedBy ?? payload.createdBy ?? '',
      ModifiedDate: nowIso,
      modifiedDate: nowIso,
      writeuptags: payload.writeuptags ?? [],
    };
    if (payload.createdBy !== undefined) { body.CreatedBy = payload.createdBy; body.createdBy = payload.createdBy; }
    if (payload.createdDate !== undefined) { body.CreatedDate = payload.createdDate; body.createdDate = payload.createdDate; }
    const res = await apiHandler(endpoints.updateWriteUp, body);
    if (res.error) return { status: res.status, error: true, message: res.message };
    return { status: 200, message: 'Updated' };
  } catch (e: any) {
    return { status: 500, error: true, message: 'Failed to update', errorMessage: e?.message };
  }
}

export async function deleteWriteUpAction(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await apiHandler(endpoints.deleteWriteUp, { id } as any);
    if (res.error) return { status: res.status, error: true, message: res.message };
    return { status: 200, message: 'Deleted' };
  } catch (e: any) { return { status: 500, error: true, message: 'Failed to delete', errorMessage: e?.message }; }
}

export async function getWriteUpByIdAction(id: number): Promise<ApiResponse<WriteUpRow>> {
  try {
    const res = await apiHandler(endpoints.getWriteUpById, { id } as any);
    if (res.status !== 200 || !res.data) return { status: res.status, error: true, message: res.message || 'Failed', errorMessage: res.errorMessage };
    const it: any = res.data;
    const row: WriteUpRow = {
      id: it.WriteUpId ?? it.writeUpId ?? id,
      name: it.WriteUpName ?? it.writeUpName ?? '',
      writeup: it.WriteUp1 ?? it.writeUp1 ?? '',
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
