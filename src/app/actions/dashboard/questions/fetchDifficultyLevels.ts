"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetDifficultyLevelsResponse, ODataList } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchDifficultyLevelsAction(language?: string): Promise<ApiResponse<GetDifficultyLevelsResponse[]>> {
  try {
    // Prefer OData (OPEN) endpoint so it can be called without auth and filtered by language
    const odataRes = await apiHandler(
      endpoints.getQuestionDifficultyLevelsOData,
      { language }
    );

    if (!odataRes.error && odataRes.status === 200) {
      const raw = ((odataRes.data as unknown as ODataList<any>)?.value || []) as any[];
      const list: GetDifficultyLevelsResponse[] = raw.map((r) => ({
        questionDifficultylevelId:
          r.QuestionDifficultylevelId ?? r.QuestionDifficultyLevelId ?? r.questionDifficultylevelId,
        questionDifficultylevel1:
          r.QuestionDifficultylevel1 ?? r.QuestionDifficultyLevel1 ?? r.QuestionDifficultyLevel ?? r.QuestionDifficultylevel ?? r.questionDifficultylevel1,
        language: r.Language ?? r.language ?? language ?? "",
        isActive: r.IsActive ?? r.isActive ?? 1,
        createdBy: r.CreatedBy ?? r.createdBy ?? "",
        createdDate: r.CreatedDate ?? r.createdDate ?? "",
        modifiedBy: r.ModifiedBy ?? r.modifiedBy ?? "",
        modifiedDate: r.ModifiedDate ?? r.modifiedDate ?? "",
      }));
      return {
        status: 200,
        data: list,
        message: "Difficulty Levels Fetched",
      };
    }

    // Fallback to legacy CLOSE endpoint (unfiltered) if OData fails
    const legacy = await apiHandler(endpoints.getDifficultyLevels, null);
    if (!legacy.error && legacy.status === 200) {
      return {
        status: 200,
        data: legacy.data,
        message: legacy.message || "Difficulty Levels Fetched",
      };
    }

    return {
      status: legacy.status || odataRes.status || 500,
      error: true,
      errorMessage: legacy.errorMessage || odataRes.errorMessage || "Error Fetching Difficulty Levels",
    };
  } catch (error) {
    console.log("Error Fetching Difficulty Level", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Difficulty Level",
    };
  }
}
