export interface ApiResponse<T> {
  status: number;
  error?: boolean;
  message?: string;
  errorMessage?: string;
  data?: T;
}

export type Endpoint<Request, Response> = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: (params: Request) => string;
  type: "OPEN" | "CLOSE";
};

//   Define request and response types for api endpoints below

// User Login
export interface LoginRequest {
  Username: string;
  Password: string;
}

export interface LoginResponse {
  token: string;
}

export interface LogoutRequest {
  Username: string;
}

export interface GetQuestionListRequest {
  testid: number;
}

export interface GetQuestionListResponse {
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  questionStatus:
    | "Not Visited"
    | "Attempted"
    | "UnAttempted"
    | "To Review"
    | "Answered To Review";
  marks: number;
  negativeMarks: number;
  questionSectionId: number;
  options: string;
  userAnswer: string;
}

export interface QuestionType {
  questionTypeId: number;
  questionType: string;
}
