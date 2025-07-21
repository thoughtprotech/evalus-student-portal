"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetSpotlightResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchSpotlightListAction(): Promise<
  ApiResponse<GetSpotlightResponse[]>
> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getSpotLight,
      null
    );

    console.log({ status, error, data, errorMessage, message });

    if (status === 200) {
      return {
        status: 200,
        error: false,
        data,
        message: "Spotlight List Retrieved",
      };
    } else {
      return {
        status: 500,
        error: true,
        errorMessage: "Error Retrieving Spotlight List",
      };
    }
  } catch (error) {
    console.log("Error Retrieving Spotlight List", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Spotlight List",
    };
  }
}
