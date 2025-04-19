// app/actions/login.ts
"use server";

import { cookies } from "next/headers";

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  try {
    //   // Call your backend API
    //   const res = await fetch("https://api.example.com/auth", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ email, password }),
    //   });

    //   if (!res.ok) {
    //     throw new Error("Authentication failed.");
    //   }

    //   const { token } = await res.json();

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

    return { success: true };
  } catch (error) {
    console.log("Error Authenticating User", error);
    return { success: false };
  }
}
