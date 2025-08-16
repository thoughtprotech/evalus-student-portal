"use server";

import { ApiResponse } from "@/utils/api/types";

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

// Legacy interface for backward compatibility
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
    appliedAt: new Date(Date.now() - i * 43200000).toISOString(), // 12 hr diff
  }));
};

export async function fetchCandidatesAction(): Promise<
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

// New function for the AG Grid implementation
export async function fetchCandidatesGridAction(params?: {
  top?: number;
  skip?: number;
  orderBy?: string;
  filter?: string;
}): Promise<ApiResponse<{ rows: CandidateRow[]; total: number }>> {
  try {
    // This would typically make an API call to your backend
    // For now, we'll return a success status to indicate the function exists
    // The actual grid implementation handles mock data generation internally
    
    return {
      status: 200,
      message: "Fetching Candidates Successful",
      data: { rows: [], total: 0 }
    };
  } catch (error) {
    console.log("Error Fetching Candidates", error);
    return { status: 500, message: "Error Fetching Candidates" };
  }
}

export async function deleteCandidateAction(candidate: CandidateRow): Promise<ApiResponse<null>> {
  try {
    // This would typically make an API call to delete the candidate
    // For now, we'll simulate a successful delete
    console.log("Deleting candidate:", candidate.candidateId);
    
    return {
      status: 200,
      message: "Candidate deleted successfully"
    };
  } catch (error) {
    console.log("Error Deleting Candidate", error);
    return { status: 500, message: "Error Deleting Candidate" };
  }
}