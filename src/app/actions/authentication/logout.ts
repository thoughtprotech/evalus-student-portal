"use server";

import { cookies } from "next/headers";

export async function logout() {
  try {
    (await cookies()).delete("token");
    return { success: true };
  } catch (error) {
    console.log("Error Logging Out", error);
    return { success: false };
  }
}
