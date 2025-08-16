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

function mapToRows(items: ApiCandidateItem[]): CandidateRow[] {
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
    
    const mapped = {
      candidateId: item.candidateRegistrationId || 0,
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
      candidateGroup: item.candidateGroupName || "Default",
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
    console.log("🔧 Making API call to get candidates");
    
    const query = buildQuery(params);
    const response = await apiHandler(endpoints.getCandidates, { query });
    
    console.log("Candidates API Response:", response);

    if (response.error || response.status !== 200) {
      console.error("Candidates API Error Response:", {
        status: response.status,
        error: response.error,
        message: response.message,
        errorMessage: response.errorMessage
      });
      
      return {
        status: response.status,
        error: true,
        message: response.message || `Failed to fetch candidates`,
        errorMessage: response.errorMessage,
      };
    }

    console.log("Raw candidates API response data:", response.data);
    
    // Handle OData response structure
    let allItems: ApiCandidateItem[] = [];
    let total = 0;
    
    if (Array.isArray(response.data)) {
      allItems = response.data;
      total = allItems.length;
      console.log("✅ Direct array response with", allItems.length, "total candidates");
    } else if (response.data && response.data.value && Array.isArray(response.data.value)) {
      allItems = response.data.value;
      total = response.data["@odata.count"] || allItems.length;
      console.log("✅ OData response with", allItems.length, "candidates, total:", total);
    } else {
      console.log("❌ Unexpected response format for candidates");
      return {
        status: 200,
        message: "No candidates found",
        data: { rows: [], total: 0 }
      };
    }
    
    const mappedRows = mapToRows(allItems);
    return {
      status: 200,
      message: `Successfully fetched ${mappedRows.length} candidates`,
      data: { rows: mappedRows, total }
    };
  } catch (error: any) {
    console.error("Error Fetching Candidates:", error);
    return {
      status: 500,
      error: true,
      message: "Failed to fetch candidates from API",
      errorMessage: error?.message,
    };
  }
}

export async function deleteCandidateAction(candidate: any): Promise<ApiResponse<null>> {
  try {

      const res = await apiHandler(endpoints.deleteCandidate, { candidateId: candidate.id } as any);
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