"use server";

import { cookies } from "next/headers";
import AnnouncementList from "@/mock/announcementList.json";
import { ApiResponse } from "@/utils/api/types";

export async function fetchSpotlightAction(): Promise<
  ApiResponse<typeof AnnouncementList>
> {
  //   TODO: Add filters
  try {
    return {
      status: 200,
      message: "Fetching Spotlight List Successful",
      data: AnnouncementList,
    };
  } catch (error) {
    console.log("Error Fetching Spotlight List", error);
    return { status: 500, message: "Error Fetching Spotlight List" };
  }
}
