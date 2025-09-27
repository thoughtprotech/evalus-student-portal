import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const res = NextResponse.json({ message: "Logged out" });
    // Delete token cookie if present. Cookie name: 'token'
    res.cookies.set({ name: "token", value: "", maxAge: 0 });
    return res;
  } catch (error) {
    return NextResponse.json({ message: "Error logging out" }, { status: 500 });
  }
}
