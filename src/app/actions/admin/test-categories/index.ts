"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse } from "@/utils/api/types";

export type TestCategoryRow = {
    id: number;
    name: string;
    type: string; // Category | Sub Category
    parentId: number;
    language?: string;
    isActive: number;
    createdBy?: string;
    createdDate?: string;
    modifiedBy?: string;
    modifiedDate?: string;
};

export async function fetchTestCategoriesODataAction(params: { top?: number; skip?: number; orderBy?: string; filter?: string } = {}): Promise<ApiResponse<{ rows: TestCategoryRow[]; total: number }>> {
    const sp = new URLSearchParams();
    if (typeof params.top === 'number') sp.set('$top', String(params.top));
    if (typeof params.skip === 'number') sp.set('$skip', String(params.skip));
    if (params.orderBy) sp.set('$orderby', params.orderBy);
    if (params.filter) sp.set('$filter', params.filter);
    sp.set('$count', 'true');
    sp.set('$select', 'TestCategoryId,TestCategoryName,TestCategoryType,ParentId,Language,IsActive,CreatedBy,CreatedDate,ModifiedBy,ModifiedDate');

    const res = await apiHandler(endpoints.getAdminTestCategories, { query: `?${sp.toString()}#cb=${Date.now()}` } as any);
    if (res.status === 200 && res.data) {
        const payload: any = res.data;
        const list: any[] = Array.isArray(payload?.value) ? payload.value : [];
        const total = Number(payload['@odata.count'] ?? list.length) || list.length;
        const rows: TestCategoryRow[] = list.map((d: any) => ({
            id: d.TestCategoryId ?? d.testCategoryId ?? d.Id ?? d.id,
            name: d.TestCategoryName ?? d.testCategoryName ?? d.Name ?? d.name,
            type: d.TestCategoryType ?? d.testCategoryType ?? d.Type ?? d.type,
            parentId: Number(d.ParentId ?? d.parentId ?? 0),
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

export async function getTestCategoryByIdAction(id: number): Promise<ApiResponse<TestCategoryRow | null>> {
    const res = await apiHandler(endpoints.getTestCategoryById, { id } as any);
    if (res.status === 200 && res.data) {
        const d: any = res.data;
        const row: TestCategoryRow = {
            id: d.TestCategoryId ?? d.testCategoryId ?? id,
            name: d.TestCategoryName ?? d.testCategoryName ?? d.Name ?? d.name,
            type: d.TestCategoryType ?? d.testCategoryType ?? d.Type ?? d.type,
            parentId: Number(d.ParentId ?? d.parentId ?? 0),
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

export async function createTestCategoryAction(payload: { name: string; type: string; parentId: number; language: string; isActive: number; createdBy?: string; createdDate?: string; modifiedBy?: string; modifiedDate?: string }): Promise<ApiResponse<null>> {
    const body = {
        testCategoryId: 0,
        testCategoryName: payload.name,
        testCategoryType: payload.type,
        parentId: payload.parentId,
        language: payload.language,
        isActive: payload.isActive,
        createdBy: payload.createdBy,
        createdDate: payload.createdDate,
        modifiedBy: payload.modifiedBy,
        modifiedDate: payload.modifiedDate,
    };
    return (await apiHandler(endpoints.createTestCategory, body as any)) as any;
}

export async function updateTestCategoryAction(id: number, payload: { name: string; type: string; parentId: number; language: string; isActive: number; createdBy?: string; createdDate?: string; modifiedBy?: string; modifiedDate?: string }): Promise<ApiResponse<null>> {
    const body = {
        testCategoryId: id,
        testCategoryName: payload.name,
        testCategoryType: payload.type,
        parentId: payload.parentId,
        language: payload.language,
        isActive: payload.isActive,
        createdBy: payload.createdBy,
        createdDate: payload.createdDate,
        modifiedBy: payload.modifiedBy,
        modifiedDate: payload.modifiedDate,
    };
    return (await apiHandler(endpoints.updateTestCategory, body as any)) as any;
}

export async function deleteTestCategoryAction(id: number): Promise<ApiResponse<null>> {
    return (await apiHandler(endpoints.deleteTestCategory, { id } as any)) as any;
}
