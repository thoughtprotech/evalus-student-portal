"use server";

import ActionResponse from "@/types/ActionResponse";
import { cookies } from "next/headers";
import AnnouncementList from "@/mock/announcementList.json";

export async function fetchSpotlightAction(): Promise<ActionResponse> {
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
      message: "Fetching Spotlight List Successful",
      data: AnnouncementList,
    };
  } catch (error) {
    console.log("Error Fetching Spotlight List", error);
    return { status: "failure", message: "Error Fetching Spotlight List" };
  }

  console.log({ token });
}
