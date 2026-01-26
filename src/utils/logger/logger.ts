import { templates } from "./loggerTemplates";
import { env } from "../env";

export type LogData = Record<string, any>;
export type LogTemplateFn<T extends LogData> = (
  data: T & { timestamp: string }
) => string;

// Timestamp formatter
function formatTimestamp(date = new Date()): string {
  return date.toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "medium",
    hour12: true,
  });
}

// Check if logging is enabled based on environment variables
function isLoggingEnabled(): boolean {
  // In development, check ENABLE_API_LOGGING or ENABLE_REQUEST_LOGGING
  if (env.isDevelopment()) {
    return env.ENABLE_API_LOGGING || env.ENABLE_REQUEST_LOGGING || false;
  }
  // In production, only log if explicitly enabled
  return env.ENABLE_API_LOGGING || false;
}

// Generic logger function that uses the templates
export function logger<K extends keyof typeof templates>(
  templateKey: K,
  data: Parameters<(typeof templates)[K]>[0]
): void {
  // Skip logging if not enabled
  if (!isLoggingEnabled()) {
    return;
  }

  const tmpl = templates[templateKey];
  if (!tmpl) {
    console.warn(`No log template for key: ${templateKey}`);
    console.log(data);
    return;
  }

  const timestamp = formatTimestamp();
  const message = tmpl({ ...data, timestamp });
  console.log(`\n[LOGGER]\n${message}`);
}
