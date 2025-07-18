"use server";

import DashboardMock from "@/mock/dashboardLanding.json";
import { ApiResponse } from "@/utils/api/types";

export type TestId = keyof typeof DashboardMock;

export async function fetchDashboardAnalyticsAction(): Promise<
  ApiResponse<any>
> {
  //   TODO: Add filters
  try {
    return {
      status: 200,
      message: "Fetching Dashboard Analytics List Successful",
      data: DashboardMock,
    };
  } catch (error) {
    console.log("Error Fetching Dashboard Analytics", error);
    return { status: 500, message: "Error Fetching Analytics" };
  }
}
