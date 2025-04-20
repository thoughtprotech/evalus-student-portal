// app/actions/login.ts
"use server";

import ActionResponse from "@/types/ActionResponse";
import { apiHandler } from "@/utils/api";
import { cookies } from "next/headers";

type LoginResponse = {
  token: string;
  role: string;
  username: string;
  roleDetailsJson: string;
  isAuthorized: boolean;
  message: string;
};

export async function login(formData: FormData): Promise<ActionResponse> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  try {
    // const { token, role, username, roleDetailsJson, isAuthorized, message } =
    //   await apiHandler<LoginResponse>("/auth/login", {
    //     method: "POST",
    //     body: { email, password },
    //     routeType: "open",
    //   });

    console.log({ email, password });

    const token = "token";

    // ✅ Set token as cookie on the server
    (await cookies()).set("token", token, {
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });

    return { status: "success", message: "User Authenticated" };
  } catch (error) {
    console.log("Error Authenticating User", error);
    return { status: "failure", message: "Error Authenticating User" };
  }
}
