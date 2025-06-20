"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetQuestionListResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchQuestionListAction(
  testid: number
): Promise<ApiResponse<GetQuestionListResponse>> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getQuestions,
      {
        testid,
      }
    );

    console.log({ status, error, data, errorMessage, message });

    return {
      status: 200,
      error: false,
      data,
      message: "Question Retrieved",
    };
  } catch (error) {
    console.log("Error Fetching Test List", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Test List",
    };
  }
}
