"use server";

import ActionResponse from "@/types/ActionResponse";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { USERNAME_TOKEN_KEY } from "@/utils/constants";

export async function logout(): Promise<ActionResponse> {
  try {
    // Read the token from the incoming request’s cookies
    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value;
    if (!token) {
      return { status: "failure", message: "No token found" };
    }

    // Decode and validate
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === "string") {
      return { status: "failure", message: "Invalid token payload" };
    }

    // Safely extract the username claim
    const Username = decoded[USERNAME_TOKEN_KEY];
    if (typeof Username !== "string") {
      return { status: "failure", message: "Username claim missing" };
    }

    // Call logout endpoint
    const res = await apiHandler(endpoints.logoutUser, { Username });
    if (res.status === 200) {
      // Delete the cookie server-side
      (await cookieStore).delete("token");
      return { status: "success", message: "User Logged Out" };
    }

    return {
      status: "failure",
      message: res.errorMessage ?? "Error Logging Out User",
    };
  } catch (error) {
    console.error("Error Logging Out", error);
    return { status: "failure", message: "Error Logging Out User" };
  }
}
