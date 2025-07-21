"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetLanguagesResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchLanguagesAction(): Promise<
  ApiResponse<GetLanguagesResponse[]>
> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getLanguages,
      null
    );

    console.log({ status, error, data, errorMessage, message });

    if (status === 200) {
      return {
        status,
        error,
        data,
        message: message || "Languages Fetched",
      };
    }
    return {
      status: 500,
      error,
      errorMessage: errorMessage || "Error Fetching Languages",
    };
  } catch (error) {
    console.log("Error Fetching Languages", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Languages",
    };
  }
}
