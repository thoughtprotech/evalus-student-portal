"use server";

import { apiHandler } from "@/utils/api/client";
import {
  AdminDashboardTestPerformanceSummaryResponse,
  ApiResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchAdminDashboardTestPerformanceSummaryAction(
  testid?: number
): Promise<ApiResponse<AdminDashboardTestPerformanceSummaryResponse[]>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getAdminTestPerformanceSummaryRequest,
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
    console.log(
      "Error Retrieving Admin Dashboard Test Performance Summary",
      error
    );
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Admin Dashboard Test Performance Summary",
    };
  }
}
