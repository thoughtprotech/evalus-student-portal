"use server";

import TestList from "@/mock/testList.json";
import { ApiResponse } from "@/utils/api/types";

export async function fetchTestListAction(): Promise<ApiResponse<any>> {
  //   TODO: Add filters
  try {
    return {
      status: 200,
      message: "Fetching Test List Successful",
      data: TestList,
    };
  } catch (error) {
    console.log("Error Fetching Test List", error);
    return { status: 500, message: "Error Fetching Test List" };
  }
}
