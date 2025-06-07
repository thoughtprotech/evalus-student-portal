"use server";

import ActionResponse from "@/types/ActionResponse";
import TestList from "@/mock/testList.json";

export async function fetchTestListAction(): Promise<ActionResponse> {
  //   TODO: Add filters
  try {
    // const { token, role, username, roleDetailsJson, isAuthorized, message } =
    //   await apiHandler<LoginResponse>("/analyticsList", {
    //     method: "GET",
    //     routeType: "close",
    //   });

    return {
      status: "success",
      message: "Fetching Test List Successful",
      data: TestList,
    };
  } catch (error) {
    console.log("Error Fetching Test List", error);
    return { status: "failure", message: "Error Fetching Test List" };
  }
}
