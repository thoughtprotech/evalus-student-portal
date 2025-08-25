"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetSessionQuestionByIdResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchSessionQuestionByIdAction(
  questionId: number,
  testResponseId: number
): Promise<ApiResponse<GetSessionQuestionByIdResponse>> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getSessionQuestionById,
      {
        questionId,
        testResponseId,
      }
    );

    console.log({ status, error, data, errorMessage, message });

    return {
      status: 200,
      error: false,
      data,
      message: "Session Question Retrieved By ID",
    };
  } catch (error) {
    console.log("Error Retrieving Session Question By ID", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Session Question By ID",
    };
  }
}
