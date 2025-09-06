"use server";

import { cookies } from "next/headers";
import Analytics from "@/mock/mockTestDetails.json";
import { AdminDashboardAnallyticsResponse, ApiResponse } from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

export type TestId = keyof typeof Analytics;

export async function fetchAdminAnalyticsAction(
): Promise<ApiResponse<AdminDashboardAnallyticsResponse>> {
  //   TODO: Add filters
  try {
    const { data, status, error, errorMessage, message } = await apiHandler(
      endpoints.getAdminDashboardAnalytics,
      null
    );

    return {
      status: 200,
      message: "Fetching Admin Dashboard Anaytics Successful",
      data,
    };
  } catch (error) {
    console.log("Error Fetching Admin Dashboard Anaytics", error);
    return { status: 500, message: "Error Fetching Admin Dashboard Anaytics" };
  }
}
