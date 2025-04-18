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
