"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, CreateQuestionRequest } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function createQuestionAction(
  testId: number,
  questionType: string,
  questionText: string,
  options?: string,
  correctAnswer?: string
): Promise<ApiResponse<null>> {
  //   TODO: Add filters
  try {
    const payload: CreateQuestionRequest = {
      questionId: 0,
      questionText: "string",
      questionTypeId: 0,
      subjectId: 0,
      marks: 0,
      negativeMarks: 0,
      graceMarks: 0,
      questionDifficultyLevelId: 0,
      additionalExplanation: "string",
      videoSolutionWeburl: "string",
      videoSolutionMobileurl: "string",
      allowCandidateComments: 0,
      writeUpId: 0,
      hasMultipleAnswers: true,
      questionOptionsJson: "string",
      questionCorrectAnswerJson: "string",
      language: "string",
      isActive: 0,
      createdBy: "string",
      createdDate: "2025-07-01T08:37:00.564Z",
      modifiedBy: "string",
      modifiedDate: "2025-07-01T08:37:00.564Z",
    };

    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.createQuestion,
      payload
    );

    // console.log({ status, error, data, errorMessage, message });

    if (status === 200) {
      return {
        status,
        error,
        data,
        message: message || "Question Created",
      };
    }
    return {
      status: 500,
      error,
      errorMessage: errorMessage || "Error Creating Question",
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
