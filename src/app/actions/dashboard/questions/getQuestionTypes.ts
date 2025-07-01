"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetQuestionTypesResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function getQuestionTypesAction(): Promise<
  ApiResponse<GetQuestionTypesResponse[]>
> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getQuestionTypes,
      null
    );

    console.log({ status, error, data, errorMessage, message });

    if (status === 200) {
      return {
        status,
        error,
        data,
        message: message || "Question Types Fetched",
      };
    }
    return {
      status: 500,
      error,
      errorMessage: errorMessage || "Error Fetching Question Types",
    };
  } catch (error) {
    console.log("Error Fetching Question Types", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Question Types",
    };
  }
}
