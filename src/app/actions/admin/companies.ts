"use server";

import { ApiResponse } from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

// Row model consumed by the grid UI
export interface CompanyRow {
  id: number;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  companyLogo?: string;
  phoneNumber?: string;
  cellPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  isActive?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  modifiedBy?: string;
}

// API response structure based on your MySQL table
interface ApiCompanyItem {
  companyId: number;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  companyLogo?: string;
  phoneNumber?: string;
  cellPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
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

export interface FetchCompaniesParams {
  top?: number; // $top
  skip?: number; // $skip
  orderBy?: string; // $orderby e.g., "CreatedDate desc"
  filter?: string; // $filter e.g., "contains(CompanyName,'acme')"
}

function buildQuery(params: FetchCompaniesParams): string {
  const searchParams = new URLSearchParams();
  
  if (typeof params.top === "number") searchParams.set("$top", String(params.top));
  if (typeof params.skip === "number") searchParams.set("$skip", String(params.skip));
  if (params.orderBy) searchParams.set("$orderby", params.orderBy);
  if (params.filter) searchParams.set("$filter", params.filter);
  
  return searchParams.toString();
}

function mapToRows(items: ApiCompanyItem[]): CompanyRow[] {
  console.log(`🔄 Starting to map ${items.length} items`);
  
  return items.map((item, index) => {
    console.log(`📝 Mapping item ${index + 1}/${items.length}:`, item);
    
    // Validate item structure
    if (!item) {
      console.log(`⚠️  Item ${index} is null or undefined`);
      return null;
    }
    
    if (typeof item !== 'object') {
      console.log(`⚠️  Item ${index} is not an object:`, typeof item);
      return null;
    }
    
    const mapped = {
      id: item.companyId || 0,
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      companyName: item.companyName || "No Company Name",
      email: item.email || "",
      companyLogo: item.companyLogo || "",
      phoneNumber: item.phoneNumber || "",
      cellPhone: item.cellPhone || "",
      address: item.address || "",
      city: item.city || "",
      state: item.state || "",
      postalCode: item.postalCode || "",
      country: item.country || "",
      notes: item.notes || "",
      isActive: item.isActive || 0,
      createdAt: item.createdDate || "",
      updatedAt: item.modifiedDate || "",
      createdBy: item.createdBy || "System",
      modifiedBy: item.modifiedBy || "",
    };
    
    console.log(`✅ Mapped item ${index + 1}:`, mapped);
    return mapped;
  }).filter(item => item !== null) as CompanyRow[];
}

// Local endpoint descriptor - adjust path as needed for your API
const companiesEndpoint = {
  method: "GET" as const,
  path: ({ query }: { query: string }) =>
    `/odata/Companies${query ? (query.startsWith("?") ? query : `?${query}`) : ""}`,
  type: "OPEN" as const,
};

export async function fetchCompaniesAction(
  params: FetchCompaniesParams = { top: 15, skip: 0 }
): Promise<ApiResponse<{ rows: CompanyRow[]; total: number }>> {
  try {
    console.log("🔧 Making API call to OData function");
    
    const query = buildQuery(params);
    const response = await apiHandler(endpoints.getCompanies, { query });
    
    console.log("API Response:", response);

    if (response.error || response.status !== 200) {
      console.error("API Error Response:", {
        status: response.status,
        error: response.error,
        message: response.message,
        errorMessage: response.errorMessage
      });
      
      return {
        status: response.status,
        error: true,
        message: response.message || `Failed to fetch companies`,
        errorMessage: response.errorMessage,
      };
    }

    console.log("Raw API response data:", response.data);
    
    // Handle OData response structure
    let allItems: ApiCompanyItem[] = [];
    let total = 0;
    
    if (Array.isArray(response.data)) {
      allItems = response.data;
      total = allItems.length;
      console.log("✅ Direct array response with", allItems.length, "total items");
    } else if (response.data && response.data.value && Array.isArray(response.data.value)) {
      allItems = response.data.value;
      total = response.data["@odata.count"] || allItems.length;
      console.log("✅ OData response with", allItems.length, "items, total:", total);
    } else {
      console.log("❌ Unexpected response format");
      return {
        status: 200,
        message: "No companies found",
        data: { rows: [], total: 0 }
      };
    }
    
    const mappedRows = mapToRows(allItems);
    return {
      status: 200,
      message: `Successfully fetched ${mappedRows.length} companies`,
      data: { rows: mappedRows, total }
    };
  } catch (error: any) {
    console.error("Error Fetching Companies:", error);
    return {
      status: 500,
      error: true,
      message: "Failed to fetch companies from API",
      errorMessage: error?.message,
    };
  }
}

export async function deleteCompanyAction(company: any): Promise<ApiResponse<null>> {
    try {
        const res = await apiHandler(endpoints.deleteCompany, { companyId: company.id } as any);
        console.log("Delete company with id:", company.id);
      return res;
    return { 
      status: 200, 
      message: "Company deletion not implemented yet. Please add endpoint to endpoints.ts" 
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