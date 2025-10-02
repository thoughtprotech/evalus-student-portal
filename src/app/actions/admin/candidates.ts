"use server";

import { ApiResponse } from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { fetchCandidateByIdAction } from "./candidates/updateCandidate";
import { promises as fs } from 'fs';
import path from 'path';

// Row model consumed by the grid UI
export interface CandidateRow {
    candidateId: number;
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    phoneNumber: string;
    cellPhone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    candidateGroup: string;
    notes: string;
    isActive: number | boolean;
    isHandicapped: number | boolean;
    createdBy: string;
    createdDate: string;
    modifiedBy: string;
    modifiedDate: string;
}

// API response structure based on your CandidateRegistration table
interface ApiCandidateItem {
    candidateRegistrationId: number;
    firstName: string;
    lastName: string;
    email: string;
    userName?: string;
    userLogin?: Array<{
        userName: string;
        displayName?: string;
        email?: string;
        role?: string;
        language?: string;
        region?: string;
        timeZone?: string;
        isActive?: boolean;
        createdBy?: string;
        createdDate?: string;
    }>;
    phoneNumber?: string;
    cellPhone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    candidateGroupName?: string;
    candidateGroupIds?: number[]; // backend can return just IDs; we'll resolve names via group tree
    notes?: string;
    isActive: number;
    isHandicapped?: number;
    createdDate: string;
    modifiedDate: string;
    createdBy?: string;
    modifiedBy?: string;
}

interface ODataResponse<T> {
    "@odata.count"?: number;
    value: T[];
}

export interface FetchCandidatesParams {
    top?: number; // $top
    skip?: number; // $skip
    orderBy?: string; // $orderby e.g., "CreatedDate desc"
    filter?: string; // $filter e.g., "contains(FirstName,'john')"
}

function buildQuery(params: FetchCandidatesParams): string {
    const searchParams = new URLSearchParams();

    if (typeof params.top === "number") searchParams.set("$top", String(params.top));
    if (typeof params.skip === "number") searchParams.set("$skip", String(params.skip));
    if (params.orderBy) searchParams.set("$orderby", params.orderBy);
    if (params.filter) searchParams.set("$filter", params.filter);

    return searchParams.toString();
}

function mapToRows(items: ApiCandidateItem[], groupNameById: Record<number, string>): CandidateRow[] {
    return items.map((item, index) => {
        if (!item || typeof item !== 'object') {
            return null;
        }

        // Resolve candidate id robustly (API field name inconsistencies safeguard)
        const resolvedId = (item as any).candidateRegistrationId
            ?? (item as any).CandidateRegistrationId
            ?? (item as any).candidateId
            ?? (item as any).CandidateId
            ?? (item as any).id
            ?? 0;
        if (!resolvedId || resolvedId === 0) {
            // Keep mapping but leave id as 0 if backend omitted
        }
        // Derive candidate group display string
        const idList = Array.isArray((item as any).candidateGroupIds)
            ? ((item as any).candidateGroupIds as any[]).map((n) => Number(n)).filter((n) => Number.isFinite(n))
            : [];
        const groupNames = idList.length > 0
            ? idList.map((id) => groupNameById[id] || `Group ${id}`).join(", ")
            : (item.candidateGroupName || "");

        const mapped = {
            candidateId: resolvedId,
            firstName: item.firstName || "",
            lastName: item.lastName || "",
            email: item.email || "",
            userName: item.userName || (item.userLogin && item.userLogin.length > 0 ? item.userLogin[0].userName : "") || "",
            phoneNumber: item.phoneNumber || "",
            cellPhone: item.cellPhone || "",
            address: item.address || "",
            city: item.city || "",
            state: item.state || "",
            postalCode: item.postalCode || "",
            country: item.country || "",
            candidateGroup: groupNames || "",
            notes: item.notes || "",
            isActive: item.isActive || 0,
            isHandicapped: item.isHandicapped || 0,
            createdBy: item.createdBy || "System",
            createdDate: item.createdDate || "",
            modifiedBy: item.modifiedBy || "",
            modifiedDate: item.modifiedDate || "",
        };

        return mapped;
    }).filter(item => item !== null) as CandidateRow[];
}

export async function fetchCandidatesAction(
    params: FetchCandidatesParams = { top: 15, skip: 0 }
): Promise<ApiResponse<{ rows: CandidateRow[]; total: number }>> {
    try {
        // Fetch candidates and candidate group tree in parallel
        const [response, groupRes] = await Promise.all([
            apiHandler(endpoints.getCandidates, { query: "" }),
            apiHandler(endpoints.getCandidateGroupTreeOData, null as any)
        ]);

        if (response.error || response.status !== 200) {
            return {
                status: response.status,
                error: true,
                message: response.message || `Failed to fetch candidates`,
                errorMessage: response.errorMessage,
            };
        }

        let allItems: ApiCandidateItem[] = [];
        if (Array.isArray(response.data)) {
            allItems = response.data as ApiCandidateItem[];
        } else if (response.data && typeof response.data === 'object') {
            const dataObj = response.data as any;
            if (Array.isArray(dataObj.value)) allItems = dataObj.value;
        }
        if (!allItems || allItems.length === 0) {
            return { status: 200, message: "No candidates found", data: { rows: [], total: 0 } };
        }

        // Build groupNameById map from the group tree once
        const groupNameById: Record<number, string> = {};
        try {
            const raw = (groupRes?.data as any)?.value ?? groupRes?.data ?? [];
            const pickChildren = (n: any): any[] => {
                const cands = [n?.children, n?.Children, n?.childrens, n?.ChildNodes, n?.Items, n?.Nodes, n?.Groups, n?.Subgroups];
                for (const c of cands) if (Array.isArray(c)) return c; return [];
            };
            const walk = (nodes: any[]) => {
                for (const n of nodes || []) {
                    const id = Number(n?.CandidateGroupId ?? n?.candidateGroupId ?? n?.CandidateGroupID ?? n?.GroupId ?? n?.GroupID ?? n?.Id ?? n?.id);
                    const name = n?.GroupName ?? n?.CandidateGroupName ?? n?.name ?? n?.Group ?? n?.Name ?? n?.Title ?? n?.Label ?? (Number.isFinite(id) ? `Group ${id}` : "Group");
                    if (Number.isFinite(id)) groupNameById[id] = String(name);
                    const kids = pickChildren(n); if (kids?.length) walk(kids);
                }
            };
            if (Array.isArray(raw)) walk(raw);
        } catch (e) {
            // Non-fatal; groups column will fallback to ids
        }

        // Client-side sorting
        if (params.orderBy) {
            const [field, direction] = params.orderBy.split(' ');
            const fieldMap: Record<string, string> = {
                candidateId: 'candidateRegistrationId',
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email',
                phoneNumber: 'phoneNumber',
                isActive: 'isActive',
                createdDate: 'createdDate',
                modifiedDate: 'modifiedDate'
            };
            const mapped = fieldMap[field] || field;
            allItems.sort((a: any, b: any) => {
                const av = a[mapped];
                const bv = b[mapped];
                if (av == null && bv != null) return -1;
                if (av != null && bv == null) return 1;
                if (av < bv) return direction === 'desc' ? 1 : -1;
                if (av > bv) return direction === 'desc' ? -1 : 1;
                return 0;
            });
        }

        // Client-side filtering (basic OData patterns similar to questions grid)
        if (params.filter) {
            const filterParts = params.filter.split(' and ');
            allItems = allItems.filter((item: any) => {
                return filterParts.every(part => {
                    const f = part.trim();
                    const containsMatch = f.match(/contains\((\w+),'(.+?)'\)/);
                    if (containsMatch) {
                        const [, fld, val] = containsMatch; return String(item[fld] || '').toLowerCase().includes(val.toLowerCase());
                    }
                    const eqMatch = f.match(/(\w+)\s+eq\s+(\d+|true|false|'[^']*')/);
                    if (eqMatch) {
                        const [, fld, val] = eqMatch; const raw = item[fld];
                        if (/^\d+$/.test(val)) return Number(raw) === Number(val);
                        if (val === 'true' || val === 'false') return Boolean(raw) === (val === 'true');
                        const sval = val.replace(/^'|'$/g, ''); return String(raw).toLowerCase() === sval.toLowerCase();
                    }
                    const startsWithMatch = f.match(/startswith\((\w+),'(.+?)'\)/);
                    if (startsWithMatch) { const [, fld, val] = startsWithMatch; return String(item[fld] || '').toLowerCase().startsWith(val.toLowerCase()); }
                    const endsWithMatch = f.match(/endswith\((\w+),'(.+?)'\)/);
                    if (endsWithMatch) { const [, fld, val] = endsWithMatch; return String(item[fld] || '').toLowerCase().endsWith(val.toLowerCase()); }
                    const lower = f.toLowerCase();
                    return Object.values(item).some(v => String(v).toLowerCase().includes(lower));
                });
            });
        }

        const total = allItems.length;
        const top = params.top ?? 15;
        const skip = params.skip ?? 0;
        const pageSlice = allItems.slice(skip, skip + top);
        const mappedRows = mapToRows(pageSlice, groupNameById);

        return {
            status: 200,
            message: `Successfully fetched ${mappedRows.length} candidates`,
            data: { rows: mappedRows, total }
        };
    } catch (error: any) {
        return {
            status: 500,
            error: true,
            message: 'Failed to fetch candidates from API',
            errorMessage: error?.message,
        };
    }
}

export async function deleteCandidateAction(candidateId: number): Promise<ApiResponse<null>> {
    try {
        // First, fetch the candidate details to get the userPhoto URL
        let userPhotoUrl: string | null = null;
        try {
            const candidateRes = await fetchCandidateByIdAction(candidateId);
            if (!candidateRes.error && candidateRes.data) {
                // Check if candidate has userLogin with userPhoto
                if (candidateRes.data.userLogin && Array.isArray(candidateRes.data.userLogin) && candidateRes.data.userLogin.length > 0) {
                    userPhotoUrl = candidateRes.data.userLogin[0].userPhoto;
                }
                // Fallback: check if userPhoto is at the root level
                if (!userPhotoUrl && candidateRes.data.userPhoto) {
                    userPhotoUrl = candidateRes.data.userPhoto;
                }
            }
        } catch (fetchError) {
            console.warn('Failed to fetch candidate details before deletion:', fetchError);
            // Continue with deletion even if we can't fetch the photo
        }

        // Delete the photo file if it exists and is a profile image
        if (userPhotoUrl && userPhotoUrl.includes('/uploads/profiles/')) {
            try {
                let relativePath = userPhotoUrl;
                // If userPhoto is a full URL, extract the path
                if (relativePath.startsWith('http')) {
                    try {
                        const urlObj = new URL(relativePath);
                        relativePath = urlObj.pathname;
                    } catch { }
                }

                // Delete the photo file from the file system
                if (relativePath.startsWith('/uploads/profiles/')) {
                    const fileName = path.basename(relativePath);
                    const profilesDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
                    const filePath = path.join(profilesDir, fileName);

                    try {
                        await fs.unlink(filePath);
                        console.log(`Deleted photo file: ${filePath}`);
                    } catch (unlinkError: any) {
                        if (unlinkError.code !== 'ENOENT') {
                            console.warn(`Failed to delete photo file: ${filePath}`, unlinkError);
                        }
                        // File doesn't exist or other error, continue with candidate deletion
                    }
                }
            } catch (photoError) {
                console.warn('Error deleting candidate photo:', photoError);
                // Continue with candidate deletion even if photo deletion fails
            }
        }

        // Now delete the candidate from the database
        const res = await apiHandler(endpoints.deleteCandidate, { candidateId });
        if (res.error || (res.status && res.status >= 400)) {
            return {
                status: res.status || 400,
                error: true,
                message: res.message || 'Failed to delete candidate',
                errorMessage: res.errorMessage,
            };
        }
        return { status: 200, message: 'Candidate deleted successfully' };
    } catch (error: any) {
        return {
            status: 500,
            error: true,
            message: 'Network error',
            errorMessage: error?.message,
        };
    }
}

// Removed legacy mock functions and console noise