"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, SubmitQuestionResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function submitQuestionAction(
  testResponseId: number,
  testQuestionId: number,
  responseJson: string,
  status: string,
  comments: string,
  userName: string
): Promise<ApiResponse<SubmitQuestionResponse>> {
  try {
    const req = {
      pathParams: { testResponseId, testQuestionId },
      body: { responseJson, status, comments, userName },
    };

    const res = await apiHandler(endpoints.submitQuestion, {
      testResponseId,
      answer: {
        testResponseId,
        testQuestionId,
        comments,
        responseJson,
        status,
        userName,
      },
      userName,
    });
    return {
      status: res.status,
      error: res.error,
      data: res.data,
      message: res.message,
      errorMessage: res.errorMessage,
    };
  } catch (error) {
    return {
      status: 500,
      error: true,
      errorMessage: "Error Starting Candidate Session",
    };
  }
}
