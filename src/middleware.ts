import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

interface JwtPayload {
  role?: string;
  [key: string]: any;
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // 1. Redirect authenticated users off the public home page
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const isUserRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/exam") ||
    pathname.startsWith("/admin");

  // 2. Block unauthenticated access to any protected route
  if (!token && isUserRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3. If this is an /admin route, verify token & check role
  if (token && pathname.startsWith("/admin")) {
    let payload: JwtPayload;
    try {
      payload = jwt.decode(token) as JwtPayload;
    } catch (err) {
      // invalid or expired token
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    console.log({ payload });

    // if (payload.role !== "ADMIN") {
    //   // authenticated but not an admin
    //   return NextResponse.redirect(new URL("/dashboard", req.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/exam/:path*",
    "/admin/:path*", // protect admin routes
  ],
};
