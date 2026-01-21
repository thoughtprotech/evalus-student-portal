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
    documentType?: string;
    validFrom?: string;
    validTo?: string;
    candidateRegisteredPublishedDocuments?: { publishedDocumentId: number; candidateGroupId: number; candidateGroupName?: string }[];
};

export async function fetchPublishedDocumentsODataAction(params: { query?: string } = {}): Promise<ApiResponse<{ rows: PublishedDocumentRow[]; total: number }>> {
    const q = params.query || "";
    
    // Fetch both documents and candidate groups in parallel
    const [docsRes, groupsRes] = await Promise.all([
        apiHandler(endpoints.listPublishedDocumentsOData, { query: q }),
        apiHandler(endpoints.listCandidateGroupsOData, { query: "?$select=CandidateGroupId,CandidateGroupName" })
    ]);
    
    if (docsRes.status === 200 && docsRes.data) {
        const list = (docsRes.data as any).value || [];
        const total = (docsRes.data as any)["@odata.count"] || list.length;
        
        // Build group ID to name map
        const groupMap: Record<number, string> = {};
        if (groupsRes.status === 200 && groupsRes.data) {
            const groups = (groupsRes.data as any).value || [];
            for (const g of groups) {
                const id = g.CandidateGroupId ?? g.candidateGroupId;
                const name = g.CandidateGroupName ?? g.candidateGroupName;
                if (id && name) groupMap[id] = name;
            }
        }
        
        const rows: PublishedDocumentRow[] = list.map((d: any) => ({
            id: d.PublishedDocumentId ?? d.Id ?? d.id,
            publishedDocumentFolderId: d.PublishedDocumentFolderId ?? d.publishedDocumentFolderId,
            folderName: d.PublishedDocumentFolderName ?? d.folderName ?? d.FolderName,
            documentName: d.DocumentName ?? d.documentName,
            documentUrl: d.DocumentUrl ?? d.documentUrl,
            validFrom: d.ValidFrom ?? d.validFrom,
            validTo: d.ValidTo ?? d.validTo,
            candidateRegisteredPublishedDocuments: Array.isArray(d.CandidateRegisteredPublishedDocuments || d.candidateRegisteredPublishedDocuments)
                ? (d.CandidateRegisteredPublishedDocuments || d.candidateRegisteredPublishedDocuments).map((x: any) => {
                    const groupId = x.CandidateGroupID ?? x.CandidateGroupId ?? x.candidateGroupId;
                    return {
                        publishedDocumentId: x.PublishedDocumentId ?? x.publishedDocumentId,
                        candidateGroupId: groupId,
                        candidateGroupName: groupMap[groupId] || `Group ${groupId}`
                    };
                })
                : []
        }));
        return { status: 200, data: { rows, total }, message: `Fetched ${rows.length} documents` };
    }
    return { status: docsRes.status, error: docsRes.error, errorMessage: docsRes.errorMessage, message: docsRes.message } as any;
}

export async function createPublishedDocumentAction(payload: { id: number; publishedDocumentFolderId: number; documentName: string; documentUrl: string; documentType?: string; validFrom?: string; validTo?: string; candidateRegisteredPublishedDocuments?: { publishedDocumentId: number; candidateGroupId: number }[] }): Promise<ApiResponse<null>> {
    const body = {
        id: payload.id,
        publishedDocumentFolderId: payload.publishedDocumentFolderId,
        documentName: payload.documentName,
        documentUrl: payload.documentUrl,
        documentType: payload.documentType,
        validFrom: payload.validFrom,
        validTo: payload.validTo,
        candidateRegisteredPublishedDocuments: payload.candidateRegisteredPublishedDocuments || [],
    };
    const res = await apiHandler(endpoints.createPublishedDocument, body as any);
    return res as any;
}

export async function updatePublishedDocumentAction(id: number, payload: { publishedDocumentFolderId: number; documentName: string; documentUrl: string; documentType?: string; validFrom?: string; validTo?: string; candidateRegisteredPublishedDocuments?: { publishedDocumentId: number; candidateGroupId: number }[] }): Promise<ApiResponse<null>> {
    const body = {
        id,
        publishedDocumentFolderId: payload.publishedDocumentFolderId,
        documentName: payload.documentName,
        documentUrl: payload.documentUrl,
        documentType: payload.documentType,
        validFrom: payload.validFrom,
        validTo: payload.validTo,
        candidateRegisteredPublishedDocuments: payload.candidateRegisteredPublishedDocuments || [],
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
        const row: any = {
            id: d.PublishedDocumentId ?? d.Id ?? d.id,
            publishedDocumentFolderId: d.PublishedDocumentFolderId ?? d.publishedDocumentFolderId,
            folderName: d.PublishedDocumentFolderName ?? d.folderName ?? d.FolderName,
            documentName: d.DocumentName ?? d.documentName,
            documentUrl: d.DocumentUrl ?? d.documentUrl,
            documentType: d.DocumentType ?? d.documentType,
            validFrom: d.ValidFrom ?? d.validFrom,
            validTo: d.ValidTo ?? d.validTo,
        };
        // Include candidateRegisteredPublishedDocuments if present
        if (Array.isArray(d.CandidateRegisteredPublishedDocuments) || Array.isArray(d.candidateRegisteredPublishedDocuments)) {
            const docs = d.CandidateRegisteredPublishedDocuments ?? d.candidateRegisteredPublishedDocuments;
            row.candidateRegisteredPublishedDocuments = docs.map((x: any) => ({
                publishedDocumentId: x.PublishedDocumentId ?? x.publishedDocumentId,
                candidateGroupId: x.CandidateGroupID ?? x.CandidateGroupId ?? x.candidateGroupId
            }));
        }
        return { status: 200, data: row, message: 'Fetched' } as any;
    }
    return { status: res.status, error: res.error, errorMessage: res.errorMessage, message: res.message } as any;
}

