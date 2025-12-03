import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface JwtPayload {
  role?: string;
  [key: string]: any;
}

// Read Browser Exam Key from your environment
const BEK = process.env.SEB_BROWSER_EXAM_KEY || "";


// Convert ArrayBuffer → hex string
const abToHex = (buffer: ArrayBuffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Compute SEB hash using Web Crypto API
async function computeSEBHash(url: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(BEK + url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return abToHex(hashBuffer);
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // --- SEB PROTECTION -----------------------------------------------------
  if (pathname.startsWith("/exam")) {
    const receivedHash = req.headers.get("x-safeexambrowser-requesthash");

    if (!receivedHash) {
      return NextResponse.redirect(new URL("/use-safe-exam-browser", req.url));
    }

    const expectedHash = await computeSEBHash(req.nextUrl.toString());

    if (receivedHash.toLowerCase() !== expectedHash.toLowerCase()) {
      return NextResponse.redirect(new URL("/use-safe-exam-browser", req.url));
    }
  }

  // Helper function to decode JWT payload (Edge-compatible)
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

  // 1. Redirect authenticated users off the public home page based on their role
  if (pathname === "/" && token) {
    const payload = decodeJwtPayload(token);
    if (payload && payload.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
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

  // 3. Role-based route protection
  if (token && isUserRoute) {
    const payload = decodeJwtPayload(token);
    if (payload) {
      // If admin user tries to access dashboard root (not sub-routes), redirect to admin
      if (payload.role === "ADMIN" && pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }

      // Allow admin users to access exam routes (for system check, taking tests, etc.)
      // Admins should be able to take exams just like regular users

      // If regular user tries to access admin routes, redirect to dashboard
      if (payload.role !== "ADMIN" && pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } else {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL("/", req.url));
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
