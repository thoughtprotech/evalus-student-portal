"use server";

import { apiHandler } from "@/utils/api/client";
import {
  AdminDashboardTestPerformanceSummaryResponse,
  ApiResponse,
  GetAdminDashboardTestCandidatePerformanceSummaryResponse,
  GetReportsTestQuestionsPerformanceSummaryResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchAdminDashboardTestCandidatePerformanceSummaryAction(
  search?: string,
  candidateGroupId?: number
): Promise<
  ApiResponse<GetAdminDashboardTestCandidatePerformanceSummaryResponse[]>
> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getAdminDashboardTestCandidatePerformanceSummary,
      search || candidateGroupId
        ? { search: search || "", candidateGroupId: candidateGroupId || 0 }
        : {}
    );

    console.log({ status, error, data, errorMessage, message });

    return {
      status: 200,
      error: false,
      data,
      message:
        "Admin Dashboard Candidate Test Performance Summary fetched successfully",
    };
  } catch (error) {
    console.log(
      "Error Retrieving Admin Dashboard Candidate Test Performance Summary",
      error
    );
    return {
      status: 500,
      error: true,
      errorMessage:
        "Error Retrieving Admin Dashboard Candidate Test Performance Summary",
    };
  }
}
