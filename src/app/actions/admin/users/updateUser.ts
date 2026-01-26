"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

/**
 * Creates a new user with the provided payload.
 * Uses the same CandidateRegistration endpoint as candidates.
 */
export async function createUserAction(
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
    notes?: string;
    companyId?: number;
    isActive?: number;
    isHandicapped?: number;
    userName: string;
    password: string;
    displayName: string;
    role: string;
    userPhoto?: string | null;
    createdBy?: string;
    createdDate?: string;
    modifiedBy?: string;
    modifiedDate?: string;
  }
): Promise<ApiResponse<null>> {
  try {
    // Map user payload to candidate registration format
    const apiPayload: any = {
      candidateId: 0,
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
      companyId: payload.companyId || 0,
      candidateGroupIds: [],
      userLogin: [{
        userName: payload.userName,
        password: payload.password,
        displayName: payload.displayName,
        email: payload.email,
        role: payload.role,
        userPhoto: payload.userPhoto || null,
        isActive: typeof payload.isActive === 'number' ? payload.isActive : 1,
      }]
    };

    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.createCandidate,
      apiPayload
    );

    console.log("CREATING USER", {
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
        message: message || "User Created Successfully",
      };
    }

    return {
      status: status || 500,
      error: true,
      errorMessage: errorMessage || message || "Error Creating User",
    };
  } catch (error: any) {
    console.error("Error Creating User:", error);
    return {
      status: 500,
      error: true,
      errorMessage: error.message || "Error Creating User",
    };
  }
}

export async function fetchUserByIdAction(
  candidateId: number
): Promise<ApiResponse<any>> {
  try {
    // Use the same endpoint as candidates
    const res = await apiHandler(endpoints.getCandidateById, { candidateId } as any);
    return res;
  } catch (e: any) {
    return { 
      status: 500, 
      error: true, 
      errorMessage: e?.message, 
      message: "Failed to fetch user" 
    };
  }
}

export async function updateUserAction(payload: {
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
  companyId?: number;
  isActive?: number;
  isHandicapped?: number;
  userName: string;
  password?: string;
  displayName: string;
  role: string;
  userPhoto?: string | null;
  modifiedBy?: string;
}): Promise<ApiResponse<null>> {
  try {
    // Map user payload to candidate registration format
    const apiPayload: any = {
      candidateId: payload.candidateId,
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
      modifiedBy: payload.modifiedBy || 'system',
      modifiedDate: new Date().toISOString(),
      companyId: payload.companyId || 0,
      candidateGroupIds: [],
      userLogin: [{
        userName: payload.userName,
        displayName: payload.displayName,
        email: payload.email,
        role: payload.role,
        userPhoto: payload.userPhoto || null,
        isActive: typeof payload.isActive === 'number' ? payload.isActive : 1,
      }]
    };

    // Only include password if it's being updated
    if (payload.password && payload.password !== "****") {
      apiPayload.userLogin[0].password = payload.password;
    }

    // Use apiHandler to call the candidate API endpoint (same as candidate update)
    const res = await apiHandler(endpoints.updateCandidate, apiPayload as any);

    if (!res.error) {
      return { status: res.status, message: res.message || "User updated", error: false, data: null };
    }

    return { status: res.status || 500, error: true, errorMessage: res.errorMessage || res.message };
  } catch (error: any) {
    console.error("Error updating user:", error);
    return {
      status: 500,
      error: true,
      errorMessage: error.message || "Failed to update user",
    };
  }
}
