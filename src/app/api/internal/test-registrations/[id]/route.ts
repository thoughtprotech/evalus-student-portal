import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/utils/env";
import jwt from "jsonwebtoken";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id || !/^[0-9]+$/.test(id)) {
    return NextResponse.json({ error: true, message: "Invalid registration id" }, { status: 400 });
  }

  const token = (await cookies()).get("token")?.value;
  const target = `${env.API_BASE_URL}/api/TestRegistrations/${id}`;

  // Parse incoming JSON body
  let incoming: any = {};
  try {
    const txt = await req.text();
    incoming = txt ? JSON.parse(txt) : {};
  } catch {
    incoming = {};
  }

  // Derive userName from JWT token for audit fields
  const decoded: any = token ? jwt.decode(token) : null;
  const userName = decoded?.userName || decoded?.UserName;
  if (!userName) {
    return NextResponse.json({ error: true, message: "Unauthorized: missing user" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();

  // Build payload with required fields in both camelCase and PascalCase for compatibility
  const payload = {
    // Ensure IDs
    testRegistrationId: Number(incoming?.testRegistrationId ?? id),
    TestRegistrationId: Number(incoming?.TestRegistrationId ?? id),
    testId: Number(incoming?.testId ?? incoming?.TestId ?? 0),
    TestId: Number(incoming?.TestId ?? incoming?.testId ?? 0),
    // Status and schedule
    testStatus: incoming?.testStatus || incoming?.TestStatus || "Registered",
    TestStatus: incoming?.TestStatus || incoming?.testStatus || "Registered",
    testDate: incoming?.testDate || incoming?.TestDate,
    TestDate: incoming?.TestDate || incoming?.testDate,
    comments: incoming?.comments || incoming?.Comments || "",
    Comments: incoming?.Comments || incoming?.comments || "",
    language: incoming?.language || incoming?.Language || "English",
    Language: incoming?.Language || incoming?.language || "English",
    isActive: 1,
    IsActive: 1,
    // Audit fields
    userName,
    UserName: userName,
    createdBy: userName,
    CreatedBy: userName,
    createdDate: incoming?.createdDate || incoming?.CreatedDate || nowIso,
    CreatedDate: incoming?.CreatedDate || incoming?.createdDate || nowIso,
    modifiedBy: userName,
    ModifiedBy: userName,
    modifiedDate: nowIso,
    ModifiedDate: nowIso,
  } as any;

  try {
    const res = await fetch(target, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";
    return new NextResponse(text, { status: res.status, headers: { "content-type": contentType } });
  } catch (e: any) {
    return NextResponse.json(
      { error: true, message: "Upstream update failed", errorMessage: e?.message },
      { status: 502 }
    );
  }
}
