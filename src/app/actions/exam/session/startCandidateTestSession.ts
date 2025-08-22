"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, StartSessionResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function startCandidateTestSessionAction(
  testRegistrationId: number
): Promise<ApiResponse<StartSessionResponse>> {
  try {
    const { data } = await apiHandler(endpoints.startTestSession, {
      testRegistrationId,
    });

    return {
      status: 200,
      error: false,
      data,
      message: "Candidate Session Started",
    };
  } catch (error) {
    return {
      status: 500,
      error: true,
      errorMessage: "Error Starting Candidate Session",
    };
  }
}
