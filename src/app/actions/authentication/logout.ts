"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { USERNAME_TOKEN_KEY } from "@/utils/constants";
import { ApiResponse } from "@/utils/api/types";

export async function logoutAction(): Promise<ApiResponse<null>> {
  try {
    // Read the token from the incoming request’s cookies
    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value;
    if (!token) {
      return { status: 500, message: "No token found" };
    }

    // Decode and validate
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === "string") {
      return { status: 500, message: "Invalid token payload" };
    }

    // Safely extract the username claim
    const Username = decoded[USERNAME_TOKEN_KEY];
    if (typeof Username !== "string") {
      return { status: 500, message: "Username claim missing" };
    }

    // Call logout endpoint
    const res = await apiHandler(endpoints.logoutUser, { Username });
    if (res.status === 200) {
      // Delete the cookie server-side
      (await cookieStore).delete("token");
      return { status: 200, message: "User Logged Out" };
    }

    return {
      status: 500,
      message: res.errorMessage ?? "Error Logging Out User",
    };
  } catch (error) {
    console.error("Error Logging Out", error);
    return { status: 500, message: "Error Logging Out User" };
  }
}
