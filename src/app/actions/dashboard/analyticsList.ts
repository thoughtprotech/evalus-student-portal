"use server";

import { cookies } from "next/headers";
import AnalyticsList from "@/mock/mockTests.json";
import { ApiResponse } from "@/utils/api/types";

export async function fetchAnalyticsListAction(): Promise<
  ApiResponse<typeof AnalyticsList>
> {
  //   TODO: Add filters
  try {
    return {
      status: 200,
      message: "Fetching Anaytics List Successful",
      data: AnalyticsList,
    };
  } catch (error) {
    console.log("Error Fetching Anaytics List", error);
    return { status: 500, message: "Error Fetching Anaytics List" };
  }
}
