"use server";

import { ApiResponse } from "@/utils/api/types";
import { API_BASE_URL } from "@/utils/constants";

export interface QuestionRow {
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

export async function fetchQuestionsAction({
  top = 10,
  skip = 0,
  orderBy = "questionId desc",
  filter,
}: {
  top?: number;
  skip?: number;
  orderBy?: string;
  filter?: string;
}): Promise<ApiResponse<{ rows: QuestionRow[]; total: number }>> {
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('$top', top.toString());
    params.append('$skip', skip.toString());
    params.append('$orderby', orderBy);
    params.append('$count', 'true');
    
    if (filter) {
      params.append('$filter', filter);
    }

    const apiUrl = API_BASE_URL || 'http://localhost:5000';
    const fullUrl = `${apiUrl}/api/Questions?${params.toString()}`;
    
    console.log('Fetching questions from:', fullUrl);

    // Try the OData endpoint first
    let response;
    try {
      response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError) {
      console.error('Network error fetching from main endpoint:', fetchError);
      // If network fails, try the fallback endpoint
      const fallbackUrl = `${apiUrl}/api/QuestionOptions`;
      console.log('Network failed, trying fallback endpoint:', fallbackUrl);
      
      try {
        response = await fetch(fallbackUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (fallbackError) {
        console.error('Network error fetching from fallback endpoint:', fallbackError);
        // Return sample data if both endpoints fail
        const sampleData = [
          {
            id: 1,
            title: "Sample Question 1 - What is React?",
            subject: "JavaScript",
            topic: "React Fundamentals",
            level: "Beginner",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            language: "EN",
            createdBy: "System",
            additionalExplanation: "",
            videoSolutionWeburl: "",
            videoSolutionMobileurl: "",
            questionOptionsJson: "",
            questionCorrectAnswerJson: "",
            isActive: 1,
          },
          {
            id: 2,
            title: "Sample Question 2 - What is TypeScript?",
            subject: "TypeScript",
            topic: "Type System",
            level: "Intermediate",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            language: "EN",
            createdBy: "System",
            additionalExplanation: "",
            videoSolutionWeburl: "",
            videoSolutionMobileurl: "",
            questionOptionsJson: "",
            questionCorrectAnswerJson: "",
            isActive: 1,
          },
          {
            id: 3,
            title: "Sample Question 3 - Advanced JavaScript Concepts",
            subject: "JavaScript",
            topic: "Advanced Concepts",
            level: "Advanced",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            language: "EN",
            createdBy: "System",
            additionalExplanation: "",
            videoSolutionWeburl: "",
            videoSolutionMobileurl: "",
            questionOptionsJson: "",
            questionCorrectAnswerJson: "",
            isActive: 1,
          },
          {
            id: 4,
            title: "Sample Question 4 - Node.js Backend Development",
            subject: "Node.js",
            topic: "Backend Development",
            level: "Intermediate",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            language: "EN",
            createdBy: "Admin",
            additionalExplanation: "",
            videoSolutionWeburl: "",
            videoSolutionMobileurl: "",
            questionOptionsJson: "",
            questionCorrectAnswerJson: "",
            isActive: 1,
          },
          {
            id: 5,
            title: "Sample Question 5 - Database Design Principles",
            subject: "Database",
            topic: "Design Principles",
            level: "Advanced",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            language: "EN",
            createdBy: "Admin",
            additionalExplanation: "",
            videoSolutionWeburl: "",
            videoSolutionMobileurl: "",
            questionOptionsJson: "",
            questionCorrectAnswerJson: "",
            isActive: 1,
          }
        ];

        // Apply client-side filtering to sample data
        let filteredData = [...sampleData];
        
        // Apply search filter
        if (filter) {
          const searchTerm = filter.toLowerCase();
          filteredData = filteredData.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.subject.toLowerCase().includes(searchTerm) ||
            item.topic.toLowerCase().includes(searchTerm) ||
            item.level.toLowerCase().includes(searchTerm) ||
            item.createdBy.toLowerCase().includes(searchTerm)
          );
        }

        // Apply pagination
        const paginatedData = filteredData.slice(skip, skip + top);

        return {
          status: 200,
          message: "Using sample data (API unavailable)",
          data: {
            rows: paginatedData,
            total: filteredData.length,
          },
        };
      }
    }

    console.log('Response status:', response.status);

    // If OData endpoint fails, try the existing endpoint
    if (!response.ok) {
      console.warn('OData endpoint failed, trying fallback endpoint');
      const fallbackUrl = `${apiUrl}/api/QuestionOptions`;
      console.log('Fetching questions from fallback:', fallbackUrl);
      
      response = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log('Raw API response:', data);
    
    // Try different response structures
    let apiData = data;
    let totalCount = 0;
    
    // Check if it's an OData response
    if (data && Array.isArray(data.value)) {
      apiData = data.value;
      totalCount = data['@odata.count'] || apiData.length;
    }
    // Check if it's a direct array
    else if (Array.isArray(data)) {
      apiData = data;
      totalCount = data.length;
    }
    // Check if it's wrapped in a data property
    else if (data && data.data && Array.isArray(data.data)) {
      apiData = data.data;
      totalCount = data.total || data.count || apiData.length;
    }
    else {
      console.error('Unexpected response structure:', data);
      return {
        status: 500,
        message: "Unexpected response format",
        data: { rows: [], total: 0 },
      };
    }

    if (Array.isArray(apiData)) {
      // Apply client-side pagination if server doesn't support it
      let paginatedData = apiData;
      if (apiData.length > top && !data.value) {
        // Client-side pagination
        const startIndex = skip;
        const endIndex = skip + top;
        paginatedData = apiData.slice(startIndex, endIndex);
        totalCount = apiData.length;
      }

      // Transform the API response to match our QuestionRow interface
      const transformedQuestions: QuestionRow[] = paginatedData.map((item: any) => {
        console.log('Transforming item:', item);
        
        // Extract difficulty level from the question or set a default
        let level = item.questionDifficultyLevel || item.level || "Beginner";
        if (item.questionText?.toLowerCase().includes("advanced") || 
            item.questionText?.toLowerCase().includes("complex")) {
          level = "Advanced";
        } else if (item.questionText?.toLowerCase().includes("intermediate") || 
                   item.questionText?.toLowerCase().includes("medium")) {
          level = "Intermediate";
        }

        return {
          id: item.questionId || item.id || item.questionOptionId,
          title: item.questionText || item.title || `Question ${item.questionId || item.id || item.questionOptionId}`,
          subject: item.subject || item.subjectName || (item.language === "EN" ? "English" : item.language) || "General",
          topic: item.topic || item.topicName || "General Topic",
          level: level,
          createdAt: item.createdDate || item.createdAt || new Date().toISOString(),
          updatedAt: item.modifiedDate || item.updatedAt || new Date().toISOString(),
          additionalExplanation: item.additionalExplanation,
          videoSolutionWeburl: item.videoSolutionWeburl,
          videoSolutionMobileurl: item.videoSolutionMobileurl,
          questionOptionsJson: item.questionOptionsJson,
          questionCorrectAnswerJson: item.questionCorrectAnswerJson,
          language: item.language || "EN",
          isActive: item.isActive,
          createdBy: item.createdBy || "System",
        };
      });

      console.log('Transformed questions:', transformedQuestions);

      return {
        status: 200,
        message: "Fetching Questions Successful",
        data: {
          rows: transformedQuestions,
          total: totalCount,
        },
      };
    }

    return {
      status: 500,
      message: "Invalid response format - not an array",
      data: { rows: [], total: 0 },
    };
  } catch (error) {
    console.error("Error Fetching Questions", error);
    return { 
      status: 500, 
      message: `Error Fetching Questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { rows: [], total: 0 },
    };
  }
}

export async function deleteQuestionAction(id: number): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Questions/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return {
      status: 200,
      message: "Question deleted successfully",
    };
  } catch (error) {
    console.log("Error Deleting Question", error);
    return { 
      status: 500, 
      message: `Error Deleting Question: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
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
