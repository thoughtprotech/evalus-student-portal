"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, SubmitTestResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function endCandidateSessionAction(
  testResponseId: number,
  userName: string
): Promise<ApiResponse<SubmitTestResponse>> {
  try {
    const { data } = await apiHandler(endpoints.submitTest, {
      testResponseId,
      userName,
    });

    return {
      status: 200,
      error: false,
      data,
      message: "Candidate Session Ended",
    };
  } catch (error) {
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Test Meta Data",
    };
  }
}
