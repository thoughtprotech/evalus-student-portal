"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, CreateQuestionRequest } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";
import { getUserAction } from "@/app/actions/getUser";

export async function createQuestionAction(
  payload: CreateQuestionRequest
): Promise<ApiResponse<null>> {
  //   TODO: Add filters
  try {
    // Attach audit fields (CreatedBy / ModifiedBy) using logged in user (fallback to 'admin')
    let username: string | null = null;
    try { username = await getUserAction(); } catch { /* ignore */ }
    const auditUser = username || 'admin';
    const finalPayload: CreateQuestionRequest & { CreatedBy?: string; ModifiedBy?: string } = {
      ...payload,
      createdBy: payload.createdBy || auditUser,
      modifiedBy: payload.modifiedBy || auditUser,
  // Pass through batch number if provided
  batchNo: (payload as any).batchNo ?? (payload as any).BatchNo ?? (payload as any).BatchNumber ?? (payload as any)?.questionsMeta?.batchNo ?? undefined,
      // Provide alternate casings too
      ...( (payload as any)?.batchNo || (payload as any)?.BatchNo || (payload as any)?.BatchNumber ? {
        BatchNo: (payload as any).batchNo ?? (payload as any).BatchNo ?? (payload as any).BatchNumber,
        BatchNumber: (payload as any).batchNo ?? (payload as any).BatchNo ?? (payload as any).BatchNumber,
      } : {} ),
      // Also include PascalCase versions (API for Questions may expect these; camelCase ignored)
      CreatedBy: (payload as any).CreatedBy || payload.createdBy || auditUser,
      ModifiedBy: (payload as any).ModifiedBy || payload.modifiedBy || auditUser,
  // Ensure duration present in all expected casings if supplied
  duration: (payload as any).duration ?? (payload as any).questionsMeta?.duration ?? 0,
  Duration: (payload as any).Duration ?? (payload as any).duration ?? (payload as any).questionsMeta?.duration ?? 0,
    };

    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.createQuestion,
  finalPayload as any
    );

    console.log("CREATING QUESTION", {
      status,
      error,
      data,
      errorMessage,
      message,
    });

    // Consider success for 2xx status codes and when error is explicitly false
    const isSuccess = (status >= 200 && status < 300) || (status === 201 || status === 200) || (!error && status !== 0);

    if (isSuccess) {
      return {
        status,
        error: false, // Explicitly set to false for success
        data,
        message: message || "Question Created Successfully",
      };
    }

    // Log validation errors if they exist
    if (data && typeof data === 'object') {
      const errorData = data as any;
      if ('errors' in errorData) {
        console.error("Validation errors:", errorData.errors);
      }
    }

    return {
      status: status || 500,
      error: true,
      errorMessage: errorMessage || message || "Error Creating Question",
    };
  } catch (error) {
    console.log("Error Creating Question", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Creating Question",
    };
  }
}
