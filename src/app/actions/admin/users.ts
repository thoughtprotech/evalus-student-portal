"use server";

import { ApiResponse } from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

// Row model consumed by the grid UI
export interface UserRow {
    candidateId: number;
    userName: string;
    displayName: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phoneNumber?: string;
    address?: string;
    userPhoto?: string | null;
    isActive: number | boolean;
    createdBy: string;
    createdDate: string;
    modifiedBy: string;
    modifiedDate: string;
}

// API response structure from CandidateRegistration table
interface ApiUserItem {
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
        userPhoto?: string | null;
        createdBy?: string;
        createdDate?: string;
    }>;
    phoneNumber?: string;
    address?: string;
    userPhoto?: string | null;
    isActive: number;
    createdDate: string;
    modifiedDate: string;
    createdBy?: string;
    modifiedBy?: string;
}

export interface FetchUsersParams {
    top?: number;
    skip?: number;
    orderBy?: string;
    filter?: string;
}

export async function fetchUsersAction(
    params: FetchUsersParams = {}
): Promise<ApiResponse<{ rows: UserRow[]; total: number }>> {
    try {
        // Use the same endpoint as candidates
        const response = await apiHandler(endpoints.getCandidates, { query: "" });

        if (response.error || response.status !== 200) {
            return {
                status: response.status,
                error: true,
                message: response.message || `Failed to fetch users`,
                errorMessage: response.errorMessage,
            };
        }

        let allItems: ApiUserItem[] = [];
        if (Array.isArray(response.data)) {
            allItems = response.data as ApiUserItem[];
        } else if (response.data && typeof response.data === 'object') {
            const dataObj = response.data as any;
            if (Array.isArray(dataObj.value)) allItems = dataObj.value;
        }

        // Filter out users with "candidate" role (client-side filtering)
        const filteredItems = allItems.filter(item => {
            const userLoginData = item.userLogin && item.userLogin[0];
            const role = userLoginData?.role || "";
            return role.toLowerCase() !== 'candidate';
        });

        if (!filteredItems || filteredItems.length === 0) {
            return { 
                status: 200, 
                message: "No users found", 
                data: { rows: [], total: 0 } 
            };
        }

        // Client-side sorting
        if (params.orderBy) {
            const [field, direction] = params.orderBy.split(' ');
            const fieldMap: Record<string, string> = {
                candidateId: 'candidateRegistrationId',
                userName: 'userName',
                displayName: 'displayName',
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email',
                role: 'role',
                phoneNumber: 'phoneNumber',
                isActive: 'isActive',
                createdDate: 'createdDate',
                modifiedDate: 'modifiedDate'
            };
            const mapped = fieldMap[field] || field;
            filteredItems.sort((a: any, b: any) => {
                let av, bv;
                
                // Handle nested userLogin fields
                if (field === 'userName' || field === 'displayName' || field === 'email' || field === 'role') {
                    const aUserLogin = a.userLogin && a.userLogin[0];
                    const bUserLogin = b.userLogin && b.userLogin[0];
                    
                    if (field === 'userName') {
                        av = aUserLogin?.userName || a.userName || "";
                        bv = bUserLogin?.userName || b.userName || "";
                    } else if (field === 'displayName') {
                        av = aUserLogin?.displayName || `${a.firstName} ${a.lastName}`.trim() || "";
                        bv = bUserLogin?.displayName || `${b.firstName} ${b.lastName}`.trim() || "";
                    } else if (field === 'email') {
                        av = aUserLogin?.email || a.email || "";
                        bv = bUserLogin?.email || b.email || "";
                    } else if (field === 'role') {
                        av = aUserLogin?.role || "";
                        bv = bUserLogin?.role || "";
                    }
                } else {
                    av = a[mapped];
                    bv = b[mapped];
                }

                if (av == null && bv != null) return -1;
                if (av != null && bv == null) return 1;
                if (av < bv) return direction === 'desc' ? 1 : -1;
                if (av > bv) return direction === 'desc' ? -1 : 1;
                return 0;
            });
        }

        // Client-side filtering (basic OData patterns)
        let processedItems = filteredItems;
        if (params.filter) {
            const filterParts = params.filter.split(' and ');
            processedItems = filteredItems.filter((item: any) => {
                return filterParts.every(part => {
                    const f = part.trim();
                    
                    // Skip the role filter as we already filtered it
                    if (f.includes("role ne 'Candidate'") || f.includes("role ne 'candidate'")) {
                        return true;
                    }
                    
                    const userLoginData = item.userLogin && item.userLogin[0];
                    
                    const containsMatch = f.match(/contains\((\w+),'(.+?)'\)/);
                    if (containsMatch) {
                        const [, fld, val] = containsMatch;
                        let fieldValue = "";
                        
                        // Check if field is in userLogin
                        if (fld === 'userName' || fld === 'displayName' || fld === 'email' || fld === 'role') {
                            if (fld === 'userName') {
                                fieldValue = userLoginData?.userName || item.userName || "";
                            } else if (fld === 'displayName') {
                                fieldValue = userLoginData?.displayName || `${item.firstName} ${item.lastName}`.trim() || "";
                            } else if (fld === 'email') {
                                fieldValue = userLoginData?.email || item.email || "";
                            } else if (fld === 'role') {
                                fieldValue = userLoginData?.role || "";
                            }
                        } else {
                            fieldValue = String(item[fld] || '');
                        }
                        
                        return fieldValue.toLowerCase().includes(val.toLowerCase());
                    }
                    
                    const eqMatch = f.match(/(\w+)\s+eq\s+(\d+|true|false|'[^']*')/);
                    if (eqMatch) {
                        const [, fld, val] = eqMatch;
                        const raw = item[fld];
                        if (/^\d+$/.test(val)) return Number(raw) === Number(val);
                        if (val === 'true' || val === 'false') return Boolean(raw) === (val === 'true');
                        const sval = val.replace(/^'|'$/g, '');
                        return String(raw).toLowerCase() === sval.toLowerCase();
                    }
                    
                    const startsWithMatch = f.match(/startswith\((\w+),'(.+?)'\)/);
                    if (startsWithMatch) {
                        const [, fld, val] = startsWithMatch;
                        return String(item[fld] || '').toLowerCase().startsWith(val.toLowerCase());
                    }
                    
                    const endsWithMatch = f.match(/endswith\((\w+),'(.+?)'\)/);
                    if (endsWithMatch) {
                        const [, fld, val] = endsWithMatch;
                        return String(item[fld] || '').toLowerCase().endsWith(val.toLowerCase());
                    }
                    
                    // Default: search across all fields
                    const lower = f.toLowerCase();
                    return Object.values(item).some(v => String(v).toLowerCase().includes(lower));
                });
            });
        }

        const total = processedItems.length;
        const top = params.top ?? 15;
        const skip = params.skip ?? 0;
        const pageSlice = processedItems.slice(skip, skip + top);

        // Map to UserRow
        const rows: UserRow[] = pageSlice.map((item) => {
            const userLoginData = item.userLogin && item.userLogin[0];

            // Resolve candidate id robustly to handle API variations
            const resolvedId = (item as any).candidateRegistrationId
                ?? (item as any).CandidateRegistrationId
                ?? (item as any).candidateId
                ?? (item as any).CandidateId
                ?? (item as any).id
                ?? (item as any).Id
                ?? 0;

            return {
                candidateId: Number(resolvedId) || 0,
                userName: userLoginData?.userName || item.userName || "",
                displayName: userLoginData?.displayName || `${item.firstName} ${item.lastName}`.trim() || "",
                firstName: item.firstName || "",
                lastName: item.lastName || "",
                email: userLoginData?.email || item.email || "",
                role: userLoginData?.role || "",
                phoneNumber: item.phoneNumber || "",
                address: item.address || "",
                userPhoto: userLoginData?.userPhoto || item.userPhoto || null,
                isActive: item.isActive ?? 1,
                createdBy: item.createdBy || "",
                createdDate: item.createdDate || "",
                modifiedBy: item.modifiedBy || "",
                modifiedDate: item.modifiedDate || "",
            };
        });

        return {
            status: 200,
            error: false,
            data: { rows, total },
            message: "Users fetched successfully",
        };
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return {
            status: 500,
            error: true,
            errorMessage: error.message || "Failed to fetch users",
        };
    }
}

export async function deleteUserAction(
    candidateId: number
): Promise<ApiResponse<null>> {
    try {
        // Use the same deletion logic as candidates - via apiHandler
        const res = await apiHandler(endpoints.deleteCandidate, { candidateId });
        
        if (res.error || (res.status && res.status >= 400)) {
            return {
                status: res.status || 400,
                error: true,
                message: res.message || 'Failed to delete user',
                errorMessage: res.errorMessage,
            };
        }
        
        return { 
            status: 200, 
            error: false,
            data: null,
            message: 'User deleted successfully' 
        };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return {
            status: 500,
            error: true,
            errorMessage: error.message || "Failed to delete user",
        };
    }
}
