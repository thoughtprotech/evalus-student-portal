"use server";

import { apiHandler } from "@/utils/api/client";
import {
  AdminDashboardReportDataResponse,
  ApiResponse,
  GetAdminDashboardTestStatusSummaryResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchAdminDashboardTestStatusSummaryAction(
  testId?: number
): Promise<ApiResponse<GetAdminDashboardTestStatusSummaryResponse[]>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getAdminDashboardTestStatusSummary,
      testId ? { testId } : {}
    );

    console.log({ status, error, data, errorMessage, message });

    return {
      status: 200,
      error: false,
      data,
      message: "Admin Dashboard Test Status Data fetched successfully",
    };
  } catch (error) {
    console.log("Error Retrieving Admin Dashboard Test Status Data", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Admin Dashboard Test Status Data",
    };
  }
}
