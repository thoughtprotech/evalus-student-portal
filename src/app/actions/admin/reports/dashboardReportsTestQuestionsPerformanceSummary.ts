"use server";

import { apiHandler } from "@/utils/api/client";
import {
  AdminDashboardTestPerformanceSummaryResponse,
  ApiResponse,
  GetReportsTestQuestionsPerformanceSummaryResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";
import test from "node:test";

export async function fetchAdminReportsTestsQuestionsPerformanceSummmaryAction(
    testid?: number
): Promise<
  ApiResponse<GetReportsTestQuestionsPerformanceSummaryResponse[]>
> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getAdminReportsTestQuestionsPerformanceSummary,
      testid ? { testid } : {}
    );

    console.log({ status, error, data, errorMessage, message });

    return {
      status: 200,
      error: false,
      data,
      message: "Admin Dashboard Test Performance Summary fetched successfully",
    };
  } catch (error) {
    console.log("Error Retrieving Admin Dashboard Test Performance Summary", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Admin Dashboard Test Performance Summary",
    };
  }
}
