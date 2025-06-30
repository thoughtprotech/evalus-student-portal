"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function createQuestionAction(
  testId: number,
  questionType: string,
  questionText: string,
  options?: string,
  correctAnswer?: string
): Promise<ApiResponse<null>> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.createQuestion,
      {
        testId,
        questionType,
        questionText,
        options,
        correctAnswer,
      }
    );

    // console.log({ status, error, data, errorMessage, message });

    if (status === 200) {
      return {
        status,
        error,
        data,
        message: message || "Question Created",
      };
    }
    return {
      status: 500,
      error,
      errorMessage: errorMessage || "Error Creating Question",
    };
  } catch (error) {
    console.log("Error Creating Question", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Creating Question",
    };
  }
}
