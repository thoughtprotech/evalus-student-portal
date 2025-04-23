import { templates } from "./loggerTemplates";

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

// Generic logger function that uses the templates
export function logger<K extends keyof typeof templates>(
  templateKey: K,
  data: Parameters<(typeof templates)[K]>[0]
): void {
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
