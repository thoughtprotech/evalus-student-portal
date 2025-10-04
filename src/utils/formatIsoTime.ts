export default function formatToDDMMYYYY_HHMM(isoString: string) {
  const date = new Date(isoString);

  // Extract parts (months are zero‑indexed) :contentReference[oaicite:0]{index=0}
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 0→Jan :contentReference[oaicite:1]{index=1}
  const year = date.getFullYear(); // four‑digit year :contentReference[oaicite:2]{index=2}

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  }
  return [
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

/**
 * Formats minutes as "HHhr MMm" (e.g. 90 -> "1hr 30m", 15 -> "15m")
 */
export function formatMinutesToHourMinute(minutes: number): string {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds}s`;
  }
  if (minutes < 60) {
    const wholeMinutes = Math.floor(minutes);
    const seconds = Math.round((minutes - wholeMinutes) * 60);
    if (seconds === 0) {
      return `${wholeMinutes} Minutes`;
    }
    return `${wholeMinutes} Minutes ${seconds}s`;
  }

  const hrs = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const wholeMinutes = Math.floor(remainingMinutes);
  const seconds = Math.round((remainingMinutes - wholeMinutes) * 60);

  let result = `${hrs}hr`;
  if (wholeMinutes > 0) {
    result += ` ${wholeMinutes} Minutes`;
  }
  if (seconds > 0) {
    result += ` ${seconds} S`;
  }
  return result;
}
