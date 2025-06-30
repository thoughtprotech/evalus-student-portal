"use server";

import { cookies } from "next/headers";
import Analytics from "@/mock/mockTestDetails.json";
import { ApiResponse } from "@/utils/api/types";

export type TestId = keyof typeof Analytics;

export async function fetchAnalyticsAction(
  testId: TestId
): Promise<ApiResponse<any>> {
  //   TODO: Add filters
  try {
    return {
      status: 200,
      message: "Fetching Anaytics List Successful",
      data: Analytics[testId],
    };
  } catch (error) {
    console.log("Error Fetching Anaytics", error);
    return { status: 500, message: "Error Fetching Anaytics" };
  }
}
