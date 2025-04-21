import { LogTemplateFn } from "./logger";

function stringifyBody(body: any): string {
  if (body instanceof FormData) {
    const formObj: Record<string, any> = {};
    for (const [key, value] of body.entries()) {
      formObj[key] = value;
    }
    return JSON.stringify(formObj);
  }
  return JSON.stringify(body);
}

export const templates: Record<string, LogTemplateFn<any>> = {
  "request:start": ({
    endpoint,
    headers,
    body,
    timestamp,
  }) =>
    `[${timestamp}] [MAKING REQUEST] ${endpoint.method} ${
      endpoint.path
    } - headers: ${JSON.stringify(headers)} - body: ${stringifyBody(body)}`,

  "request:success": ({ endpoint, status, data, elapsed, timestamp }) =>
    `[${timestamp}] [SUCCESS] ${endpoint.method} ${
      endpoint.path
    } (${status}) in ${elapsed} - data: ${JSON.stringify(data)}`,

  "request:error": ({ endpoint, status, errorMessage, elapsed, timestamp }) =>
    `[${timestamp}] [ERROR] ${endpoint.method} ${endpoint.path} (${status}) in ${elapsed} - error: ${errorMessage}`,

  "request:network-error": ({ endpoint, errorMessage, elapsed, timestamp }) =>
    `[${timestamp}] [NETWORK ERROR] ${endpoint.method} ${endpoint.path} - ${errorMessage} in ${elapsed}`,
};
