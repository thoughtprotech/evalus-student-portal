import { NextRequest, NextResponse } from "next/server";
import { env } from "@/utils/env";

export async function GET(
  req: NextRequest,
  ctx: { params: { odataPath: string[] } | Promise<{ odataPath: string[] }> }
) {
  const params = await (ctx as any).params;
  const path = (params as any)?.odataPath?.join("/") ?? "";
  const url = new URL(req.url);
  // Preserve the original query string; if missing leading '?', add it
  const rawSearch = url.search || url.searchParams.toString();
  const search = rawSearch ? (rawSearch.startsWith("?") ? rawSearch : `?${rawSearch}`) : "";
  // Some backends are case-sensitive about the 'Odata' segment – match expected casing
  const target = `${env.API_BASE_URL}/Odata/${path}${search}`;

  try {
    const res = await fetch(target, {
      // Forward as server-to-server request; include cookies if needed
      method: "GET",
      headers: {
        // Forward only minimal headers; customize if auth is required
        "Content-Type": "application/json",
      },
      // No CORS issues on server-side fetch
      cache: "no-store",
    });

    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: true, message: "Upstream fetch failed", errorMessage: e?.message || "Network error" },
      { status: 502 }
    );
  }
}
