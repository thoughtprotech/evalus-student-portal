import { NextRequest, NextResponse } from "next/server";
import { env } from "@/utils/env";

export async function GET(req: NextRequest, { params }: { params: { odataPath: string[] } }) {
  const path = params.odataPath?.join("/") ?? "";
  const url = new URL(req.url);
  const search = url.search || url.searchParams.toString();
  const target = `${env.API_BASE_URL}/odata/${path}${search}`;

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
