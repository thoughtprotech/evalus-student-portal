"use server";

import { ApiResponse } from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

// Row model consumed by the grid UI
export interface CandidateRow {
    candidateId: number;
    firstName: string;
    lastName: string;
    email: string;
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
    console.log(`🔄 Starting to map ${items.length} candidate items`);

    return items.map((item, index) => {
        console.log(`📝 Mapping candidate item ${index + 1}/${items.length}:`, item);

        // Validate item structure
        if (!item) {
            console.log(`⚠️  Candidate item ${index} is null or undefined`);
            return null;
        }

        if (typeof item !== 'object') {
            console.log(`⚠️  Candidate item ${index} is not an object:`, typeof item);
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
            console.warn(`⚠️  Could not resolve candidate id for item index ${index}. Raw item keys:`, Object.keys(item));
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
            createdBy: item.createdBy || "System",
            createdDate: item.createdDate || "",
            modifiedBy: item.modifiedBy || "",
            modifiedDate: item.modifiedDate || "",
        };

        console.log(`✅ Mapped candidate item ${index + 1}:`, mapped);
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
            console.warn("Failed to build group name map", e);
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
            allItems.sort((a:any, b:any) => {
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
                        const sval = val.replace(/^'|'$/g,''); return String(raw).toLowerCase() === sval.toLowerCase();
                    }
                    const startsWithMatch = f.match(/startswith\((\w+),'(.+?)'\)/);
                    if (startsWithMatch) { const [, fld, val] = startsWithMatch; return String(item[fld]||'').toLowerCase().startsWith(val.toLowerCase()); }
                    const endsWithMatch = f.match(/endswith\((\w+),'(.+?)'\)/);
                    if (endsWithMatch) { const [, fld, val] = endsWithMatch; return String(item[fld]||'').toLowerCase().endsWith(val.toLowerCase()); }
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

export async function deleteCandidateAction(candidate: any): Promise<ApiResponse<null>> {
    try {
        // For now, return a placeholder implementation
        console.log("Delete candidate with id:", candidate.id);
        return {
            status: 200,
            message: "Candidate deletion not implemented yet. Please add endpoint to endpoints.ts"
        };
    } catch (error: any) {
        return {
            status: 500,
            error: true,
            message: "Network error",
            errorMessage: error?.message,
        };
    }
}

// Legacy compatibility functions
interface Candidate {
    id: number;
    name: string;
    email: string;
    appliedRole: string;
    appliedAt: string;
}

const generateMockCandidates = (count: number): Candidate[] => {
    const roles = [
        "Frontend Dev",
        "Backend Dev",
        "UI/UX Designer",
        "QA Engineer",
    ];
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        name: `Candidate ${i + 1}`,
        email: `candidate${i + 1}@example.com`,
        appliedRole: roles[i % roles.length],
        appliedAt: new Date(Date.now() - i * 43200000).toISOString(),
    }));
};

export async function fetchCandidatesLegacyAction(): Promise<
    ApiResponse<Candidate[]>
> {
    try {
        const allCandidates = generateMockCandidates(25);

        return {
            status: 200,
            message: "Fetching Candidates Successful",
            data: allCandidates,
        };
    } catch (error) {
        console.log("Error Fetching Candidates", error);
        return { status: 500, message: "Error Fetching Candidates" };
    }
}