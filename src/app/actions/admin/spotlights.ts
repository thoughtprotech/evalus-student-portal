"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse, GetSpotlightResponse } from "@/utils/api/types";

export type SpotlightRow = {
    id: number;
    name: string;
    description: string;
    addedDate?: string; // ISO
    validFrom: string; // ISO
    validTo: string; // ISO
    candidateRegisteredSpotlights?: { spotlightId: number; candidateGroupId: number; candidateGroupName?: string }[];
};

export async function fetchSpotlightsODataAction(params: { top?: number; skip?: number; orderBy?: string; filter?: string } = {}): Promise<ApiResponse<{ rows: SpotlightRow[]; total: number }>> {
    const sp = new URLSearchParams();
    if (typeof params.top === 'number') sp.set('$top', String(params.top));
    if (typeof params.skip === 'number') sp.set('$skip', String(params.skip));
    if (params.orderBy) sp.set('$orderby', params.orderBy);
    if (params.filter) sp.set('$filter', params.filter);
    // Select minimal fields if server supports; otherwise OData should ignore
    sp.set('$select', 'Id,SpotlightName,SpotlightNameDescription,AddedDate,ValidFrom,ValidTo');
    // Add expand for candidate groups
    sp.set('$expand', 'CandidateRegisteredSpotlights');
    // v4 count
    sp.set('$count', 'true');

    // Fetch both spotlights and candidate groups to map group names
    const [spotlightsRes, groupsRes] = await Promise.all([
        apiHandler(endpoints.getSpotlightsOData, { query: `?${sp.toString()}` }),
        apiHandler(endpoints.listCandidateGroupsOData, { query: "?$select=CandidateGroupId,CandidateGroupName" })
    ]);
    
    if (spotlightsRes.status === 200 && spotlightsRes.data) {
        const payload: any = spotlightsRes.data;
        const list: any[] = Array.isArray(payload?.value) ? payload.value : Array.isArray(payload) ? payload : [];
        const total = Number(payload['@odata.count'] ?? list.length) || list.length;
        
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
        
        const rows: SpotlightRow[] = list.map((d: any) => ({
            id: d.Id ?? d.id ?? d.SpotlightId ?? d.spotlightId,
            name: d.SpotlightName ?? d.spotlightName ?? d.Name ?? d.name,
            description: d.SpotlightNameDescription ?? d.spotlightNameDescription ?? d.Description ?? d.description ?? '',
            addedDate: d.AddedDate ?? d.addedDate ?? undefined,
            validFrom: d.ValidFrom ?? d.validFrom,
            validTo: d.ValidTo ?? d.validTo,
            candidateRegisteredSpotlights: Array.isArray(d.CandidateRegisteredSpotlights || d.candidateRegisteredSpotlights)
                ? (d.CandidateRegisteredSpotlights || d.candidateRegisteredSpotlights).map((x: any) => {
                    const groupId = x.CandidateGroupID ?? x.CandidateGroupId ?? x.candidateGroupId;
                    return {
                        spotlightId: x.SpotlightId ?? x.spotlightId,
                        candidateGroupId: groupId,
                        candidateGroupName: groupMap[groupId] || `Group ${groupId}`
                    };
                })
                : []
        }));
        return { status: 200, data: { rows, total }, message: `Fetched ${rows.length} spotlights` };
    }
    return { status: spotlightsRes.status, error: spotlightsRes.error, message: spotlightsRes.message, errorMessage: spotlightsRes.errorMessage } as any;
}

export async function getSpotlightByIdAction(id: number): Promise<ApiResponse<SpotlightRow | null>> {
    const res = await apiHandler(endpoints.getSpotlightById, { id } as any);
    if (res.status === 200 && res.data) {
        const d: any = res.data;
        const row: SpotlightRow = {
            id: d.Id ?? d.id ?? d.SpotlightId ?? d.spotlightId ?? id,
            name: d.SpotlightName ?? d.spotlightName ?? d.Name ?? d.name,
            description: d.SpotlightNameDescription ?? d.spotlightNameDescription ?? d.Description ?? d.description ?? '',
            addedDate: d.AddedDate ?? d.addedDate,
            validFrom: d.ValidFrom ?? d.validFrom,
            validTo: d.ValidTo ?? d.validTo,
        };
        // Include candidateRegisteredSpotlights if present
        if (Array.isArray(d.CandidateRegisteredSpotlights) || Array.isArray(d.candidateRegisteredSpotlights)) {
            const spotlights = d.CandidateRegisteredSpotlights ?? d.candidateRegisteredSpotlights;
            row.candidateRegisteredSpotlights = spotlights.map((x: any) => ({
                spotlightId: x.SpotlightId ?? x.spotlightId,
                candidateGroupId: x.CandidateGroupID ?? x.CandidateGroupId ?? x.candidateGroupId
            }));
        }
        return { status: 200, data: row } as any;
    }
    return { status: res.status, error: res.error, message: res.message, errorMessage: res.errorMessage } as any;
}

export async function createSpotlightAction(payload: { name: string; description: string; validFrom: string; validTo: string; selectedGroupIds?: number[] }): Promise<ApiResponse<null>> {
    // Build required payload per backend contract
    const nowIso = new Date().toISOString();
    const body = {
        id: 0,
        spotlightName: payload.name,
        spotlightNameDescription: payload.description,
        addedDate: nowIso,
        validFrom: payload.validFrom,
        validTo: payload.validTo,
        addedDay: 0,
        candidateRegisteredSpotlights: (payload.selectedGroupIds || []).map(groupId => ({ spotlightId: 0, candidateGroupId: groupId }))
    };
    const res = await apiHandler(endpoints.createSpotlight, body as any);
    return res as any;
}

export async function updateSpotlightAction(id: number, payload: { name: string; description: string; validFrom: string; validTo: string; addedDate?: string; selectedGroupIds?: number[] }): Promise<ApiResponse<null>> {
    const body = {
        id,
        spotlightName: payload.name,
        spotlightNameDescription: payload.description,
        addedDate: payload.addedDate || new Date().toISOString(),
        validFrom: payload.validFrom,
        validTo: payload.validTo,
        addedDay: 0,
        candidateRegisteredSpotlights: (payload.selectedGroupIds || []).map(groupId => ({ spotlightId: id, candidateGroupId: groupId }))
    };
    const res = await apiHandler(endpoints.updateSpotlight, { ...body, id } as any);
    return res as any;
}

export async function deleteSpotlightAction(id: number): Promise<ApiResponse<null>> {
    const res = await apiHandler(endpoints.deleteSpotlight, { id } as any);
    return res as any;
}
