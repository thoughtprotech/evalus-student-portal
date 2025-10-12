"use server";

import { apiHandler } from "@/utils/api/client";
import {
  ApiResponse,
  GetReportsAuditSummaryResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchAdminDashboardReportAuditSummaryAction(
  userTimeStamp?: string,
  module?: string
): Promise<ApiResponse<GetReportsAuditSummaryResponse[]>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getAdminReportsAuditSummary,
      { userTimeStamp, module }
    );

    console.log({ status, error, data, errorMessage, message });

    return {
      status: 200,
      error: false,
      data,
      message: "Admin Dashboard Report Audit Data fetched successfully",
    };
  } catch (error) {
    console.log("Error Retrieving Admin Dashboard Audit Data", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Admin Dashboard Audit Data",
    };
  }
}
