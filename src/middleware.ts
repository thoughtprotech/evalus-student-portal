import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TODO: Implement JWT
export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/exam");
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/", 
    "/dashboard/:path*", 
    "/exam/:path*",
  ],
};
