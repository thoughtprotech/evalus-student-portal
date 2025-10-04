"use server";

import {
  ApiResponse,
  CandidateAnalyticsDetailsResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";
import { apiHandler } from "@/utils/api/client";

export async function fetchAnalyticsDetailsAction(
  username: string
): Promise<ApiResponse<CandidateAnalyticsDetailsResponse[]>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getCandidateAnalyticsDetails,
      { username }
    );

    if (status === 200) {
      return {
        status: 200,
        message: "Fetching Anaytics Details Successful",
        data,
      };
    }
    return { status: 500, message: "Error Fetching Anaytics Details" };
  } catch (error) {
    console.log("Error Fetching Anaytics Details", error);
    return { status: 500, message: "Error Fetching Anaytics Details" };
  }
}
