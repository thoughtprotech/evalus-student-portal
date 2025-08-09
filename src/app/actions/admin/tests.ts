"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { ApiResponse, GetAdminTestList } from "@/utils/api/types";


export async function fetchTestsAction(): Promise<ApiResponse<GetAdminTestList[]>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.getAdminTestList,
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
