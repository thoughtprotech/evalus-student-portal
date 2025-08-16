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
    candidateGroup?: string;
    notes?: string;
  }
): Promise<ApiResponse<null>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.createCandidate,
      payload
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