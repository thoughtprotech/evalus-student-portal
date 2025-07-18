"use server";

import { apiHandler } from "@/utils/api/client";
import {
  ApiResponse,
  QuestionsMetaResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchQuestionsMetaAction(
  testid: number
): Promise<ApiResponse<QuestionsMetaResponse[]>> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getQuestionsMeta,
      {
        testid,
      }
    );

    console.log({ status, error, data, errorMessage, message });

    return {
      status: 200,
      error: false,
      data,
      message: "Questions Meta Retrieved",
    };
  } catch (error) {
    console.log("Error Fetching Questions Meta", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Test List",
    };
  }
}
