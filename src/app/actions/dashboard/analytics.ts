"use server";

import {
  ApiResponse,
  CandidateAnalyticsDetailsResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";
import { apiHandler } from "@/utils/api/client";
import analytics from "../../../mock/mockTestDetails.json";

export async function fetchAnalyticsAction(
  id: "93" | "94" | "3" | "4" | "5"
): Promise<ApiResponse<any>> {
  try {
    // const { status, error, data, errorMessage, message } = await apiHandler(
    //   endpoints.getCandidateAnalyticsDetails,
    //   { username }
    // );

    // if (status === 200) {
    return {
      status: 200,
      message: "Fetching Anaytics Details Successful",
      data: analytics[id],
    };
    // }
    // return { status: 500, message: "Error Fetching Anaytics Details" };
  } catch (error) {
    console.log("Error Fetching Anaytics Details", error);
    return { status: 500, message: "Error Fetching Anaytics Details" };
  }
}
