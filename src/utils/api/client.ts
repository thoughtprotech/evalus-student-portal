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
    const headers: Record<string, string> = isForm
      ? {}
      : { "Content-Type": "application/json" };

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
    

    logger("request:start", {
      endpoint,
      headers,
      body,
      url: `${env.API_BASE_URL}${endpoint.path(body as Req)}`,      
    });

    try {
      const res = await fetch(
        `${env.API_BASE_URL}${endpoint.path(body as Req)}`,
        {
          method: endpoint.method,
          headers,
          body:
            endpoint.method === "GET"
              ? undefined
              : isForm
              ? (body as FormData)
              : JSON.stringify(body),
          credentials: endpoint.type === "CLOSE" ? "include" : undefined,
        }
      );

      const elapsed = `${Date.now() - startTime}ms`;

      let json: Partial<ApiResponse<Res>> = {};
      try {
        json = await res.json();
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
      if (err?.message) {
        if (err.message.includes("fetch")) {
          errorMessage = `Failed to connect to ${env.API_BASE_URL} - Server may be down or unreachable`;
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
