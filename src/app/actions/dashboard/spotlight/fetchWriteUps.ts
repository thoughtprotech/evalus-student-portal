"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetWriteUpsResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchWriteUpsAction(): Promise<
  ApiResponse<GetWriteUpsResponse[]>
> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getWriteUps,
      null
    );

    console.log({ status, error, data, errorMessage, message });

    if (status === 200) {
      return {
        status,
        error,
        data,
        message: message || "WriteUps Fetched",
      };
    }
    return {
      status: 500,
      error,
      errorMessage: errorMessage || "Error Fetching WriteUps",
    };
  } catch (error) {
    console.log("Error Fetching WriteUps", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching WriteUps",
    };
  }
}
