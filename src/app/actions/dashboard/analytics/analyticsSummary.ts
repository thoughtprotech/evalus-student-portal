"use server";

import {
  ApiResponse,
  CandidateAnalyticsSummaryResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";
import { apiHandler } from "@/utils/api/client";

export async function fetchAnalyticsSummaryAction(
  username: string
): Promise<ApiResponse<CandidateAnalyticsSummaryResponse>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getCandidateAnalyticsSummary,
      { username }
    );

    if (status === 200) {
      return {
        status: 200,
        message: "Fetching Anaytics Summary Successful",
        data,
      };
    }
    return { status: 500, message: "Error Fetching Anaytics Summary" };
  } catch (error) {
    console.log("Error Fetching Anaytics Summary", error);
    return { status: 500, message: "Error Fetching Anaytics Summary" };
  }
}
