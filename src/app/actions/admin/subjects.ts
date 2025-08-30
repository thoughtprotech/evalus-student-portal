"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse } from "@/utils/api/types";
import type { GetSubjectsResponse, CreateSubjectRequest, UpdateSubjectRequest } from "@/utils/api/types";

export interface SubjectRow {
    id: number;
    name: string;
    type: string; // retained for hierarchy building but hidden from grid per latest request
    parentId: number;
    language: string;
    isActive: number;
    createdBy?: string;
    createdDate?: string;
    modifiedBy?: string;
    modifiedDate?: string;
    questionCount?: number;
    dataPath?: string[]; // for tree grid
    level1?: string;
    level2?: string;
    level3?: string;
    level4?: string;
}

export async function fetchSubjectsAdminAction(): Promise<ApiResponse<SubjectRow[]>> {
    try {
        const res = await apiHandler(endpoints.getSubjects, null);
        if (res.status === 200 && Array.isArray(res.data)) {
            const rows: SubjectRow[] = res.data.map((s: GetSubjectsResponse) => ({
                id: s.subjectId,
                name: s.subjectName,
                type: s.subjectType,
                parentId: s.parentId,
                language: s.language,
                isActive: Number(s.isActive) === 1 ? 1 : 0,
                createdBy: s.createdBy,
                createdDate: s.createdDate,
                modifiedBy: s.modifiedBy,
                modifiedDate: s.modifiedDate,
                questionCount: 0,
            }));

            // Build dataPath for tree hierarchy
            const byId: Record<number, SubjectRow> = Object.fromEntries(rows.map(r => [r.id, r]));
            const buildPath = (r: SubjectRow, depthGuard = 0): string[] => {
                if (depthGuard > 50) return [r.name];
                if (!r.parentId || !byId[r.parentId]) return [r.name];
                return [...buildPath(byId[r.parentId], depthGuard + 1), r.name];
            };
            rows.forEach(r => {
                r.dataPath = buildPath(r);
                // Map into fixed depth levels for community grouping
                const [a, b, c, d] = r.dataPath;
                r.level1 = a; r.level2 = b; r.level3 = c; r.level4 = d;
            });
            return { status: 200, data: rows, message: "Subjects fetched" };
        }
        return { status: res.status, error: true, message: res.message || "Failed to fetch subjects", errorMessage: res.errorMessage };
    } catch (e: any) {
        return { status: 500, error: true, message: "Error fetching subjects", errorMessage: e?.message };
    }
}

export interface FetchSubjectsParams {
    top?: number;
    skip?: number;
    orderBy?: string; // 'SubjectName asc'
    filter?: string;  // OData $filter fragment
}

// OData based subjects fetch with pagination & filtering
export async function fetchSubjectsODataAction(params: FetchSubjectsParams = { top: 15, skip: 0 }): Promise<ApiResponse<{ rows: SubjectRow[]; total: number }>> {
    try {
        const searchParams = new URLSearchParams();
        if (typeof params.top === 'number') searchParams.set('$top', String(params.top));
        if (typeof params.skip === 'number') searchParams.set('$skip', String(params.skip));
        if (params.orderBy) searchParams.set('$orderby', params.orderBy);
        if (params.filter) searchParams.set('$filter', params.filter);
        searchParams.set('$count', 'true');
        searchParams.set('$select', 'SubjectId,SubjectName,SubjectType,ParentId,Language,IsActive,CreatedBy,CreatedDate,ModifiedBy,ModifiedDate');

        const query = `?${searchParams.toString()}`;
        const res = await apiHandler(endpoints.listSubjectsOData, { query });
        if (res.status !== 200 || !res.data) {
            return { status: res.status, error: true, message: res.message || 'Failed to fetch subjects', errorMessage: res.errorMessage };
        }
        const payload: any = res.data;
        const total = payload['@odata.count'] || payload['@odata.Count'] || payload.count || payload.total || 0;
        const list: any[] = Array.isArray(payload.value) ? payload.value : [];
        const rows: SubjectRow[] = list.map((s: any) => ({
            id: s.SubjectId ?? s.subjectId,
            name: s.SubjectName ?? s.subjectName,
            type: s.SubjectType ?? s.subjectType ?? '',
            parentId: s.ParentId ?? s.parentId ?? 0,
            language: s.Language ?? s.language ?? '',
            isActive: Number(s.IsActive ?? s.isActive) === 1 ? 1 : 0,
            createdBy: s.CreatedBy ?? s.createdBy,
            createdDate: s.CreatedDate ?? s.createdDate,
            modifiedBy: s.ModifiedBy ?? s.modifiedBy,
            modifiedDate: s.ModifiedDate ?? s.modifiedDate,
            questionCount: s.QuestionCount ?? s.questionCount ?? 0,
        }));

        // Build hierarchy paths
        const byId: Record<number, SubjectRow> = Object.fromEntries(rows.map(r => [r.id, r]));
        const buildPath = (r: SubjectRow, guard = 0): string[] => {
            if (guard > 50) return [r.name];
            if (!r.parentId || !byId[r.parentId]) return [r.name];
            return [...buildPath(byId[r.parentId], guard + 1), r.name];
        };
        rows.forEach(r => {
            r.dataPath = buildPath(r);
            const [a, b, c, d] = r.dataPath;
            r.level1 = a; r.level2 = b; r.level3 = c; r.level4 = d;
        });

        return { status: 200, data: { rows, total }, message: `Fetched ${rows.length} subjects` };
    } catch (e: any) {
        return { status: 500, error: true, message: 'Error fetching subjects', errorMessage: e?.message };
    }
}

export async function createSubjectAction(payload: CreateSubjectRequest): Promise<ApiResponse<null>> {
    try {
        const res = await apiHandler(endpoints.createSubject, payload);
        return res;
    } catch (e: any) {
        return { status: 500, error: true, message: "Failed to create subject", errorMessage: e?.message };
    }
}

export async function updateSubjectAction(subjectId: number, payload: UpdateSubjectRequest): Promise<ApiResponse<null>> {
    try {
        const res = await apiHandler(endpoints.updateSubject, { ...payload, subjectId });
        return res;
    } catch (e: any) {
        return { status: 500, error: true, message: "Failed to update subject", errorMessage: e?.message };
    }
}

export async function deleteSubjectAction(subjectId: number): Promise<ApiResponse<null>> {
    try {
        const res = await apiHandler(endpoints.deleteSubject, { subjectId });
        return res;
    } catch (e: any) {
        return { status: 500, error: true, message: "Failed to delete subject", errorMessage: e?.message };
    }
}
