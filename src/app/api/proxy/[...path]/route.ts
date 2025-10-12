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
  // Avoid forwarding certain headers that can interfere with the upstream request
  if (HOP_BY_HOP_HEADERS.has(lower)) return;
  if (lower === 'content-length') return; // let fetch set this
  if (lower === 'content-encoding' || lower === 'accept-encoding') return; // avoid double-encoding
  headers[key] = value;
  });

  const method = req.method || "GET";

  // Read body if present and method allows it
  // For non-GET/HEAD methods, forward the raw request body as-is (ArrayBuffer).
  // This preserves multipart/form-data boundaries and binary uploads.
  let body: BodyInit | undefined = undefined;
  if (!["GET", "HEAD"].includes(method)) {
    try {
      const buf = await req.arrayBuffer();
      // If empty, leave undefined
      if (buf && buf.byteLength > 0) {
        body = buf;
      }
    } catch (e) {
      // Fallback to text body if arrayBuffer fails
      try {
        body = await req.text();
      } catch {}
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

    // Mirror response headers (except hop-by-hop) so client receives content-type, content-disposition etc.
    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!HOP_BY_HOP_HEADERS.has(lower)) {
        responseHeaders.set(key, value);
      }
    });

    // Return raw binary if present to avoid corrupting downloads (e.g., XLSX)
    const arrayBuf = await res.arrayBuffer();
    try {
      console.log(`[proxy] upstream ${method} ${originalPath} -> ${target} responded ${res.status}`);
    } catch {}
    return new NextResponse(arrayBuf, { status: res.status, headers: responseHeaders });
  } catch (e: any) {
    // Detailed logging to help debug upstream issues
    try {
      console.error("[proxy] upstream fetch failed", {
        error: e?.message ?? String(e),
        stack: e?.stack,
        target,
        method,
        // Log a summary of headers (avoid logging sensitive cookies fully)
        headers: Object.fromEntries(
          Array.from(req.headers.entries()).map(([k, v]) => [k, k.toLowerCase() === 'cookie' ? '[cookie omitted]' : v])
        ),
      });
    } catch (logErr) {
      // ignore logging errors
      console.error("[proxy] logging failed", logErr);
    }

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
