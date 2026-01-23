"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetSpotlightResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchSpotlightListAction(candidateId?: number): Promise<
  ApiResponse<GetSpotlightResponse[]>
> {
  try {
    let result;
    
    // If candidateId is provided, use the filtered endpoint
    if (candidateId) {
      result = await apiHandler(endpoints.getSpotlightsByCandidateId, { candidateId });
    } else {
      result = await apiHandler(endpoints.getSpotLight, null);
    }
    
    const { status, error, data, errorMessage, message } = result;

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
