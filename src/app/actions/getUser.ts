// app/actions/getUsername.ts
"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getUserAction(): Promise<string | null> {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) return null;
    const decoded = jwt.decode(token) as any;
    return decoded?.userName ?? null;
  } catch {
    return null;
  }
}
