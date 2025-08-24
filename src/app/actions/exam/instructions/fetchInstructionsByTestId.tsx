"use server";

import { apiHandler } from "@/utils/api/client";
import {
  ApiResponse,
  GetInstructionsByTestIdResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchInstructionsByTestIdAction(
  testId: number
): Promise<ApiResponse<GetInstructionsByTestIdResponse[]>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getInstructionsByTestId,
      {
        testId,
      }
    );

    console.log({ status, error, data, errorMessage, message });

    return {
      status: 200,
      error: false,
      data,
      message: "Instructions Retrieved By ID",
    };
  } catch (error) {
    console.log("Error Retrieving Instructions By ID", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Instructions By ID",
    };
  }
}
