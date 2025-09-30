"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse } from "@/utils/api/types";

export type TestCertificateRow = {
    id: number;
    name: string;
    template: string;
    language?: string;
    isActive: number;
    createdBy?: string;
    createdDate?: string;
    modifiedBy?: string;
    modifiedDate?: string;
};

export interface FetchTestCertificateParams {
    top?: number;
    skip?: number;
    orderBy?: string; // e.g., "CreatedDate desc"
    filter?: string; // OData $filter
}

export async function fetchTestCertificatesAction(
    params: FetchTestCertificateParams = { top: 15, skip: 0 }
): Promise<ApiResponse<{ rows: TestCertificateRow[]; total: number }>> {
    try {
        const sp = new URLSearchParams();
        if (typeof params.top === "number") sp.set("$top", String(params.top));
        if (typeof params.skip === "number") sp.set("$skip", String(params.skip));
        if (params.orderBy) sp.set("$orderby", params.orderBy);
        if (params.filter) sp.set("$filter", params.filter);
        sp.set("$count", "true");
        sp.set(
            "$select",
            "TestCertificateId,TestCertificateName,TestCertificateTemplates,Language,IsActive,CreatedBy,CreatedDate,ModifiedBy,ModifiedDate"
        );

        const res = await apiHandler(
            { method: "GET", path: () => `/Odata/TestCertificates?${sp.toString()}`, type: "OPEN" } as any,
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
        const rows: TestCertificateRow[] = list.map((d: any) => ({
            id: d.TestCertificateId ?? d.testCertificateId,
            name: d.TestCertificateName ?? d.testCertificateName,
            template: d.TestCertificateTemplates ?? d.testCertificateTemplates,
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

export async function createTestCertificateAction(payload: {
    testCertificateName: string;
    testCertificateTemplates: string;
    language: string;
    isActive: number;
    createdBy?: string;
    createdDate?: string;
    modifiedBy?: string;
    modifiedDate?: string;
}): Promise<ApiResponse<any>> {
    try {
        const body = {
            testCertificateId: 0,
            testCertificateName: payload.testCertificateName,
            testCertificateTemplates: payload.testCertificateTemplates,
            language: payload.language,
            isActive: payload.isActive,
            createdBy: payload.createdBy,
            createdDate: payload.createdDate,
            modifiedBy: payload.modifiedBy,
            modifiedDate: payload.modifiedDate,
        };

        const res = await apiHandler(
            { method: "POST", path: () => `/api/TestCertificates`, type: "OPEN" } as any,
            body as any
        );
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

export async function updateTestCertificateAction(
    id: number,
    payload: {
        testCertificateName: string;
        testCertificateTemplates: string;
        language: string;
        isActive: number;
        createdBy?: string;
        createdDate?: string;
        modifiedBy?: string;
        modifiedDate?: string;
    }
): Promise<ApiResponse<any>> {
    try {
        const body = {
            testCertificateId: id,
            testCertificateName: payload.testCertificateName,
            testCertificateTemplates: payload.testCertificateTemplates,
            language: payload.language,
            isActive: payload.isActive,
            createdBy: payload.createdBy || 'System',
            createdDate: payload.createdDate || new Date().toISOString(),
            modifiedBy: payload.modifiedBy || 'System',
            modifiedDate: payload.modifiedDate || new Date().toISOString(),
        };

        const res = await apiHandler(
            { method: "PUT", path: () => `/api/TestCertificates/${id}`, type: "OPEN" } as any,
            body as any
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

export async function deleteTestCertificateAction(id: number): Promise<ApiResponse<null>> {
    try {
        return (await apiHandler(
            { method: "DELETE", path: () => `/api/TestCertificates/${id}`, type: "OPEN" } as any,
            null as any
        )) as any;
    } catch (e: any) {
        return {
            status: 500,
            error: true,
            message: "Failed to delete",
            errorMessage: e?.message,
        };
    }
}

export async function getTestCertificateByIdAction(
    id: number
): Promise<ApiResponse<TestCertificateRow | null>> {
    try {
        const res = await apiHandler(
            { method: "GET", path: () => `/api/TestCertificates/${id}`, type: "OPEN" } as any,
            null as any
        );
        if (res.status === 200 && res.data) {
            const d: any = res.data;
            const row: TestCertificateRow = {
                id: d.testCertificateId ?? d.TestCertificateId,
                name: d.testCertificateName ?? d.TestCertificateName,
                template: d.testCertificateTemplates ?? d.TestCertificateTemplates,
                language: d.language ?? d.Language,
                isActive: Number(d.isActive ?? d.IsActive) === 1 ? 1 : 0,
                createdBy: d.createdBy ?? d.CreatedBy,
                createdDate: d.createdDate ?? d.CreatedDate,
                modifiedBy: d.modifiedBy ?? d.ModifiedBy,
                modifiedDate: d.modifiedDate ?? d.ModifiedDate,
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