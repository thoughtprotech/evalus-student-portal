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
  "request:start": ({ endpoint, headers, body, timestamp }) =>
    `[${timestamp}] [MAKING REQUEST]\n${endpoint.method} ${
      endpoint.path
    }\nheaders: ${JSON.stringify(headers)}\nbody: ${stringifyBody(body)}`,

  "request:success": ({
    endpoint,
    status,
    data,
    elapsed,
    timestamp,
    message,
  }) =>
    `[${timestamp}] [SUCCESS]\n${endpoint.method} ${
      endpoint.path
    } (${status}) in ${elapsed}\nmessage: ${message}\ndata: ${JSON.stringify(
      data
    )}`,

  "request:error": ({ endpoint, status, errorMessage, elapsed, timestamp }) =>
    `[${timestamp}] [ERROR]\n${endpoint.method} ${endpoint.path} (${status}) in ${elapsed}\nerror: ${errorMessage}`,

  "request:network-error": ({ endpoint, errorMessage, elapsed, timestamp }) =>
    `[${timestamp}] [NETWORK ERROR]\n${endpoint.method} ${endpoint.path} in ${elapsed}\nerror: ${errorMessage}`,
};
