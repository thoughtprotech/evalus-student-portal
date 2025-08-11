export default async function getCookie(name: string): Promise<string | undefined> {
  // Client-side: read from document.cookie
  if (typeof window !== "undefined") {
    const cookieString = document.cookie || "";
    const parts = cookieString.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (!p) continue;
      const eq = p.indexOf("=");
      const k = decodeURIComponent(eq >= 0 ? p.slice(0, eq) : p);
      if (k === name) {
        const v = eq >= 0 ? decodeURIComponent(p.slice(eq + 1)) : "";
        return v;
      }
    }
    return undefined;
  }

  // Server-side: use next/headers dynamically to avoid bundling in client
  const mod = await import("next/headers");
  const maybeStore: any = mod.cookies();
  const store = typeof maybeStore?.then === "function" ? await maybeStore : maybeStore;
  const cookie = store?.get?.(name)?.value as string | undefined;
  return cookie;
}
