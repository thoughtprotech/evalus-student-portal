"use server";

import { cookies } from "next/headers";
import TestList from "@/mock/testList.json";
import { ApiResponse } from "@/utils/api/types";

export async function fetchStarredListAction(): Promise<ApiResponse<any>> {
  //   TODO: Add filters
  try {
    return {
      status: 200,
      message: "Fetching Starred List Successful",
      data: TestList,
    };
  } catch (error) {
    console.log("Error Fetching Starred List", error);
    return { status: 500, message: "Error Fetching Starred List" };
  }
}
