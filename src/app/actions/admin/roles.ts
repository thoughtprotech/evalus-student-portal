"use server";

import { ApiResponse } from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

// Row model for the grid UI
export interface RoleRow {
  id: number;
  name: string;
  language: string;
  superAdmin: number;
  isActive: number;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
}

// API response structure for a role item
interface ApiRoleItem {
  roleId: number;
  name: string;
  language: string;
  superAdmin: number;
  isActive: number;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
}

interface ODataResponse<T> {
  "@odata.count"?: number;
  value: T[];
}

export interface FetchRolesParams {
  top?: number;
  skip?: number;
  orderBy?: string;
  filter?: string;
}

function buildQuery(params: FetchRolesParams): string {
  const searchParams = new URLSearchParams();
  if (typeof params.top === "number") searchParams.set("$top", String(params.top));
  if (typeof params.skip === "number") searchParams.set("$skip", String(params.skip));
  if (params.orderBy) searchParams.set("$orderby", params.orderBy);
  if (params.filter) searchParams.set("$filter", params.filter);
  return searchParams.toString();
}

function mapToRows(items: ApiRoleItem[]): RoleRow[] {
  return items.map((item) => ({
    id: item.roleId,
    name: item.name,
    language: item.language,
    superAdmin: Number(item.superAdmin) || 0,
    isActive: Number(item.isActive) || 0,
    createdBy: item.createdBy || "System",
    createdDate: item.createdDate || "",
    modifiedBy: item.modifiedBy || "",
    modifiedDate: item.modifiedDate || "",
  }));
}

export async function fetchRolesAction(
  params: FetchRolesParams = { top: 15, skip: 0 }
): Promise<ApiResponse<{ rows: RoleRow[]; total: number }>> {
  try {
    const response = await apiHandler(endpoints.getAdminRoles, { query: "" });

    if (response.error || response.status !== 200) {
      return {
        status: response.status,
        error: true,
        message: response.message || `Failed to fetch roles`,
        errorMessage: response.errorMessage,
      };
    }

    let allItems: ApiRoleItem[] = [];
    let total = 0;

    if (Array.isArray(response.data)) {
      allItems = response.data;
      total = allItems.length;

      // Client-side pagination
      const requestedTop = params.top || 15;
      const currentSkip = params.skip || 0;

      // Sorting
      if (params.orderBy) {
        const [field, direction] = params.orderBy.split(' ');
        allItems.sort((a: any, b: any) => {
          const aVal = a[field];
          const bVal = b[field];
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;
          return direction === 'desc' ? -comparison : comparison;
        });
      }

      // Filtering (simple contains for name)
      if (params.filter) {
        const filterLower = params.filter.toLowerCase();
        allItems = allItems.filter((item: any) =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(filterLower)
          )
        );
        total = allItems.length;
      }

      const paginatedItems = allItems.slice(currentSkip, currentSkip + requestedTop);
      const mappedRows = mapToRows(paginatedItems);
      return {
        status: 200,
        message: `Successfully fetched ${mappedRows.length} roles`,
        data: { rows: mappedRows, total }
      };
    } else {
      return {
        status: 200,
        message: "No roles found",
        data: { rows: [], total: 0 }
      };
    }
  } catch (error: any) {
    return {
      status: 500,
      error: true,
      message: "Failed to fetch roles from API",
      errorMessage: error?.message,
    };
  }
}

export async function deleteRoleAction(role: any): Promise<ApiResponse<null>> {
  try {
    const res = await apiHandler(endpoints.deleteRole, { roleId: role.id });
    return res;
  } catch (error: any) {
    return {
      status: 500,
      error: true,
      message: "Failed to delete role",
      errorMessage: error?.message,
    };
  }
}