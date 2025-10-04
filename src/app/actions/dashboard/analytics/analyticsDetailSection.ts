"use server";

import {
  ApiResponse,
  CandidateAnalyticsReportSectionResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";
import { apiHandler } from "@/utils/api/client";

export async function fetchAnalyticsDetailsSectionAction(
  testResponseId: number
): Promise<ApiResponse<CandidateAnalyticsReportSectionResponse[]>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getCandidateAnalyticsReportSection,
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
