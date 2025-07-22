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

export interface QuestionsMetaRequest {
  testid: number;
}

export interface QuestionsMetaResponse {
  questionId: number;
  status: string;
  questionText: string;
  questionOptionsJson?: string;
  questionType: QuestionType;
}

export interface Subject {
  subjectId: number;
  subjectName: string;
  subjectType: string;
  parentId: number | null;
  language: string | null;
  isActive: number | null;
  createdBy: string | null;
  createdDate: string | null;
  modifiedBy: string | null;
  modifiedDate: string | null;
}

export interface GetQuestionByIdRequest {
  questionId: number;
}

export interface GetQuestionByIdResponse {
  questionId: number;
  questionText: string;
  headerText?: string;
  questionTypeId: number;
  subjectId: number;
  marks: number;
  negativeMarks: number;
  graceMarks: number;
  questionDifficultyLevelId: number;
  additionalExplanation: string;
  videoSolutionWeburl: string;
  videoSolutionMobileurl: string;
  allowCandidateComments: number;
  writeUpId: number | null;
  hasMultipleAnswers: string;
  questionOptionsJson: string;
  userAnswer: any;
  questionCorrectAnswerJson: string;
  language: string;
  isActive: number;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  subject: Subject;
  questionType: QuestionType;
  writeUp: any;
  questionTags: any[];
}

export interface CreateQuestionRequest {
  explanation: string;
  videoSolURL: string;
  questionsMeta: {
    tags: string;
    marks: number;
    negativeMarks: number;
    difficultyLevelId: number;
    questionTypeId: number;
    subjectId: number;
    topicId: number;
    language: string;
    writeUpId?: number | null;
    headerText?: string | null;
  };
  question: string;
  options: {
    options: string;
    answer: string;
  };
}

export interface GetQuestionTypesResponse {
  questionTypeId: number;
  questionType: string;
  language: string;
  isActive: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
}

export interface GetCandidateTestRequest {
  username: string;
  groupId: number;
}

export interface GetCandidateTestResponse {
  testName: string;
  testStartDate: string;
  testEndDate: string;
  testCandidateRegistrationStatus:
    | "Registered"
    | "Completed"
    | "Cancelled"
    | "In Progress"
    | "Missed";
  testId: number;
}

export interface GetCandidateStarredTestRequest {
  username: string;
}

export interface GetCandidateStarredTestResponse {
  testId: number;
  testName: string;
  description: string;
  // testStatus:
  //   | "Registered"
  //   | "Completed"
  //   | "Cancelled"
  //   | "In Progress"
  //   | "Missed";
}

export interface GetCandidateCompletedTestRequest {
  username: string;
}

export interface GetCandidateCompletedTestResponse {
  testId: number;
  testName: string;
  description: string;
  // testStatus:
  //   | "Registered"
  //   | "Completed"
  //   | "Cancelled"
  //   | "In Progress"
  //   | "Missed";
}

export interface GetSpotlightResponse {
  id: number;
  spotlightName: string;
  spotlightNameDescription: string;
  addedDate: string;
  validFrom: string;
  validTo: string;
}

export interface GetSidebarMenusRequest {
  username: string;
}

export interface GetSidebarMenusResponse {
  candidateGroupId: number;
  candidateGroupName: string;
  parentId: number;
  relation: "PARENT" | "SELF";
  level: 0;
}

export interface GetSubjectsResponse {
  subjectId: number;
  subjectName: string;
  subjectType: string;
  parentId: number;
  language: string;
  isActive: number;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
}

export interface GetTopicsRequest {
  subjectId: number;
}

export interface GetTopicsResponse {
  subjectId: number;
  subjectName: string;
}

export interface GetWriteUpsResponse {
  writeUpId: number;
  writeUpName: string;
  writeUp1: string;
  language: string;
  isActive: number;
  createdBy: string;
  createdDate: string;
  modifiedBy: null;
  modifiedDate: string;
  writeuptags: string[];
}

export interface GetLanguagesResponse {
  language: string;
  isActive: number;
}

export interface GetDifficultyLevelsResponse {
  questionDifficultylevelId: number;
  questionDifficultylevel1: string;
  language: string;
  isActive: number;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
}

export interface GetInstructionsRequest {
  language: string;
}

export interface GetInstructionsResponse {
  testInstructionId: number;
  testInstructionName: string;
  testInstruction1: string;
  language: string;
  isActive: number;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
}
