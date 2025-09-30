"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse } from "@/utils/api/types";

export type PublishedDocumentRow = {
    id: number;
    publishedDocumentFolderId: number;
    folderName?: string;
    documentName: string;
    documentUrl: string;
    validFrom?: string;
    validTo?: string;
};

export async function fetchPublishedDocumentsODataAction(params: { query?: string } = {}): Promise<ApiResponse<{ rows: PublishedDocumentRow[]; total: number }>> {
    const q = params.query || "";
    const res = await apiHandler(endpoints.listPublishedDocumentsOData, { query: q });
    if (res.status === 200 && res.data) {
        const list = (res.data as any).value || [];
        const total = (res.data as any)["@odata.count"] || list.length;
        const rows: PublishedDocumentRow[] = list.map((d: any) => ({
            id: d.PublishedDocumentId ?? d.Id ?? d.id,
            publishedDocumentFolderId: d.PublishedDocumentFolderId ?? d.publishedDocumentFolderId,
            folderName: d.PublishedDocumentFolderName ?? d.folderName ?? d.FolderName,
            documentName: d.DocumentName ?? d.documentName,
            documentUrl: d.DocumentUrl ?? d.documentUrl,
            validFrom: d.ValidFrom ?? d.validFrom,
            validTo: d.ValidTo ?? d.validTo,
        }));
        return { status: 200, data: { rows, total }, message: `Fetched ${rows.length} documents` };
    }
    return { status: res.status, error: res.error, errorMessage: res.errorMessage, message: res.message } as any;
}

export async function createPublishedDocumentAction(payload: { id: number; publishedDocumentFolderId: number; documentName: string; documentUrl: string; validFrom?: string; validTo?: string }): Promise<ApiResponse<null>> {
    const body = {
        id: payload.id,
        publishedDocumentFolderId: payload.publishedDocumentFolderId,
        documentName: payload.documentName,
        documentUrl: payload.documentUrl,
        validFrom: payload.validFrom,
        validTo: payload.validTo,
    };
    const res = await apiHandler(endpoints.createPublishedDocument, body as any);
    return res as any;
}

export async function updatePublishedDocumentAction(id: number, payload: { publishedDocumentFolderId: number; documentName: string; documentUrl: string; validFrom?: string; validTo?: string }): Promise<ApiResponse<null>> {
    const body = {
        id,
        publishedDocumentFolderId: payload.publishedDocumentFolderId,
        documentName: payload.documentName,
        documentUrl: payload.documentUrl,
        validFrom: payload.validFrom,
        validTo: payload.validTo,
    };
    const res = await apiHandler(endpoints.updatePublishedDocument, { ...body, id } as any);
    return res as any;
}

export async function deletePublishedDocumentAction(id: number): Promise<ApiResponse<null>> {
    const res = await apiHandler(endpoints.deletePublishedDocument, { id } as any);
    return res as any;
}

export async function getPublishedDocumentByIdAction(id: number): Promise<ApiResponse<PublishedDocumentRow | null>> {
    const res = await apiHandler(endpoints.getPublishedDocumentById, { id } as any);
    if (res.status === 200 && res.data) {
        const d: any = res.data;
        const row: PublishedDocumentRow = {
            id: d.PublishedDocumentId ?? d.Id ?? d.id,
            publishedDocumentFolderId: d.PublishedDocumentFolderId ?? d.publishedDocumentFolderId,
            folderName: d.PublishedDocumentFolderName ?? d.folderName ?? d.FolderName,
            documentName: d.DocumentName ?? d.documentName,
            documentUrl: d.DocumentUrl ?? d.documentUrl,
            validFrom: d.ValidFrom ?? d.validFrom,
            validTo: d.ValidTo ?? d.validTo,
        };
        return { status: 200, data: row, message: 'Fetched' } as any;
    }
    return { status: res.status, error: res.error, errorMessage: res.errorMessage, message: res.message } as any;
}

