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
  // Optional duration per question (seconds); provided by backend when available
  duration?: number;
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
  explanation: string;
  questionsMeta: {
    allowCandidateComments: number;
    tags: string;
    marks: number;
    negativeMarks: number;
    graceMarks: number;
    difficultyLevelId: number;
    questionTypeId: number;
    questionTypeName: string;
    subjectId: number;
    topicId: number;
    chapterId: number;
    language: string;
  };
  question: string;
  options: {
    options: string;
    answer: string;
  };
}

export interface GetTestMetaDataRequest {
  testId: number;
  testResponseId: number;
}

export interface TestMetaDataInterface {
  testId: number;
  testName: string;
  testDuration: number;
  testStartTime: string;
  testEndTime: string;
  instruction: {
    primaryInstruction: string;
    secondaryInstruction: string;
  };
  testTemplateId?: number;
}

export interface QuestionsMetaDataInterface {
  questionId: number;
  questionText: string;
  questionType: string;
  status: string;
  options: {
    optionText: string;
  }[];
}

export interface SectionsMetaDataInterface {
  sectionId: number;
  sectionName: string;
  minDuration: number;
  maxDuration: number;
  questions: QuestionsMetaDataInterface[];
}

export interface GetTestMetaDataResponse {
  testMeta: TestMetaDataInterface;
  sections: SectionsMetaDataInterface[];
}

export interface CreateQuestionRequest {
  explanation: string;
  videoSolURL?: string;
  videoSolMobileURL?: string;
  // Audit fields (added to allow passing logged in user like Products actions)
  createdBy?: string; // server may derive if omitted
  modifiedBy?: string; // for create we'll mirror createdBy
  // Optional batch identifier for grouping/imports
  batchNo?: string;
  questionsMeta: {
    tags: string;
    marks: number;
    negativeMarks: number;
    graceMarks: number;
    // Duration of the question in seconds (time allotted or reference duration)
    duration: number; // pass 0 if not provided
    difficultyLevelId: number;
    questionTypeId: number;
    chapterId?: number; // included for compatibility with backend payload
    questionTypeName?: string; // optional descriptive name if backend accepts
    subjectId: number;
    topicId: number;
    language: string;
    writeUpId?: number | null;
    headerText?: string | null;
    allowCandidateComments?: number; // 0 | 1
  };
  question: string;
  headerText: string;
  options: {
    options: string;
    answer: string;
  };
  // Question active status (1 = Active, 0 = InActive)
  isActive?: number;
  // Top-level duration for backward compatibility if backend expects it (seconds)
  duration?: number;
  Duration?: number; // PascalCase variant just in case API is case-sensitive on this
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
    | "Missed"
    | "Up Next"; // Virtual grouping for upcoming registered tests
  testId: number;
  // Optional id from registration table if candidate already registered
  testRegistrationId: number;
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

// Starred User Tests (new simplified endpoints)
export interface StarredUserTestCreateRequest {
  testId: number;
  userName: string; // backend expects camelCase userName per spec
}

export interface StarredUserTestDeleteRequest {
  testId: number;
  userName: string;
}

export interface StarredUserTestListRequest {
  username: string; // query param casing ambiguous; we'll send username= for safety
}

export interface StarredUserTestListResponse {
  testId: number;
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
  // Number of days since the spotlight was added (provided by API payload)
  // Some backends may omit this; in that case UI will fallback to a client-side diff.
  addedDay?: number;
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

// Subject CRUD payloads (admin)
export interface CreateSubjectRequest {
  subjectName: string;
  subjectType: string; // Subject | Chapter | Topic | Sub Topic
  parentId: number; // 0 for root subjects
  language: string;
  isActive: number; // 1 active, 0 inactive
}

export interface UpdateSubjectRequest extends CreateSubjectRequest {
  subjectId: number;
}

export interface GetTopicsRequest {
  subjectId: number;
}

export interface GetTopicsResponse {
  topicId: number;
  topicName: string;
  subjectId: number;
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

// Question Options API Types
export interface GetQuestionOptionsRequest {
  // No request parameters needed for getting all questions
}

export interface GetQuestionOptionsResponse {
  questionOptionId: number;
  questionId: number;
  questionText: string;
  additionalExplanation: string;
  videoSolutionWeburl?: string;
  videoSolutionMobileurl?: string;
  writeUpId?: number;
  questionOptionsJson: string;
  questionCorrectAnswerJson: string;
  language: string;
  isActive: number;
  createdBy: string;
  createdDate: string;
  modifiedDate: string;
}

// Admin Tests (OData)
export interface GetTestsODataRequest {
  // Prebuilt OData query string: "$top=...&$skip=...&..."
  query: string;
}

export interface DeleteTestRequest {
  id: number;
}

export interface DeleteQuestionOptionRequest {
  questionOptionId: number;
}

export interface DeleteQuestionRequest {
  questionId: number;
}

// Admin Questions (OData)
export interface GetQuestionsODataRequest {
  // Prebuilt OData query string: "$top=...&$skip=...&..."
  query: string;
}

// Generic OData list wrapper
export type ODataList<T> = {
  value: T[];
  "@odata.count"?: number;
};

// OData entities for Admin Test creation
export interface TestTypeOData {
  TestTypeId: number;
  TestType1: string;
}

export interface TestCategoryOData {
  TestCategoryId: number;
  TestCategoryName: string;
}

export interface TestInstructionOData {
  TestInstructionId: number;
  TestInstructionName: string;
}

export interface TestDifficultyLevelOData {
  TestDifficultyLevelId: number;
  TestDifficultyLevel1: string;
}

// OData entity for Test Templates (Step 1 - Test Template)
export interface TestTemplateOData {
  TestTemplateId: number;
  TestTemplateName: string;
  TestHtmlpreview: string; // relative path under public, e.g., /templates/Bank/Bank.html
  TestTemplateThumbNail: string; // relative path under public, e.g., /templates/Bank/thumb.png
}

export interface GetCompaniesRequest {
  // Prebuilt OData query string: "$top=...&$skip=...&..."
  query: string;
}

export interface DeleteCompanyRequest {
  companyId: number;
}
export interface GetCandidatesRequest {
  query: string;
}

export interface DeleteCandidateRequest {
  candidateId: number;
}

export interface StartSessionRequest {
  testRegistrationId: number;
  userName: string | null;
}

export interface StartSessionResponse {
  testResponseId: number;
}

// The full request your client function will accept
export type SubmitQuestionRequest = {
  testResponseId: number;
  testQuestionId: number;
  responseJson: string;
  status: string;
  comments: string;
  userName: string;
};
export interface SubmitQuestionResponse {}

export interface SubmitTestRequest {
  testResponseId: number;
  userName: string;
}

export interface SubmitTestResponse {
  testResponseId: number;
  testId: number;
  status: string;
  startedAtUtc: string;
  endedAtUtc: string;
  totalQuestions: number;
  answeredCount: number;
  markedForReviewCount: number;
  unansweredCount: number;
}

export interface GetInstructionsByTestIdRequest {
  testId: number;
}

export interface GetInstructionsByTestIdResponse {
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

export interface GetSessionQuestionByIdRequest {
  questionId: number;
  testResponseId: number;
}

export interface GetSessionQuestionByIdResponse {
  questionId: number;
  explanation: string;
  questionsMeta: {
    allowCandidateComments: number;
    tags: string;
    marks: number;
    negativeMarks: number;
    graceMarks: number;
    difficultyLevelId: number;
    questionTypeId: number;
    questionTypeName: string;
    subjectId: number;
    topicId: number;
    chapterId: number;
    language: string;
  };
  question: string;
  options: {
    options: string;
    answer: string;
  };
}

// Published Documents Tree (OData function import)
export interface PublishedDocumentTreeItem {
  folderId: number;
  publishedDocumentFolderName: string;
  path: string; // e.g., "Current Affairs/Subfolder" (if nested)
  level: number; // depth in tree (0 = root folder)
  documentId: number;
  documentName: string;
  documentUrl: string | null; // may be blank or null; build absolute when displaying
  validFrom: string; // ISO
  validTo: string; // ISO
}

export interface AdminDashboardAnallyticsResponse {
  totalcandidates: number;
  totaltest: number;
  totalquestions: number;
  totalattempts: number;
  candidatesGraph: { count: number; monthYear: string }[];
  testsGraph: { count: number; monthYear: string }[];
  questionsGraph: { count: number; monthYear: string }[];
  attemptsGraph: { count: number; monthYear: string }[];
}

export interface AdminDashboardRecentActivitiesResponse {
  activity: string;
  type: "test" | "question" | "candidate";
}
