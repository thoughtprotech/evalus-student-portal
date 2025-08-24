"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, CreateQuestionRequest } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";
import { getUserAction } from "@/app/actions/getUser";

export interface UpdateQuestionRequest extends Partial<CreateQuestionRequest> {
  questionId: number;
}

export async function updateQuestionAction(
  questionId: number,
  payload: Partial<CreateQuestionRequest>
): Promise<ApiResponse<null>> {
  try {
    // Add audit user for modifiedBy (and createdBy fallback if backend requires it)
    let username: string | null = null; try { username = await getUserAction(); } catch { /* ignore */ }
    const auditUser = username || 'admin';
  const finalPayload: any = { questionId, ...payload };
    // Only set modifiedBy / createdBy if not already provided by caller
    if (!('modifiedBy' in finalPayload)) finalPayload.modifiedBy = auditUser;
    if (!('createdBy' in finalPayload)) finalPayload.createdBy = auditUser; // some APIs require both
  // Provide PascalCase variants for backend compatibility
  if (!('ModifiedBy' in finalPayload)) finalPayload.ModifiedBy = finalPayload.modifiedBy;
  if (!('CreatedBy' in finalPayload)) finalPayload.CreatedBy = finalPayload.createdBy;
  // Add duration fallbacks (top-level and PascalCase) if coming only within questionsMeta
  const qMetaDur = (finalPayload.questionsMeta?.duration ?? finalPayload.questionsMeta?.Duration);
  if (!('duration' in finalPayload)) finalPayload.duration = qMetaDur ?? 0;
  if (!('Duration' in finalPayload)) finalPayload.Duration = finalPayload.duration;
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.updateQuestion,
      finalPayload
    );

    const isSuccess = (status >= 200 && status < 300) && !error;

    if (isSuccess) {
      return {
        status,
        error: false,
        data: null,
        message: message || "Question Updated Successfully",
      };
    }

    return {
      status: status || 500,
      error: true,
      errorMessage: errorMessage || message || "Error Updating Question",
    };
  } catch (error) {
    console.log("Error Updating Question", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Updating Question",
    };
  }
}
