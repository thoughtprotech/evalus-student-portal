"use server";

import ActionResponse from "@/types/ActionResponse";
import { cookies } from "next/headers";

export async function logout(): Promise<ActionResponse> {
  try {
    (await cookies()).delete("token");
    return { status: "success", message: "User Logged Out" };
  } catch (error) {
    console.log("Error Logging Out", error);
    return { status: "failure", message: "Error Logging Out User" };
  }
}
