import getCookie from "../getCookie";
import { logger } from "../logger/logger";
import type { ApiResponse, Endpoint } from "./types";
import { env } from '../env';
import { log } from "console";


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
    const isAbsolute = typeof pathOnly === 'string' && /^https?:\/\//i.test(pathOnly);
    let fullUrl: string;
    if (isAbsolute) {
      fullUrl = pathOnly;
    } else if (typeof pathOnly === 'string' && pathOnly.startsWith('/api/odata')) {
      // Only proxy OData through Next.js internal API
      if (typeof window === 'undefined') {
        // Server-side: need absolute URL
        fullUrl = `${env.NEXTAUTH_URL}${pathOnly}`;
      } else {
        // Browser: relative is fine (same-origin)
        fullUrl = pathOnly;
      }
    } else {
      // All other relative paths (including /api/* meant for backend) – prefix with API_BASE_URL
      fullUrl = `${env.API_BASE_URL}${pathOnly}`;
    }

    logger("request:start", {
      endpoint,
      headers,
      body,
      url: fullUrl,      
    });

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
      
      // Handle empty responses (204 No Content, etc.)
      if (res.status === 204 || res.headers.get('content-length') === '0') {
        json = {};
      } else {
        try {
          const text = await res.text();
          if (text.trim()) {
            json = JSON.parse(text);
          }
        } catch (error) {
          logger("request:error", {
            endpoint,
            status: res.status,
            errorMessage: error || "Invalid JSON response",
            elapsed,
          });
          return {
            status: res.status,
            error: true,
            message: "Invalid JSON response",
            errorMessage: "The server returned an invalid JSON",
            data: undefined,
          };
        }
      }

      const finalResponse: ApiResponse<Res> = {
        status: (json as any).status ?? res.status,
        error: (json as any).error ?? !res.ok,
        message: (json as any).message ?? res.statusText ?? "No message",
        errorMessage: (json as any).errorMessage ?? (!res.ok ? "Request failed" : ""),
        // If the server doesn’t wrap payloads, fall back to the raw JSON
        data: ((json as any).data !== undefined ? (json as any).data : (json as any)) as Res,
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
          errorMessage = `Failed to connect to ${target || fullUrl} - Server may be down or unreachable`;
        } else if (err.message.includes("CORS")) {
          errorMessage = `CORS error - Check server CORS configuration`;
        } else if (err.message.includes("SSL") || err.message.includes("certificate")) {
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
      };
    }
  };
}

export const apiHandler = createApiClient();
