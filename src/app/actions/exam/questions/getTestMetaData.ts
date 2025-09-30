"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetTestMetaDataResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchTestMetaDataAction(
  testId: number,
  testResponseId: number,
  userName: string
): Promise<ApiResponse<GetTestMetaDataResponse>> {
  try {
    const { data } = await apiHandler(endpoints.getTestMetaData, {
      testId,
      testResponseId,
      userName,
    });

    return {
      status: 200,
      error: false,
      data,
      message: "Questions Meta Retrieved",
    };
  } catch (error) {
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Test Meta Data",
    };
  }
}
