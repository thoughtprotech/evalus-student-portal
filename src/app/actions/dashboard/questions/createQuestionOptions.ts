"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

interface CreateQuestionOptionsRequest {
  questionId: number;
  questionHeaderText?: string | null;
  questionText: string;
  additionalExplanation: string;
  videoSolutionWeburl?: string | null;
  videoSolutionMobileurl?: string | null;
  writeUpId?: number | null;
  questionOptionsJson: string;
  questionCorrectAnswerJson: string;
  language: string;
}

export async function createQuestionOptionsAction(
  payload: CreateQuestionOptionsRequest
): Promise<ApiResponse<null>> {
  try {
    // Transform to backend's expected PascalCase schema
    const serverPayload = {
      QuestionID: payload.questionId,
      QuestionHeaderText: payload.questionHeaderText ?? null,
      QuestionText: payload.questionText,
      AdditionalExplanation: payload.additionalExplanation,
      VideoSolutionWeburl: payload.videoSolutionWeburl ?? null,
      VideoSolutionMobileurl: payload.videoSolutionMobileurl ?? null,
      WriteUpID: payload.writeUpId ?? null,
      QuestionOptionsJSON: payload.questionOptionsJson,
      QuestionCorrectAnswerJSON: payload.questionCorrectAnswerJson,
      Language: payload.language,
      IsActive: 1,
    };

    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.createQuestionOptions,
      serverPayload
    );

    if (status === 201 || status === 200) {
      return {
        status,
        error,
        data,
        message: message || "Question Options Created",
      };
    }

    console.error("CreateQuestionOptions failed", {
      status,
      error,
      errorMessage,
      response: data,
      payload: serverPayload,
      endpoint: endpoints.createQuestionOptions.path({}),
    });

    return {
      status: 500,
      error: true,
      errorMessage: errorMessage || "Error Creating Question Options",
    };
  } catch (error) {
    console.error("Error Creating Question Options (network/unknown)", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Creating Question Options",
    };
  }
}
