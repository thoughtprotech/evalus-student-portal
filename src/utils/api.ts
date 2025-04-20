type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";
type RouteType = "open" | "close";

interface ApiRequestOptions {
  method?: ApiMethod;
  body?: Record<string, any> | FormData;
  headers?: Record<string, string>;
  routeType?: RouteType;
}

export async function apiHandler<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.example.com";
  const url = `${API_BASE_URL}${endpoint}`;
  const { method = "GET", body, headers = {}, routeType = "open" } = options;

  console.log({ endpoint, options });

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    ...headers,
    ...(body && !isFormData && method !== "GET"
      ? { "Content-Type": "application/json" }
      : {}),
  };

  // Add token for protected routes
  if (routeType === "close") {
    try {
      const token = (document?.cookie || "")
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (token) {
        finalHeaders["Authorization"] = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("Token could not be attached:", err);
    }
  }

  const requestInit: RequestInit = {
    method,
    headers: finalHeaders,
    ...(method !== "GET" && body
      ? { body: isFormData ? body : JSON.stringify(body) }
      : {}),
  };

  try {
    const response = await fetch(url, requestInit);
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      const errorText = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();
      throw new Error(
        typeof errorText === "string" ? errorText : JSON.stringify(errorText)
      );
    }

    if (contentType?.includes("application/json")) {
      return await response.json();
    }

    return (await response.text()) as unknown as T;
  } catch (error: any) {
    console.error(`API Error [${method}] ${url}:`, error.message);
    throw error;
  }
}
