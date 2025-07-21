"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetDifficultyLevelsResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchDifficultyLevelsAction(): Promise<
  ApiResponse<GetDifficultyLevelsResponse[]>
> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getDifficultyLevels,
      null
    );

    console.log({ status, error, data, errorMessage, message });

    if (status === 200) {
      return {
        status,
        error,
        data,
        message: message || "Difficulty Level Fetched",
      };
    }
    return {
      status: 500,
      error,
      errorMessage: errorMessage || "Error Fetching Difficulty Level",
    };
  } catch (error) {
    console.log("Error Fetching Difficulty Level", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Difficulty Level",
    };
  }
}
