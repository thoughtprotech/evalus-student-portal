"use server";

import ActionResponse from "@/types/ActionResponse";
import { cookies } from "next/headers";
import TestList from "@/mock/testList.json";

export async function fetchStarredListAction(): Promise<ActionResponse> {
  const token = (await cookies()).get("token")?.value;

  //   TODO: Add filters
  try {
    // const { token, role, username, roleDetailsJson, isAuthorized, message } =
    //   await apiHandler<LoginResponse>("/analyticsList", {
    //     method: "GET",
    //     routeType: "close",
    //   });

    return {
      status: "success",
      message: "Fetching Starred List Successful",
      data: TestList,
    };
  } catch (error) {
    console.log("Error Fetching Starred List", error);
    return { status: "failure", message: "Error Fetching Starred List" };
  }

  console.log({ token });
}
