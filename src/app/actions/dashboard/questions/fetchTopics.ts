"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetTopicsResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchTopicsAction(
  subjectId: number
): Promise<ApiResponse<GetTopicsResponse[]>> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getTopics,
      { subjectId }
      // { subjectId }
    );

    console.log({ status, error, data, errorMessage, message });

    if (status === 200) {
      return {
        status,
        error,
        data,
        message: message || "Topics Fetched",
      };
    }
    return {
      status: 500,
      error,
      errorMessage: errorMessage || "Error Fetching Topics",
    };
  } catch (error) {
    console.log("Error Fetching Topics", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Topics",
    };
  }
}
