"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetSubjectsResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchSubjectsAction(): Promise<
  ApiResponse<GetSubjectsResponse[]>
> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getSubjects,
      null
    );

    console.log({ status, error, data, errorMessage, message });

    if (status === 200) {
      return {
        status,
        error,
        data,
        message: message || "Subjects Fetched",
      };
    }
    return {
      status: 500,
      error,
      errorMessage: errorMessage || "Error Fetching Subjects",
    };
  } catch (error) {
    console.log("Error Fetching Subjects", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Subjects",
    };
  }
}
