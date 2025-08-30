import { NextRequest, NextResponse } from "next/server";
import { env } from "@/utils/env";

// Generic backend proxy for non-OData endpoints.
// Usage from client: fetch('/api/proxy/api/Tests/53', ...)
// This handler forwards to `${API_BASE_URL}/api/Tests/53` preserving method, headers, query and body.

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
]);

async function handle(req: NextRequest) {
  // Reconstruct the target URL by stripping the "/api/proxy" prefix
  const url = new URL(req.url);
  const originalPath = url.pathname.replace(/^\/api\/proxy/, ""); // e.g., "/api/Tests/53"
  const search = url.search || "";
  const target = `${env.API_BASE_URL}${originalPath}${search}`;

  // Build headers to forward; drop hop-by-hop headers, set content-type only when present
  const headers: HeadersInit = {};
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lower)) {
      headers[key] = value;
    }
  });

  const method = req.method || "GET";

  // Read body if present and method allows it
  let body: BodyInit | undefined = undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await req.text();
      body = json; // forward as-is
    } else if (contentType.includes("form")) {
      const formData = await req.formData();
      const form = new URLSearchParams();
      for (const [k, v] of formData.entries()) {
        form.append(k, typeof v === "string" ? v : (v as File).name);
      }
      body = form;
    } else {
      // Binary or unknown; stream raw body
      body = await req.arrayBuffer();
    }
  }

  try {
    const res = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
      // Don't send credentials here; cookies were already forwarded in headers when present
    });

    const responseHeaders = new Headers();
    // Pass through content-type and any useful headers
    const ct = res.headers.get("content-type");
    if (ct) responseHeaders.set("content-type", ct);

    // You can mirror additional headers if needed (e.g., pagination)
    const bodyText = await res.text();
    return new NextResponse(bodyText, { status: res.status, headers: responseHeaders });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: true,
        message: "Upstream fetch failed",
        errorMessage: e?.message || "Network error",
        target: env.API_BASE_URL,
      },
      { status: 502 }
    );
  }
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
