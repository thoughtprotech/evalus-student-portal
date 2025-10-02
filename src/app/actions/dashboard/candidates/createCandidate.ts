"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

/**
 * Creates a new candidate with the provided payload.
 * The payload should include all fields from the candidate form.
 */
export async function createCandidateAction(
  payload: {
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
    candidateGroup?: string; // legacy single group name (deprecated)
    notes?: string;
    companyId?: number;
    candidateGroupIds?: number[]; // new multi group association
    isActive?: number; // 0|1
    isHandicapped?: number; // 0|1 for specially abled status
    createdBy?: string;
    createdDate?: string;
    modifiedBy?: string;
    modifiedDate?: string;
    userLogin?: any[]; // <-- Added here
  }
): Promise<ApiResponse<null>> {
  try {
    // Normalize payload to backend expected schema
    const apiPayload: any = {
      candidateId: 0, // new creation
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      cellPhone: payload.cellPhone || "",
      address: payload.address || "",
      city: payload.city || "",
      state: payload.state || "",
      postalCode: payload.postalCode || "",
      country: payload.country || "",
      notes: payload.notes || "",
      isActive: typeof payload.isActive === 'number' ? payload.isActive : 1,
      isHandicapped: typeof payload.isHandicapped === 'number' ? payload.isHandicapped : 0,
      createdBy: payload.createdBy || 'system',
      createdDate: payload.createdDate || new Date().toISOString(),
      modifiedBy: payload.modifiedBy || 'system',
      modifiedDate: payload.modifiedDate || new Date().toISOString(),
      companyId: typeof payload.companyId === 'number' ? payload.companyId : 0,
      candidateGroupIds: Array.isArray(payload.candidateGroupIds) && payload.candidateGroupIds.length > 0
        ? payload.candidateGroupIds
        : (payload.candidateGroup ? [0] : []), // fallback; replace logic if mapping candidateGroup name to id,
      userLogin: payload.userLogin
    };

    // Provide audit fields in both common casings for backend compatibility
    const auditUser = apiPayload.modifiedBy || apiPayload.createdBy || 'system';
    apiPayload.userName = auditUser;
    apiPayload.UserName = auditUser;
    apiPayload.CreatedBy = apiPayload.createdBy;
    apiPayload.ModifiedBy = apiPayload.modifiedBy;
    apiPayload.CreatedDate = apiPayload.createdDate;
    apiPayload.ModifiedDate = apiPayload.modifiedDate;

    // Some backends expect PascalCase CandidateGroupIds as well
    if (Array.isArray(apiPayload.candidateGroupIds)) {
      apiPayload.CandidateGroupIds = apiPayload.candidateGroupIds;
    }

    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.createCandidate,
      apiPayload
    );

    console.log("CREATING CANDIDATE", {
      status,
      error,
      data,
      errorMessage,
      message,
    });

    const isSuccess =
      (status >= 200 && status < 300) ||
      status === 201 ||
      status === 200 ||
      (!error && status !== 0);

    if (isSuccess) {
      return {
        status,
        error: false,
        data,
        message: message || "Candidate Created Successfully",
      };
    }

    if (data && typeof data === "object") {
      const errorData = data as any;
      if ("errors" in errorData) {
        console.error("Validation errors:", errorData.errors);
      }
    }

    return {
      status: status || 500,
      error: true,
      errorMessage: errorMessage || message || "Error Creating Candidate",
    };
  } catch (error) {
    console.log("Error Creating Candidate", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Creating Candidate",
    };
  }
}