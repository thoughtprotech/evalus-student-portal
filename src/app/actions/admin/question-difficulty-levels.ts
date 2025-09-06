"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse, GetDifficultyLevelsResponse } from "@/utils/api/types";

export type DifficultyLevelRow = {
  id: number;
  name: string;
  language: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
};

export interface FetchDifficultyParams {
  top?: number;
  skip?: number;
  orderBy?: string; // e.g., "CreatedDate desc"
  filter?: string;  // OData $filter
  language?: string; // optional language to filter by (server-side via dedicated OData endpoint)
}

// List via OData with optional language filter
export async function fetchQuestionDifficultyLevelsAction(
  params: FetchDifficultyParams = { top: 15, skip: 0 }
): Promise<ApiResponse<{ rows: DifficultyLevelRow[]; total: number }>> {
  try {
    // Prefer OData endpoint with $count for reliable pagination
    const searchParams = new URLSearchParams();
    if (typeof params.top === "number") searchParams.set("$top", String(params.top));
    if (typeof params.skip === "number") searchParams.set("$skip", String(params.skip));
    if (params.orderBy) searchParams.set("$orderby", params.orderBy);
    if (params.filter) searchParams.set("$filter", params.filter);
    searchParams.set("$count", "true");
    searchParams.set("$select", "QuestionDifficultylevelId,QuestionDifficultylevel1,Language,IsActive,CreatedBy,CreatedDate,ModifiedBy,ModifiedDate");

    const query = `?${searchParams.toString()}`;
    // Build base path (we'll call generic OData list by language when provided)
    const base = "/Odata/QuestionDifficultyLevels";
    const path = params.language
      ? endpoints.getQuestionDifficultyLevelsOData.path({ language: params.language }) + `&$count=true` // already includes $select and filter
      : `${base}${query}`;

    // Use apiHandler with absolute OData path via endpoints trick
    const res = await apiHandler({
      method: "GET",
      path: () => path,
      type: "OPEN",
    }, null as any);

    if (res.status !== 200 || !res.data) {
      return { status: res.status, error: true, message: res.message || "Failed to fetch difficulty levels", errorMessage: res.errorMessage };
    }
    const payload: any = res.data;
    const total = payload["@odata.count"] ?? payload["@odata.Count"] ?? payload.count ?? payload.total ?? (Array.isArray(payload) ? payload.length : 0);
    const list: any[] = Array.isArray(payload.value) ? payload.value : (Array.isArray(payload) ? payload : []);
    const rows: DifficultyLevelRow[] = list.map((d: any) => ({
      id: d.QuestionDifficultylevelId ?? d.questionDifficultylevelId,
      name: d.QuestionDifficultylevel1 ?? d.questionDifficultylevel1,
      language: d.Language ?? d.language,
      isActive: Number(d.IsActive ?? d.isActive) === 1 ? 1 : 0,
      createdBy: d.CreatedBy ?? d.createdBy,
      createdDate: d.CreatedDate ?? d.createdDate,
      modifiedBy: d.ModifiedBy ?? d.modifiedBy,
      modifiedDate: d.ModifiedDate ?? d.modifiedDate,
    }));
    return { status: 200, data: { rows, total: typeof total === 'number' ? total : rows.length }, message: `Fetched ${rows.length} difficulty levels` };
  } catch (e: any) {
    return { status: 500, error: true, message: "Error fetching difficulty levels", errorMessage: e?.message };
  }
}

// Create
export async function createQuestionDifficultyLevelAction(payload: {
  questionDifficultylevel1: string;
  language: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}): Promise<ApiResponse<any>> {
  try {
    const res = await apiHandler(endpoints.createQuestionDifficultyLevel, payload as any);
    return res as any;
  } catch (e: any) {
    return { status: 500, error: true, message: "Failed to create difficulty level", errorMessage: e?.message };
  }
}

// Update
export async function updateQuestionDifficultyLevelAction(id: number, payload: {
  questionDifficultylevel1: string;
  language: string;
  isActive: number;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}): Promise<ApiResponse<any>> {
  try {
    const res = await apiHandler(endpoints.updateQuestionDifficultyLevel, { questionDifficultylevelId: id, ...payload } as any);
    return res as any;
  } catch (e: any) {
    return { status: 500, error: true, message: "Failed to update difficulty level", errorMessage: e?.message };
  }
}

// Delete
export async function deleteQuestionDifficultyLevelAction(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await apiHandler(endpoints.deleteQuestionDifficultyLevel, { questionDifficultylevelId: id } as any);
    return res as any;
  } catch (e: any) {
    return { status: 500, error: true, message: "Failed to delete difficulty level", errorMessage: e?.message };
  }
}

// Get by id (for edit prefill)
export async function getQuestionDifficultyLevelByIdAction(id: number): Promise<ApiResponse<DifficultyLevelRow | null>> {
  try {
    const res = await apiHandler(endpoints.getQuestionDifficultyLevelById, { questionDifficultylevelId: id } as any);
    if (res.status === 200 && res.data) {
      const d: any = res.data;
      const row: DifficultyLevelRow = {
        id: d.questionDifficultylevelId ?? d.QuestionDifficultylevelId,
        name: d.questionDifficultylevel1 ?? d.QuestionDifficultylevel1,
        language: d.language ?? d.Language,
        isActive: Number(d.isActive ?? d.IsActive) === 1 ? 1 : 0,
        createdBy: d.createdBy ?? d.CreatedBy,
        createdDate: d.createdDate ?? d.CreatedDate,
        modifiedBy: d.modifiedBy ?? d.ModifiedBy,
        modifiedDate: d.modifiedDate ?? d.ModifiedDate,
      };
      return { status: 200, data: row };
    }
    return { status: res.status, error: true, message: res.message || "Not found", errorMessage: res.errorMessage };
  } catch (e: any) {
    return { status: 500, error: true, message: "Failed to load difficulty level", errorMessage: e?.message };
  }
}
