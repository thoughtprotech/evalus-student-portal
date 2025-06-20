"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetQuestionByIdResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchQuestionByIdAction(
  questionId: number
): Promise<ApiResponse<GetQuestionByIdResponse>> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getQuestionById,
      {
        questionId,
      }
    );

    console.log({ status, error, data, errorMessage, message });

    return {
      status: 200,
      error: false,
      data,
      message: "Question Retrieved By ID",
    };
  } catch (error) {
    console.log("Error Retrieving Question By ID", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Question By ID",
    };
  }
}
