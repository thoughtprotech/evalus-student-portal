"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, CreateQuestionRequest } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export interface UpdateQuestionRequest extends Partial<CreateQuestionRequest> {
  questionId: number;
}

export async function updateQuestionAction(
  questionId: number,
  payload: Partial<CreateQuestionRequest>
): Promise<ApiResponse<null>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.updateQuestion,
      { questionId, ...payload }
    );

    const isSuccess = (status >= 200 && status < 300) && !error;

    if (isSuccess) {
      return {
        status,
        error: false,
        data: null,
        message: message || "Question Updated Successfully",
      };
    }

    return {
      status: status || 500,
      error: true,
      errorMessage: errorMessage || message || "Error Updating Question",
    };
  } catch (error) {
    console.log("Error Updating Question", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Updating Question",
    };
  }
}
