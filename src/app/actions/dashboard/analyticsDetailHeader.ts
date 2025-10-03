"use server";

import {
  ApiResponse,
  CandidateAnalyticsDetailsResponse,
  CandidateAnalyticsReportHeaderResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";
import { apiHandler } from "@/utils/api/client";

export async function fetchAnalyticsDetailsHeaderAction(
  testResponseId: number
): Promise<ApiResponse<CandidateAnalyticsReportHeaderResponse>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getCandidateAnalyticsReportHeader,
      { testResponseId }
    );

    if (status === 200) {
      return {
        status: 200,
        message: "Fetching Anaytics Details Header Successful",
        data,
      };
    }
    return { status: 500, message: "Error Fetching Anaytics Details Header" };
  } catch (error) {
    console.log("Error Fetching Anaytics Details", error);
    return { status: 500, message: "Error Fetching Anaytics Details Header" };
  }
}
