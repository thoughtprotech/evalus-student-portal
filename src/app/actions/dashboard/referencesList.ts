"use server";

import { cookies } from "next/headers";
import ReferenceList from "@/mock/referencesList.json";
import { ApiResponse } from "@/utils/api/types";

export async function fetchReferencesListAction(): Promise<ApiResponse<any>> {
  //   TODO: Add filters
  try {
    return {
      status: 200,
      message: "Fetching References List Successful",
      data: ReferenceList,
    };
  } catch (error) {
    console.log("Error Fetching References List", error);
    return { status: 500, message: "Error Fetching References List" };
  }
}
