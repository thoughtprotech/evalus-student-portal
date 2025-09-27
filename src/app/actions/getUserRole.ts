// app/actions/getUserRole.ts
"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getUserRoleAction(): Promise<string | null> {
    try {
        const token = (await cookies()).get("token")?.value;
        if (!token) return null;
        const decoded = jwt.decode(token) as any;
        return decoded?.role ?? null;
    } catch {
        return null;
    }
}