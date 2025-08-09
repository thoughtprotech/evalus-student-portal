"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { ApiResponse, GetAdminQuestionListResponse } from "@/utils/api/types";

export async function fetchQuestionsAction(): Promise<
  ApiResponse<GetAdminQuestionListResponse[]>
> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getAdminQuestionList,
      null
    );

    return {
      status: 200,
      message: "Fetching Question List Successful",
      data,
    };
  } catch (error) {
    console.log("Error Fetching Question List", error);
    return { status: 500, message: "Error Fetching Question List" };
  }
}
