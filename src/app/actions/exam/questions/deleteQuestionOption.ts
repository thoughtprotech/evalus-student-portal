"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

export async function deleteQuestionOptionAction(questionOptionId: number) {
  try {
    const response = await apiHandler(endpoints.deleteQuestionOption, {
      questionOptionId,
    });
    
    return {
      success: true,
      message: "Question option deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting question option:", error);
    return {
      success: false,
      message: "Failed to delete question option",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteMultipleQuestionOptionsAction(questionOptionIds: number[]) {
  try {
    // Delete all question options in parallel
    const deletePromises = questionOptionIds.map(id => 
      apiHandler(endpoints.deleteQuestionOption, { questionOptionId: id })
    );
    
    await Promise.all(deletePromises);
    
    return {
      success: true,
      message: `${questionOptionIds.length} question option(s) deleted successfully`,
    };
  } catch (error) {
    console.error("Error deleting question options:", error);
    return {
      success: false,
      message: "Failed to delete question options",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
