"use server";

import { apiHandler } from "@/utils/api/client";
import {
  AdminDashboardReportDataResponse,
  ApiResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchAdminDashboardReportDataAction(): Promise<
  ApiResponse<AdminDashboardReportDataResponse>
> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getAdminDashboardReportData,
      {}
    );

    console.log({ status, error, data, errorMessage, message });

    return {
      status: 200,
      error: false,
      data,
      message: "Admin Dashboard Report Data fetched successfully",
    };
  } catch (error) {
    console.log("Error Retrieving Admin Dashboard Data", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Admin Dashboard Data",
    };
  }
}
