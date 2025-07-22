"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetInstructionsResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchInstructionsAction(
  language: string
): Promise<ApiResponse<GetInstructionsResponse[]>> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getInstructions,
      { language }
    );


    if (status === 200) {
      return {
        status,
        error,
        data,
        message: message || "Instructions Fetched",
      };
    }
    return {
      status: 500,
      error,
      errorMessage: errorMessage || "Error Fetching Instructions",
    };
  } catch (error) {
    console.log("Error Fetching Instructions", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Instructions",
    };
  }
}
