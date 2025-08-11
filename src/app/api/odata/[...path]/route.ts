import { NextRequest, NextResponse } from "next/server";
import { env } from "@/utils/env";

// In Next.js 15, route params may be provided as a Promise in the context argument.
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const segments = path || [];
    const target = new URL(`${env.API_BASE_URL}/odata/${segments.join("/")}`);
    const search = req.nextUrl.searchParams;
    search.forEach((v, k) => target.searchParams.set(k, v));

    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (e: any) {
    return NextResponse.json({ error: true, message: e?.message ?? "Proxy error" }, { status: 500 });
  }
}
