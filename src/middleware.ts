import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
    // Lightweight, Edge-compatible JWT payload decode (no signature verification)
    const decodeJwtPayload = (tok: string): JwtPayload | null => {
      try {
        const parts = tok.split(".");
        if (parts.length < 2) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "===".slice((base64.length + 3) % 4);
        const json = atob(padded);
        return JSON.parse(json);
      } catch {
        return null;
      }
    };

    const payload = decodeJwtPayload(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (payload.role !== "ADMIN") {
      // authenticated but not an admin
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
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
