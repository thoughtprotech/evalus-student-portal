"use server";

import { apiHandler } from "@/utils/api/client";
import {
  ApiResponse,
  GetSidebarMenusResponse,
} from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";
import { getUserAction } from "../getUser";

export async function fetchSideBarMenuAction(): Promise<
  ApiResponse<GetSidebarMenusResponse[]>
> {
  try {
    const username = await getUserAction();

    if (username) {
      const { status, error, data, errorMessage, message } = await apiHandler(
        endpoints.getSidebarMenus,
        {
          username,
        }
      );

      console.log({ status, error, data, errorMessage, message });

      return {
        status: 200,
        error: false,
        data,
        message: "Sidebar Menu Retrieved",
      };
    }
    return {
      status: 500,
      error: true,
      message: "Something Went Wrong",
    };
  } catch (error) {
    console.log("Error Retrieving Sidebar Menu", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Sidebar Menu",
    };
  }
}
