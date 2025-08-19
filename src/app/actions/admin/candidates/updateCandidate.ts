"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export interface CandidateUpdatePayload {
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  cellPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  isActive?: number; // 0|1
  companyId?: number;
  candidateGroupIds?: number[];
}

export async function fetchCandidateByIdAction(candidateId: number): Promise<ApiResponse<any>> {
  try {
    const res = await apiHandler(endpoints.getCandidateById, { candidateId } as any);
    return res;
  } catch (e: any) {
    return { status: 500, error: true, errorMessage: e?.message, message: "Failed to fetch candidate" };
  }
}

export async function updateCandidateAction(payload: CandidateUpdatePayload): Promise<ApiResponse<null>> {
  try {
    const apiPayload = { ...payload };
    const res = await apiHandler(endpoints.updateCandidate, apiPayload as any);
    if (!res.error) {
      return { status: res.status, message: res.message || "Candidate updated", error: false, data: null };
    }
    return { status: res.status, error: true, errorMessage: res.errorMessage || res.message };
  } catch (e: any) {
    return { status: 500, error: true, errorMessage: e?.message, message: "Failed to update candidate" };
  }
}
