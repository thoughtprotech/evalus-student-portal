import { cookies } from "next/headers";

export default async function getCookie(name: string): Promise<string> {
  const cookieStore = cookies();
  const cookie = (await cookieStore).get(name)?.value;
  if (cookie) {
    return cookie;
  }
  throw new Error("Cookie Not Found");
}
