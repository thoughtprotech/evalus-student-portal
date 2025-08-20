"use server";

import { ApiResponse } from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { stripHtmlTags } from "@/utils/stripHtmlTags";

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
  questionoptionId?: number;
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
  isActive: number | string;
  language: string;
  questionOptionId: number;
  // New (backend now returns these audit fields)
  createdBy?: string | null;
  modifiedBy?: string | null;
  CreatedBy?: string | null; // tolerate different casing
  ModifiedBy?: string | null;
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
  return items.map((item, index) => {
    // Validate item structure
    if (!item) {
      return null;
    }

    if (typeof item !== 'object') {
      return null;
    }

    // Normalize isActive which may arrive as number or string ("0"/"1")
    const rawIsActive: any = (item as any)?.isActive;
    const normalizedIsActive = Number(rawIsActive) === 1 ? 1 : 0;

    const mapped = {
      id: item.questionId || 0,
      title: stripHtmlTags(item.questionText) || "No Title",
      subject: item.subject || "N/A",
      topic: item.topic || "N/A",
      level: item.questionDifficultyLevel || "N/A",
      createdAt: item.createdDate || "",
      updatedAt: item.modifiedDate || "",
      language: item.language || "English",
      // Use normalized numeric value (0/1) so UI Boolean casting is reliable
      isActive: normalizedIsActive,
      // Prefer camelCase, then PascalCase, fallback to System
      createdBy: (item.createdBy ?? item.CreatedBy ?? undefined) ? String(item.createdBy ?? item.CreatedBy) : "System",
      questionoptionId: item.questionOptionId || undefined, // Map questionOptionId from API response
    };

    return mapped;
  }).filter(item => item !== null) as QuestionRow[]; // Remove any null items
}

export async function fetchQuestionsAction(
  params: FetchQuestionsParams = { top: 15, skip: 0 }
): Promise<ApiResponse<{ rows: QuestionRow[]; total: number }>> {
  try {
    // For OData function calls, we need to handle pagination differently
    // First, get all data without pagination parameters since function calls don't support $top/$skip

    const response = await apiHandler(endpoints.getAdminQuestions, { query: "" });

    if (response.error || response.status !== 200) {
      return {
        status: response.status,
        error: true,
        message: response.message || `Failed to fetch questions`,
        errorMessage: response.errorMessage,
      };
    }

    // Your API returns a direct array, so handle it with client-side pagination
    let allItems: ApiQuestionItem[] = [];
    let total = 0;

    if (Array.isArray(response.data)) {
      allItems = response.data;
      total = allItems.length;

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
      const mappedRows = mapToRows(paginatedItems);
      return {
        status: 200,
        message: `Successfully fetched ${mappedRows.length} questions`,
        data: { rows: mappedRows, total }
      };
    } else {
      // Fallback: try to find array data anywhere in the response
      if (response.data && typeof response.data === 'object') {
        const dataKeys = Object.keys(response.data);
        for (const key of dataKeys) {
          const dataAny = response.data as any;
          if (Array.isArray(dataAny[key])) {
            allItems = dataAny[key];
            total = allItems.length;
            break;
          }
        }
      }

      if (allItems.length === 0) {
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
    return {
      status: 500,
      error: true,
      message: "Failed to fetch questions from API",
      errorMessage: error?.message,
    };
  }
}

export async function deleteQuestionAction(question: any): Promise<ApiResponse<null>> {
  try {
    // First delete the question option
    await apiHandler(endpoints.deleteQuestionOption, { questionOptionId: question.questionoptionId });

    // Then immediately delete the question itself
    const res = await apiHandler(endpoints.deleteQuestion, { questionId: question.id });
    return res;
  } catch (error: any) {
    return {
      status: 500,
      error: true,
      message: "Failed to delete question",
      errorMessage: error?.message,
    };
  }
}
