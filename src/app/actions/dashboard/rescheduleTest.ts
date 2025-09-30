"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { getUserAction } from "../getUser";

// Update an existing TestRegistration to Registered with a new TestDate and comments, without inserting a new row
export async function rescheduleTestAction(req: { testRegistrationId: number; testId: number; testDate: string; comments?: string; language?: string; }): Promise<{ ok: boolean; status: number; message?: string; errorMessage?: string; }> {
  try {
    const username = await getUserAction();
    if (!username) return { ok: false, status: 401, message: "Unauthorized" };

    const nowIso = new Date().toISOString();

    // Send camelCase per provided payload; include PascalCase duplicates for safety
    const payload: any = {
      // camelCase
      testRegistrationId: req.testRegistrationId,
      userName: username,
      testId: req.testId,
      testDate: req.testDate,
      testStatus: "Registered",
      comments: req.comments || "",
      language: req.language || "English",
      isActive: 1,
      modifiedBy: username,
      modifiedDate: nowIso,
      // PascalCase duplicates
      TestRegistrationId: req.testRegistrationId,
      UserName: username,
      TestId: req.testId,
      TestDate: req.testDate,
      TestStatus: "Registered",
      Comments: req.comments || "",
      Language: req.language || "English",
      IsActive: 1,
      ModifiedBy: username,
      ModifiedDate: nowIso,
    };

    const { status, error, message, errorMessage } = await apiHandler(
  endpoints.updateTestRegistration,
  { testRegistrationId: req.testRegistrationId, ...payload } as any
    );

    return { ok: !error && status >= 200 && status < 300, status, message, errorMessage };
  } catch (e: any) {
    return { ok: false, status: 500, message: "Reschedule failed", errorMessage: e?.message };
  }
}
