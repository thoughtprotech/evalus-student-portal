"use server";

import { ApiResponse } from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

// Row model consumed by the grid UI
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

// API response structure based on your provided example
interface ApiQuestionItem {
  questionId: number;
  questionText: string;
  subject: string;
  topic: string;
  questionDifficultyLevel: string;
  createdDate: string;
  modifiedDate: string;
  isActive: number;
  language: string;
}

interface ODataResponse<T> {
  "@odata.count"?: number;
  value: T[];
}

export interface FetchQuestionsParams {
  top?: number; // $top
  skip?: number; // $skip
  orderBy?: string; // $orderby e.g., "CreatedDate desc"
  filter?: string; // $filter e.g., "contains(QuestionText,'javascript')"
}

function buildQuery(params: FetchQuestionsParams): string {
  const searchParams = new URLSearchParams();
  
  // Since language is already in the endpoint, don't add $count as it might not be supported by your function call API
  // Add standard OData query parameters that work with function calls
  if (typeof params.top === "number") searchParams.set("$top", String(params.top));
  if (typeof params.skip === "number") searchParams.set("$skip", String(params.skip));
  if (params.orderBy) searchParams.set("$orderby", params.orderBy);
  if (params.filter) searchParams.set("$filter", params.filter);
  
  return searchParams.toString();
}

function mapToRows(items: ApiQuestionItem[]): QuestionRow[] {
  console.log(`🔄 Starting to map ${items.length} items`);
  
  return items.map((item, index) => {
    console.log(`📝 Mapping item ${index + 1}/${items.length}:`, item);
    
    // Validate item structure
    if (!item) {
      console.log(`⚠️  Item ${index} is null or undefined`);
      return null;
    }
    
    if (typeof item !== 'object') {
      console.log(`⚠️  Item ${index} is not an object:`, typeof item);
      return null;
    }
    
    const mapped = {
      id: item.questionId || 0,
      title: item.questionText || "No Title",
      subject: item.subject || "N/A",
      topic: item.topic || "N/A", 
      level: item.questionDifficultyLevel || "N/A",
      createdAt: item.createdDate || "",
      updatedAt: item.modifiedDate || "",
      language: item.language || "English",
      isActive: item.isActive || 0,
      createdBy: "System", // Not provided in API response
    };
    
    console.log(`✅ Mapped item ${index + 1}:`, mapped);
    return mapped;
  }).filter(item => item !== null) as QuestionRow[]; // Remove any null items
}

function getMockData(params: FetchQuestionsParams): ApiResponse<{ rows: QuestionRow[]; total: number }> {
  console.log("Returning mock data with params:", params);
  
  const mockData: QuestionRow[] = [
    {
      id: 1,
      title: "What is React and how does it work?",
      subject: "JavaScript",
      topic: "React Fundamentals",
      level: "Beginner",
      createdAt: "2025-08-10T10:30:00Z",
      updatedAt: "2025-08-10T10:30:00Z",
      language: "English",
      createdBy: "Admin",
      isActive: 1,
    },
    {
      id: 2,
      title: "Explain TypeScript interfaces and types",
      subject: "TypeScript",
      topic: "Type System",
      level: "Intermediate",
      createdAt: "2025-08-09T14:20:00Z",
      updatedAt: "2025-08-10T09:15:00Z",
      language: "English",
      createdBy: "System",
      isActive: 1,
    },
    {
      id: 3,
      title: "What are JavaScript closures?",
      subject: "JavaScript",
      topic: "Advanced Concepts",
      level: "Advanced",
      createdAt: "2025-08-09T16:45:00Z",
      updatedAt: "2025-08-09T16:45:00Z",
      language: "English",
      createdBy: "Teacher1",
      isActive: 1,
    },
    {
      id: 4,
      title: "How to create REST APIs in Node.js?",
      subject: "Node.js",
      topic: "Backend Development",
      level: "Intermediate",
      createdAt: "2025-08-09T11:30:00Z",
      updatedAt: "2025-08-10T08:20:00Z",
      language: "English",
      createdBy: "Admin",
      isActive: 1,
    },
    {
      id: 5,
      title: "What is CSS Grid Layout?",
      subject: "CSS",
      topic: "Layout Systems",
      level: "Beginner",
      createdAt: "2025-08-08T13:15:00Z",
      updatedAt: "2025-08-09T12:30:00Z",
      language: "English",
      createdBy: "Teacher2",
      isActive: 1,
    },
    {
      id: 6,
      title: "Explain Python list comprehensions",
      subject: "Python",
      topic: "Data Structures",
      level: "Intermediate",
      createdAt: "2025-08-08T09:45:00Z",
      updatedAt: "2025-08-08T09:45:00Z",
      language: "English",
      createdBy: "System",
      isActive: 1,
    },
    {
      id: 7,
      title: "What is machine learning?",
      subject: "AI/ML",
      topic: "Introduction",
      level: "Beginner",
      createdAt: "2025-08-07T15:20:00Z",
      updatedAt: "2025-08-08T10:15:00Z",
      language: "English",
      createdBy: "Teacher3",
      isActive: 1,
    },
    {
      id: 8,
      title: "How to optimize SQL queries?",
      subject: "Database",
      topic: "Query Optimization",
      level: "Advanced",
      createdAt: "2025-08-07T12:10:00Z",
      updatedAt: "2025-08-07T12:10:00Z",
      language: "English",
      createdBy: "Admin",
      isActive: 1,
    },
    {
      id: 9,
      title: "What is Docker containerization?",
      subject: "DevOps",
      topic: "Containerization",
      level: "Intermediate",
      createdAt: "2025-08-06T14:30:00Z",
      updatedAt: "2025-08-07T09:45:00Z",
      language: "English",
      createdBy: "Teacher1",
      isActive: 1,
    },
    {
      id: 10,
      title: "Explain Git branching strategies",
      subject: "Version Control",
      topic: "Git Workflow",
      level: "Intermediate",
      createdAt: "2025-08-06T11:20:00Z",
      updatedAt: "2025-08-06T11:20:00Z",
      language: "English",
      createdBy: "System",
      isActive: 1,
    },
    {
      id: 11,
      title: "What is Redux state management?",
      subject: "JavaScript",
      topic: "State Management",
      level: "Advanced",
      createdAt: "2025-08-05T16:15:00Z",
      updatedAt: "2025-08-06T10:30:00Z",
      language: "English",
      createdBy: "Teacher2",
      isActive: 1,
    },
    {
      id: 12,
      title: "How to implement authentication in React?",
      subject: "JavaScript",
      topic: "Security",
      level: "Advanced",
      createdAt: "2025-08-05T13:40:00Z",
      updatedAt: "2025-08-05T13:40:00Z",
      language: "English",
      createdBy: "Admin",
      isActive: 1,
    },
    {
      id: 13,
      title: "What are HTTP status codes?",
      subject: "Web Development",
      topic: "HTTP Protocol",
      level: "Beginner",
      createdAt: "2025-08-04T10:25:00Z",
      updatedAt: "2025-08-05T08:15:00Z",
      language: "English",
      createdBy: "Teacher3",
      isActive: 1,
    },
    {
      id: 14,
      title: "Explain microservices architecture",
      subject: "System Design",
      topic: "Architecture Patterns",
      level: "Advanced",
      createdAt: "2025-08-04T15:50:00Z",
      updatedAt: "2025-08-04T15:50:00Z",
      language: "English",
      createdBy: "System",
      isActive: 1,
    },
    {
      id: 15,
      title: "How to use CSS Flexbox?",
      subject: "CSS",
      topic: "Layout Systems",
      level: "Beginner",
      createdAt: "2025-08-03T12:35:00Z",
      updatedAt: "2025-08-04T09:20:00Z",
      language: "English",
      createdBy: "Teacher1",
      isActive: 1,
    }
  ];
  
  // Apply pagination to mock data
  const top = params.top || 15;
  const skip = params.skip || 0;
  const paginatedData = mockData.slice(skip, skip + top);
  
  return {
    status: 200,
    message: "Using mock data for testing",
    data: { rows: paginatedData, total: mockData.length },
  };
}

export async function fetchQuestionsAction(
  params: FetchQuestionsParams = { top: 15, skip: 0 }
): Promise<ApiResponse<{ rows: QuestionRow[]; total: number }>> {
  try {
    // Use real API data
    const useMockData = false;
    
    if (useMockData) {
      console.log("USING MOCK DATA FOR TESTING");
      return getMockData(params);
    }

    // For OData function calls, we need to handle pagination differently
    // First, get all data without pagination parameters since function calls don't support $top/$skip
    console.log("🔧 Making API call to OData function (pagination will be handled client-side)");
    
    const response = await apiHandler(endpoints.getAdminQuestions, { query: "" });
    
    console.log("API Response:", response);

    if (response.error || response.status !== 200) {
      console.error("API Error Response:", {
        status: response.status,
        error: response.error,
        message: response.message,
        errorMessage: response.errorMessage
      });
      
      return {
        status: response.status,
        error: true,
        message: response.message || `Failed to fetch questions`,
        errorMessage: response.errorMessage,
      };
    }

    console.log("Raw API response data:", response.data);
    console.log("Response data type:", typeof response.data);
    console.log("Is response.data an array?", Array.isArray(response.data));
    
    // Your API returns a direct array, so handle it with client-side pagination
    let allItems: ApiQuestionItem[] = [];
    let total = 0;
    
    if (Array.isArray(response.data)) {
      allItems = response.data;
      total = allItems.length;
      console.log("✅ Direct array response with", allItems.length, "total items");
      
      // Apply client-side pagination
      const requestedTop = params.top || 15;
      const currentSkip = params.skip || 0;
      
      // Apply sorting if specified
      if (params.orderBy) {
        const [field, direction] = params.orderBy.split(' ');
        const fieldMap: Record<string, string> = {
          "questionId": "questionId",
          "questionText": "questionText", 
          "subject": "subject",
          "topic": "topic",
          "questionDifficultyLevel": "questionDifficultyLevel",
          "language": "language",
          "isActive": "isActive",
          "createdDate": "createdDate",
          "modifiedDate": "modifiedDate",
        };
        
        const mappedField = fieldMap[field] || field;
        allItems.sort((a: any, b: any) => {
          const aVal = a[mappedField];
          const bVal = b[mappedField];
          let comparison = 0;
          
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;
          
          return direction === 'desc' ? -comparison : comparison;
        });
      }
      
      // Apply filtering if specified
      if (params.filter) {
        console.log('Applying filter:', params.filter);
        
        // Parse OData-style filters
        const filterParts = params.filter.split(' and ');
        
        allItems = allItems.filter((item: any) => {
          return filterParts.every(filterPart => {
            const trimmedFilter = filterPart.trim();
            
            // Handle 'contains' filters
            const containsMatch = trimmedFilter.match(/contains\((\w+),'(.+?)'\)/);
            if (containsMatch) {
              const [, field, value] = containsMatch;
              const itemValue = String(item[field] || '').toLowerCase();
              return itemValue.includes(value.toLowerCase());
            }
            
            // Handle 'eq' filters for numbers/booleans
            const eqMatch = trimmedFilter.match(/(\w+)\s+eq\s+(\d+|true|false|'[^']*')/);
            if (eqMatch) {
              const [, field, value] = eqMatch;
              const itemValue = item[field];
              
              // Handle numeric comparisons
              if (/^\d+$/.test(value)) {
                return Number(itemValue) === Number(value);
              }
              
              // Handle boolean comparisons
              if (value === 'true' || value === 'false') {
                return Boolean(itemValue) === (value === 'true');
              }
              
              // Handle string comparisons (remove quotes)
              const stringValue = value.replace(/^'|'$/g, '');
              return String(itemValue).toLowerCase() === stringValue.toLowerCase();
            }
            
            // Handle 'startswith' filters
            const startsWithMatch = trimmedFilter.match(/startswith\((\w+),'(.+?)'\)/);
            if (startsWithMatch) {
              const [, field, value] = startsWithMatch;
              const itemValue = String(item[field] || '').toLowerCase();
              return itemValue.startsWith(value.toLowerCase());
            }
            
            // Handle 'endswith' filters
            const endsWithMatch = trimmedFilter.match(/endswith\((\w+),'(.+?)'\)/);
            if (endsWithMatch) {
              const [, field, value] = endsWithMatch;
              const itemValue = String(item[field] || '').toLowerCase();
              return itemValue.endsWith(value.toLowerCase());
            }
            
            // If no pattern matches, fall back to simple contains across all values
            const filterLower = trimmedFilter.toLowerCase();
            return Object.values(item).some(value => 
              String(value).toLowerCase().includes(filterLower)
            );
          });
        });
        
        total = allItems.length; // Update total after filtering
      }
      
      // Apply pagination
      const paginatedItems = allItems.slice(currentSkip, currentSkip + requestedTop);
      console.log(`📄 Paginated: showing ${paginatedItems.length} items (${currentSkip + 1}-${currentSkip + paginatedItems.length} of ${total})`);
      
      const mappedRows = mapToRows(paginatedItems);
      return {
        status: 200,
        message: `Successfully fetched ${mappedRows.length} questions`,
        data: { rows: mappedRows, total }
      };
    } else {
      console.log("❌ Expected array response but got:", typeof response.data);
      // Fallback: try to find array data anywhere in the response
      if (response.data && typeof response.data === 'object') {
        const dataKeys = Object.keys(response.data);
        console.log("Available keys in response:", dataKeys);
        for (const key of dataKeys) {
          const dataAny = response.data as any;
          if (Array.isArray(dataAny[key])) {
            console.log(`Found array at key '${key}' with ${dataAny[key].length} items`);
            allItems = dataAny[key];
            total = allItems.length;
            break;
          }
        }
      }
      
      if (allItems.length === 0) {
        console.log("❌ Could not find any array data in response");
        return {
          status: 200,
          message: "No questions found",
          data: { rows: [], total: 0 }
        };
      }
      
      // Apply client-side pagination to fallback data too
      const requestedTop = params.top || 15;
      const currentSkip = params.skip || 0;
      const paginatedItems = allItems.slice(currentSkip, currentSkip + requestedTop);
      const mappedRows = mapToRows(paginatedItems);
      
      return {
        status: 200,
        message: `Successfully fetched ${mappedRows.length} questions`,
        data: { rows: mappedRows, total }
      };
    }
  } catch (error: any) {
    console.error("Error Fetching Questions:", error);
    return {
      status: 500,
      error: true,
      message: "Failed to fetch questions from API",
      errorMessage: error?.message,
    };
  }
}

export async function deleteQuestionAction(id: number): Promise<ApiResponse<null>> {
  try {
    // Note: You may need to add this endpoint to endpoints.ts if it doesn't exist
    // const res = await apiHandler(endpoints.deleteAdminQuestion, { id } as any);
    // For now, return a placeholder implementation
    console.log("Delete question with id:", id);
    return { 
      status: 200, 
      message: "Question deletion not implemented yet. Please add endpoint to endpoints.ts" 
    };
  } catch (error: any) {
    return {
      status: 500,
      error: true,
      message: "Network error",
      errorMessage: error?.message,
    };
  }
}
