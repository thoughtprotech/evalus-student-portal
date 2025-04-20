"use server";

import ActionResponse from "@/types/ActionResponse";
import { cookies } from "next/headers";
import Analytics from "@/mock/mockTestDetails.json";

export type TestId = keyof typeof Analytics;

export async function fetchAnalyticsAction(
  testId: TestId
): Promise<ActionResponse> {
  //   TODO: Add filters
  try {
    // const { token, role, username, roleDetailsJson, isAuthorized, message } =
    //   await apiHandler<LoginResponse>("/analyticsList", {
    //     method: "GET",
    //     routeType: "close",
    //   });

    return {
      status: "success",
      message: "Fetching Anaytics List Successful",
      data: Analytics[testId],
    };
  } catch (error) {
    console.log("Error Fetching Anaytics", error);
    return { status: "failure", message: "Error Fetching Anaytics" };
  }
}
