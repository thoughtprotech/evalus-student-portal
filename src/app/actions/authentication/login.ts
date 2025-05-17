"use server";

import ActionResponse from "@/types/ActionResponse";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function login(formData: FormData): Promise<ActionResponse> {
  const username = formData.get("username");
  const password = formData.get("password");

  if (!username || !password) {
    throw new Error("Email and password are required.");
  }

  try {
    const res = await apiHandler(endpoints.loginUser, {
      Username: username as string,
      Password: password as string,
    });

    if (res.status === 200) {
      const { data } = res;

      (await cookies()).set("token", data!.token, {
        httpOnly: true,
        secure: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });

      const decoded: any = jwt.decode(data?.token!);

      return {
        status: "success",
        message: res.message || "User Authenticated",
        data: {
          role: decoded.role,
        },
      };
    }
    return {
      status: "failure",
      message: res.errorMessage ?? "Error Authenticating User",
    };
  } catch (error) {
    console.log("Error Authenticating User", error);
    return { status: "failure", message: "Error Authenticating User" };
  }
}
