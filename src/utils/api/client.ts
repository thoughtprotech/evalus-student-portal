import getCookie from "../getCookie";
import { logger } from "../logger/logger";
import type { ApiResponse, Endpoint } from "./types";
import { env } from "../env";
import { log } from "console";

// In-flight GET requests de-duplication map
// Keyed by `${method}:${url}`. Ensures identical GETs reuse the same promise
// which avoids duplicate network calls under React Strict Mode double-mount.
const inFlightRequests = new Map<string, Promise<any>>();

// Short-lived GET response cache to prevent sequential duplicate calls
// e.g., Strict Mode re-mount where calls are not overlapping.
type CachedValue = { timestamp: number; response: any };
const responseCache = new Map<string, CachedValue>();
const DEFAULT_GET_CACHE_TTL_MS = 5_000; // 5 seconds is enough to squash dev double-invocations

function createApiClient() {
  return async function <Req, Res>(
    endpoint: Endpoint<Req, Res>,
    body: Req | FormData
  ): Promise<ApiResponse<Res>> {
    const isForm = body instanceof FormData;
    const headers: Record<string, string> = {};

    const startTime = Date.now();

    if (endpoint.type === "CLOSE") {
      try {
        const token = await getCookie("token");
        headers["Authorization"] = `Bearer ${token}`;
      } catch (err) {
        logger("request:error", {
          endpoint,
          status: 401,
          errorMessage: "Authentication token missing",
          elapsed: "0ms",
        });
        return {
          status: 401,
          error: true,
          message: "Unauthorized",
          errorMessage: "Authentication token missing",
          data: undefined,
        };
      }
    }

    const pathOnly = endpoint.path(body as Req) as string;
    const isAbsolute =
      typeof pathOnly === "string" && /^https?:\/\//i.test(pathOnly);
    let fullUrl: string;
    if (isAbsolute) {
      fullUrl = pathOnly;
    } else if (
      typeof pathOnly === "string" &&
      pathOnly.startsWith("/api/odata")
    ) {
      // OData: browser -> Next internal proxy; server -> backend directly
      if (typeof window === "undefined") {
        fullUrl = `${env.API_BASE_URL}${pathOnly.replace(
          /^\/api\/odata/,
          "/Odata"
        )}`;
      } else {
        fullUrl = pathOnly; // same-origin to Next API
      }
    } else if (typeof pathOnly === "string" && pathOnly.startsWith("/Odata")) {
      // Normalize '/Odata' paths: browser via Next proxy; server direct to backend
      const suffix = pathOnly.slice("/Odata".length); // keep leading '/'
      if (typeof window === "undefined") {
        fullUrl = `${env.API_BASE_URL}/Odata${suffix}`;
      } else {
        fullUrl = `/api/odata${suffix}`;
      }
    } else if (typeof pathOnly === "string" && pathOnly.startsWith("/odata")) {
      // Normalize lowercase '/odata' as well
      const suffix = pathOnly.slice("/odata".length);
      if (typeof window === "undefined") {
        fullUrl = `${env.API_BASE_URL}/Odata${suffix}`;
      } else {
        fullUrl = `/api/odata${suffix}`;
      }
    } else if (typeof pathOnly === "string" && pathOnly.startsWith("/api/")) {
      // Non-OData backend API calls: in the browser, route via Next.js proxy to avoid CORS/localhost issues
      if (typeof window === "undefined") {
        // Server-side can talk to backend directly
        fullUrl = `${env.API_BASE_URL}${pathOnly}`;
      } else {
        // Browser: use the proxy endpoint which forwards to API_BASE_URL
        fullUrl = `/api/proxy${pathOnly}`;
      }
    } else {
      // Any other relative path – assume same-origin
      fullUrl = pathOnly;
    }

    logger("request:start", {
      endpoint,
      headers,
      body,
      url: fullUrl,
    });

    // Encapsulate the actual request execution so we can de-duplicate GETs
    const execute = async (): Promise<ApiResponse<Res>> => {
      try {
        // Only set Content-Type for non-GET JSON requests to avoid CORS preflight for GET
        const finalHeaders: Record<string, string> = { ...headers };
        if (endpoint.method !== "GET" && !isForm) {
          finalHeaders["Content-Type"] = "application/json";
        }

        const res = await fetch(fullUrl, {
          method: endpoint.method,
          headers: finalHeaders,
          body:
            endpoint.method === "GET"
              ? undefined
              : isForm
              ? (body as FormData)
              : JSON.stringify(body),
          credentials: endpoint.type === "CLOSE" ? "include" : undefined,
        });

        const elapsed = `${Date.now() - startTime}ms`;

        let json: Partial<ApiResponse<Res>> = {};

        // Attempt to read body safely (could be empty or non-JSON)
        let rawText: string | null = null;
        try {
          rawText = await res.text();
        } catch {
          rawText = null;
        }

        const trimmed = rawText?.trim() || "";
        const contentType = res.headers.get("content-type") || "";
        const looksJson =
          contentType.includes("application/json") || /^[\[{]/.test(trimmed);

        if (!trimmed || res.status === 204) {
          // No content – fine
          json = {};
        } else if (looksJson) {
          try {
            json = JSON.parse(trimmed);
          } catch (error) {
            // Preserve raw text for diagnostics
            const snippet = trimmed.slice(0, 300);
            logger("request:error", {
              endpoint,
              status: res.status,
              errorMessage: `Invalid JSON response: ${snippet}`,
              elapsed,
            });
            if (res.ok) {
              json = { message: snippet } as any;
            } else {
              return {
                status: res.status,
                error: true,
                message: "Request failed (invalid JSON)",
                errorMessage: snippet,
                data: undefined,
              } as ApiResponse<Res>;
            }
          }
        } else {
          // Plain text / HTML fallback
          json = { message: trimmed } as any;
        }

        const finalResponse: ApiResponse<Res> = {
          status: (json as any).status ?? res.status,
          error: (json as any).error ?? !res.ok,
          message: (json as any).message ?? res.statusText ?? "No message",
          errorMessage:
            (json as any).errorMessage ??
            (!res.ok
              ? typeof (json as any).message === "string"
                ? (json as any).message
                : "Request failed"
              : ""),
          // If the server doesn’t wrap payloads, fall back to the raw JSON
          data: ((json as any).data !== undefined
            ? (json as any).data
            : looksJson
            ? (json as any)
            : undefined) as Res,
        };

        if (finalResponse.error) {
          logger("request:error", {
            endpoint,
            status: finalResponse.status,
            errorMessage: finalResponse.errorMessage ?? "Unknown error",
            elapsed,
          });
        } else {
          logger("request:success", {
            endpoint,
            status: finalResponse.status,
            data: finalResponse.data,
            elapsed,
            message: finalResponse.message,
          });
        }

        return finalResponse;
      } catch (err: any) {
        const elapsed = `${Date.now() - startTime}ms`;

        // Provide more detailed error messages
        let errorMessage = "Network error occurred";
        // Try to show the actual URL we attempted
        let target = "";
        try {
          const u = new URL(fullUrl);
          target = `${u.protocol}//${u.host}`;
        } catch {}
        if (err?.message) {
          if (err.message.includes("fetch")) {
            errorMessage = `Failed to connect to ${
              target || fullUrl
            } - Server may be down or unreachable`;
          } else if (err.message.includes("CORS")) {
            errorMessage = `CORS error - Check server CORS configuration`;
          } else if (
            err.message.includes("SSL") ||
            err.message.includes("certificate")
          ) {
            errorMessage = `SSL/Certificate error - Check server certificates`;
          } else {
            errorMessage = err.message;
          }
        }

        logger("request:network-error", {
          endpoint,
          errorMessage,
          elapsed,
        });

        return {
          status: 500,
          error: true,
          message: "Network error",
          errorMessage,
          data: undefined,
        } as ApiResponse<Res>;
      }
    };

    // For GET requests, return cached response when fresh to avoid sequential duplicates
    // if (endpoint.method === "GET" && !endpoint.disableCache) {
    //   const key = `${endpoint.method}:${fullUrl}`;
    //   const cached = responseCache.get(key);
    //   if (cached && Date.now() - cached.timestamp < DEFAULT_GET_CACHE_TTL_MS) {
    //     logger("request:cache-hit", { url: fullUrl });
    //     return cached.response as ApiResponse<Res>;
    //   }

    //   const existing = inFlightRequests.get(key) as
    //     | Promise<ApiResponse<Res>>
    //     | undefined;
    //   if (existing) {
    //     logger("request:dedup", { url: fullUrl });
    //     return existing;
    //   }

    //   const p = execute();
    //   inFlightRequests.set(key, p);
    //   try {
    //     const resp = await p;
    //     responseCache.set(key, { timestamp: Date.now(), response: resp });
    //     return resp;
    //   } finally {
    //     inFlightRequests.delete(key);
    //   }
    // } else {
    //   // Either non-GET or caching disabled
    //   return await execute();
    // }

    // Non-GET: just execute directly
    return await execute();
  };
}

export const apiHandler = createApiClient();
