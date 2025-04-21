import { logger } from "../logger/logger";
import type { ApiResponse, Endpoint } from "./types";

function getTokenFromCookie(name: string): string {
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) throw new Error("Authentication token missing");
  return match.split("=")[1];
}

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
        const token = getTokenFromCookie("token");
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
    });

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint.path(body as Req)}`,
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
      } catch {
        logger("request:error", {
          endpoint,
          status: res.status,
          errorMessage: "Invalid JSON response",
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
        status: json.status ?? res.status,
        error: json.error ?? !res.ok,
        message: json.message ?? res.statusText ?? "No message",
        errorMessage:
          json.errorMessage ??
          (!res.ok ? "Request failed" : "") ??
          "Unknown error",
        data: json.data as Res,
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
        });
      }

      return finalResponse;
    } catch (err: any) {
      const elapsed = `${Date.now() - startTime}ms`;
      logger("request:network-error", {
        endpoint,
        errorMessage: err?.message || "An unknown error occurred",
        elapsed,
      });
      return {
        status: 500,
        error: true,
        message: "Network error",
        errorMessage: err?.message || "An unknown error occurred",
        data: undefined,
      };
    }
  };
}

export const apiHandler = createApiClient();
