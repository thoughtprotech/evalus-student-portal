"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetCandidateStarredTestResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";
import { getUserAction } from "../../getUser";

export async function fetchCandidateStarredTestList(): Promise<
  ApiResponse<GetCandidateStarredTestResponse[]>
> {
  //   TODO: Add filters
  try {
    const username = await getUserAction();

    if (username) {
      const { status, error, data, errorMessage, message } = await apiHandler(
        endpoints.getCandidateStarredTests,
        {
          username,
        }
      );

      console.log({ status, error, data, errorMessage, message });

      return {
        status: 200,
        error: false,
        data,
        message: "Candidate Starred Test List Retrieved",
      };
    }
    return {
      status: 500,
      error: true,
      message: "Something Went Wrong",
    };
  } catch (error) {
    console.log("Error Retrieving Candidate Starred Test List", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Candidate Starred Test List",
    };
  }
}
