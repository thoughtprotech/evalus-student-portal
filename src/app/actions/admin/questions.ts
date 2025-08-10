"use server";

import { ApiResponse } from "@/utils/api/types";
import { API_BASE_URL } from "@/utils/constants";

interface Question {
  id: number;
  title: string;
  subject: string;
  topic: string;
  level: string;
  createdAt: string;
  updatedAt: string;
  additionalExplanation?: string;
  videoSolutionWeburl?: string;
  videoSolutionMobileurl?: string;
  questionOptionsJson?: string;
  questionCorrectAnswerJson?: string;
  language?: string;
  isActive?: number;
  createdBy?: string;
}

export async function fetchQuestonsAction(): Promise<ApiResponse<Question[]>> {
  try {
    // Direct fetch to the API endpoint
    const response = await fetch(`${API_BASE_URL}/api/QuestionOptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      // Transform the API response to match our Question interface
      const transformedQuestions: Question[] = data.map((item) => {
        // Extract difficulty level from the question or set a default
        let level = "Beginner";
        if (item.questionText?.toLowerCase().includes("advanced") || 
            item.questionText?.toLowerCase().includes("complex")) {
          level = "Advanced";
        } else if (item.questionText?.toLowerCase().includes("intermediate") || 
                   item.questionText?.toLowerCase().includes("medium")) {
          level = "Intermediate";
        }

        return {
          id: item.questionOptionId,
          title: item.questionText || `Question ${item.questionId}`,
          subject: item.language === "EN" ? "English" : item.language || "General",
          topic: "General Topic", // Could be extracted from writeUpId or other fields
          level: level,
          createdAt: item.createdDate,
          updatedAt: item.modifiedDate,
          additionalExplanation: item.additionalExplanation,
          videoSolutionWeburl: item.videoSolutionWeburl,
          videoSolutionMobileurl: item.videoSolutionMobileurl,
          questionOptionsJson: item.questionOptionsJson,
          questionCorrectAnswerJson: item.questionCorrectAnswerJson,
          language: item.language,
          isActive: item.isActive,
          createdBy: item.createdBy,
        };
      });

      return {
        status: 200,
        message: "Fetching Questions Successful",
        data: transformedQuestions,
      };
    }

    return {
      status: 500,
      message: "Invalid response format",
      data: [],
    };
  } catch (error) {
    console.log("Error Fetching Questions", error);
    return { 
      status: 500, 
      message: `Error Fetching Questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: [],
    };
  }
}

export async function fetchQuestionsByLanguageAction(language: string): Promise<ApiResponse<Question[]>> {
  try {
    // Fetch questions by language using the new endpoint
    const response = await fetch(`http://localhost:5000/api/Questions/by-language?language=${encodeURIComponent(language)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse = await response.json();
    
    // Check if the response has the expected structure
    if (apiResponse && apiResponse.status === 200 && Array.isArray(apiResponse.data)) {
      // Transform the API response to match our Question interface
      const transformedQuestions: Question[] = apiResponse.data.map((item: any) => {
        return {
          id: item.questionId,
          title: item.questionText || `Question ${item.questionId}`,
          subject: item.subject || "General",
          topic: item.topic || "General Topic",
          level: item.questionDifficultyLevel || "Beginner",
          createdAt: item.createdDate,
          updatedAt: item.modifiedDate,
          additionalExplanation: item.additionalExplanation,
          videoSolutionWeburl: item.videoSolutionWeburl,
          videoSolutionMobileurl: item.videoSolutionMobileurl,
          questionOptionsJson: item.questionOptionsJson,
          questionCorrectAnswerJson: item.questionCorrectAnswerJson,
          language: item.language,
          isActive: item.isActive,
          createdBy: item.createdBy,
        };
      });

      return {
        status: 200,
        message: apiResponse.message || "Fetching Questions by Language Successful",
        data: transformedQuestions,
      };
    }

    // Handle API error responses
    if (apiResponse && apiResponse.error) {
      return {
        status: apiResponse.status || 500,
        message: apiResponse.errorMessage || apiResponse.message || "API Error",
        data: [],
      };
    }

    return {
      status: 500,
      message: "Invalid response format",
      data: [],
    };
  } catch (error) {
    console.log("Error Fetching Questions by Language", error);
    return { 
      status: 500, 
      message: `Error Fetching Questions by Language: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: [],
    };
  }
}
