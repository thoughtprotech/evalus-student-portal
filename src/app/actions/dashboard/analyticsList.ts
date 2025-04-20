"use server";

import ActionResponse from "@/types/ActionResponse";
import { cookies } from "next/headers";
import AnalyticsList from "@/mock/mockTests.json";

export async function fetchAnalyticsListAction(): Promise<ActionResponse> {

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
      data: AnalyticsList,
    };
  } catch (error) {
    console.log("Error Fetching Anaytics List", error);
    return { status: "failure", message: "Error Fetching Anaytics List" };
  }
}
