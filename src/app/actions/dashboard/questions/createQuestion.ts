"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, CreateQuestionRequest } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function createQuestionAction(
  payload: CreateQuestionRequest
): Promise<ApiResponse<null>> {
  //   TODO: Add filters
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.createQuestion,
      payload
    );

    console.log("CREATING QUESTION", {
      status,
      error,
      data,
      errorMessage,
      message,
    });

    if (status === 201 || status === 200) {
      return {
        status,
        error,
        data,
        message: message || "Question Created",
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
