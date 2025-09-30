"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { getUserAction } from "../getUser";

export interface RegisterTestRequest {
    testRegistrationId?: number; // always 0 for new
    userName?: string;
    testId: number;
    testDate: string; // ISO string
    testStatus?: string; // e.g., Registered
    comments?: string;
    language?: string;
    isActive?: number;
    createdBy?: string;
    createdDate?: string;
    modifiedBy?: string;
    modifiedDate?: string;
}

export async function registerTestAction(req: { testId: number; testDate: string; comments?: string; language?: string; }): Promise<{ ok: boolean; status: number; message?: string; errorMessage?: string; }> {
    try {
        console.log("Registering test with request:", req);
        const username = await getUserAction();
        if (!username) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }

        const nowIso = new Date().toISOString();
        // Send camelCase as primary (per backend payload spec), include PascalCase duplicates for safety
        const payload: any = {
            // camelCase
            testRegistrationId: 0,
            userName: username,
            testId: req.testId,
            testDate: req.testDate,
            testStatus: "Registered",
            comments: req.comments || "",
            language: req.language || "English",
            isActive: 1,
            createdBy: username,
            createdDate: nowIso,
            modifiedBy: username,
            modifiedDate: nowIso,
            // PascalCase duplicates
            TestRegistrationId: 0,
            UserName: username,
            TestId: req.testId,
            TestDate: req.testDate,
            TestStatus: "Registered",
            Comments: req.comments || "",
            Language: req.language || "English",
            IsActive: 1,
            CreatedBy: username,
            CreatedDate: nowIso,
            ModifiedBy: username,
            ModifiedDate: nowIso
        };

        console.log("Registering test with payload:", payload);
        const { status, error, message, errorMessage } = await apiHandler(endpoints.registerTest, payload);

        return { ok: !error && status >= 200 && status < 300, status, message, errorMessage };
    } catch (e: any) {
        return { ok: false, status: 500, message: "Registration failed", errorMessage: e?.message };
    }
}
