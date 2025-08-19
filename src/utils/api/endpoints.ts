import {
  CreateQuestionRequest,
  Endpoint,
  GetCandidateStarredTestRequest,
  GetCandidateStarredTestResponse,
  GetCandidateTestRequest,
  GetCandidateTestResponse,
  GetDifficultyLevelsResponse,
  GetLanguagesResponse,
  GetQuestionByIdRequest,
  GetQuestionByIdResponse,
  GetQuestionListRequest,
  GetQuestionListResponse,
  GetQuestionOptionsRequest,
  GetQuestionOptionsResponse,
  GetQuestionTypesResponse,
  GetSidebarMenusRequest,
  GetSidebarMenusResponse,
  GetSpotlightResponse,
  GetSubjectsResponse,
  GetTopicsRequest,
  GetTopicsResponse,
  GetWriteUpsResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  QuestionsMetaRequest,
  QuestionsMetaResponse,
} from "./types";

export const endpoints = {
  loginUser: {
    method: "POST",
    path: () => "/api/auth/login",
    type: "OPEN",
  } as Endpoint<LoginRequest, LoginResponse>,

  logoutUser: {
    method: "POST",
    path: () => "/api/auth/logout",
    type: "CLOSE",
  } as Endpoint<LogoutRequest, null>,

  getQuestions: {
    method: "GET",
    path: ({ testid }) => `/api/Questions?testId=${testid}`,
    type: "CLOSE",
  } as Endpoint<GetQuestionListRequest, GetQuestionListResponse>,

  getQuestionsMeta: {
    method: "GET",
    path: ({ testid }) => `/api/Questions/meta?testid=${testid}`,
    type: "CLOSE",
  } as Endpoint<QuestionsMetaRequest, QuestionsMetaResponse[]>,

  getQuestionById: {
    method: "GET",
    path: ({ questionId }) => `/api/Questions/${questionId}`,
    type: "CLOSE",
  } as Endpoint<GetQuestionByIdRequest, GetQuestionByIdResponse>,

  createQuestion: {
    method: "POST",
    path: () => `/api/Questions`,
    type: "CLOSE",
    } as Endpoint<CreateQuestionRequest, null>,

   createCompany: {
        method: "POST",
        path: () => `/api/Company`,
        type: "CLOSE",
    } as Endpoint<CreateQuestionRequest, null>,

  createCandidate: {
        method: "POST",
        path: () => `/api/CandidateRegistration`,
        type: "CLOSE",
    } as Endpoint<CreateQuestionRequest, null>,

  // Get candidate by id (for edit prefill)
  getCandidateById: {
    method: "GET",
    path: ({ candidateId }: { candidateId: number }) => `/api/CandidateRegistration/${candidateId}`,
    type: "CLOSE",
  } as Endpoint<{ candidateId: number }, any>,

  // Update candidate
  updateCandidate: {
    method: "PUT",
    path: ({ candidateId }: { candidateId: number }) => `/api/CandidateRegistration/${candidateId}`,
    type: "CLOSE",
  } as Endpoint<{ candidateId: number } & any, null>,

  // Update existing question
  updateQuestion: {
    method: "PUT",
    path: ({ questionId }: { questionId: number }) => `/api/Questions/${questionId}`,
    type: "CLOSE",
  } as Endpoint<{ questionId: number } & Partial<CreateQuestionRequest>, null>,

  createQuestionOptions: {
    method: "POST",
    path: () => `/api/questionoptions`,
    type: "CLOSE",
  } as Endpoint<any, null>,

  getQuestionTypes: {
    method: "GET",
    path: () => `/api/QuestionTypes`,
    type: "CLOSE",
  } as Endpoint<null, GetQuestionTypesResponse[]>,

  getCandidateTests: {
    method: "GET",
    path: ({ username, groupId }) =>
      `/api/TestAdminDashboard/candidategroup/tests?username=${username}&groupId=${groupId}`,
    type: "CLOSE",
  } as Endpoint<GetCandidateTestRequest, GetCandidateTestResponse[]>,

  getCandidateStarredTests: {
    method: "GET",
    path: ({ username }) => `/api/Tests/starred/${username}`,
    type: "CLOSE",
  } as Endpoint<
    GetCandidateStarredTestRequest,
    GetCandidateStarredTestResponse[]
  >,

  getCandidateCompletedTests: {
    method: "GET",
    path: ({ username }) => `/api/Tests/completed/${username}`,
    type: "CLOSE",
  } as Endpoint<
    GetCandidateStarredTestRequest,
    GetCandidateStarredTestResponse[]
  >,

  getSpotLight: {
    method: "GET",
    path: () => `/api/Spotlights`,
    type: "CLOSE",
  } as Endpoint<null, GetSpotlightResponse[]>,

  getSidebarMenus: {
    method: "GET",
    path: ({ username }) =>
      `/api/TestAdminDashboard/candidategroup/hierarchy?username=${username}`,
    type: "CLOSE",
  } as Endpoint<GetSidebarMenusRequest, GetSidebarMenusResponse[]>,

  getSubjects: {
    method: "GET",
    path: () => `/api/Subjects`,
    type: "CLOSE",
  } as Endpoint<null, GetSubjectsResponse[]>,

  getTopics: {
    method: "GET",
    path: ({ subjectId }) => `/api/Subjects/${subjectId}/topics`,
    type: "CLOSE",
  } as Endpoint<GetTopicsRequest, GetTopicsResponse[]>,

  getWriteUps: {
    method: "GET",
    path: () => `/api/Writeups`,
    type: "CLOSE",
  } as Endpoint<null, GetWriteUpsResponse[]>,

  // OData - Writeups list for dropdowns
  getWriteUpsOData: {
    method: "GET",
    path: () => `/odata/Writeups?$select=WriteUpId,WriteUpName,Language,IsActive`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<GetWriteUpsResponse>>, 

  getLanguages: {
    method: "GET",
    path: () => `/api/Languages`,
    type: "CLOSE",
  } as Endpoint<null, GetLanguagesResponse[]>,

  getDifficultyLevels: {
    method: "GET",
    path: () => `/api/QuestionDifficultyLevels`,
    type: "CLOSE",
  } as Endpoint<null, GetDifficultyLevelsResponse[]>,

  // OData - Question Difficulty Levels filtered by language
  getQuestionDifficultyLevelsOData: {
    method: "GET",
    path: ({ language }) => {
      // Escape single quotes per OData rules by doubling them
      const lang = (language ?? "").replace(/'/g, "''");
      const base = `/odata/QuestionDifficultyLevels?$select=QuestionDifficultylevelId,QuestionDifficultylevel1,Language,IsActive`;
      const filter = lang ? `&$filter=Language eq '${lang}' and IsActive eq 1` : `&$filter=IsActive eq 1`;
      return `${base}${filter}`;
    },
    type: "OPEN",
  } as Endpoint<{ language?: string }, import('./types').ODataList<GetDifficultyLevelsResponse>>, 


  getQuestionOptions: {
    method: "GET",
    path: () => `/api/QuestionOptions`,
    type: "CLOSE",
  } as Endpoint<GetQuestionOptionsRequest, GetQuestionOptionsResponse[]>,

  // Admin Tests (server actions moved here)
  getAdminTests: {
    method: "GET",
    // query should include leading ?params already: e.g., ?$top=25&$skip=0...
    path: ({ query }) => `/odata/Tests${query ? (query.startsWith('?') ? query : `?${query}`) : ''}`,
    type: "OPEN",
  } as Endpoint<import('./types').GetTestsODataRequest, {
    "@odata.count"?: number;
    value: any[];
  }>,

  deleteAdminTest: {
    method: "DELETE",
    path: ({ id }) => `/api/tests/${id}`,
    type: "CLOSE",
  } as Endpoint<import('./types').DeleteTestRequest, null>,

  deleteQuestionOption: {
    method: "DELETE",
    path: ({ questionOptionId }) => `/api/Questionoptions/${questionOptionId}`,
    type: "CLOSE",
  } as Endpoint<import('./types').DeleteQuestionOptionRequest, null>,

  deleteQuestion: {
    method: "DELETE",
    path: ({ questionId }) => `/api/Questions/${questionId}`,
    type: "CLOSE",
  } as Endpoint<import('./types').DeleteQuestionRequest, null>,

    deleteCompany: {
        method: "DELETE",
        path: ({ companyId }) => `/api/Company/${companyId}`,
        type: "CLOSE",
    } as Endpoint<import('./types').DeleteCompanyRequest, null>,

    deleteCandidate: {
        method: "DELETE",
        path: ({ candidateId }) => `/api/CandidateRegistration/${candidateId}`,
        type: "CLOSE",
    } as Endpoint<import('./types').DeleteCandidateRequest, null>,

  // OData lists for Admin Test creation
  getTestTypes: {
    method: "GET",
  path: () => `/odata/TestTypes?$select=TestTypeId,TestType1`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<import('./types').TestTypeOData>>,

  getTestCategories: {
    method: "GET",
  path: () => `/odata/TestCategories?$select=TestCategoryId,TestCategoryName`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<import('./types').TestCategoryOData>>,

  getTestInstructions: {
    method: "GET",
  path: () => `/odata/TestInstructions?$select=TestInstructionId,TestInstructionName`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<import('./types').TestInstructionOData>>,

  getTestDifficultyLevelsOData: {
    method: "GET",
  path: () => `/odata/TestDifficultyLevels?$select=TestDifficultyLevelId,TestDifficultyLevel1`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<import('./types').TestDifficultyLevelOData>>,

  // Admin Questions (server actions moved here)
  getAdminQuestions: {
    method: "GET",
    // Use your specific API endpoint for getting questions by language
    path: ({ query }) => `/odata/Questions/GetAllQuestionsByLanguage(language=English)${query ? (query.startsWith('?') ? query : `?${query}`) : ''}`,
    type: "OPEN",
    } as Endpoint<import('./types').GetQuestionsODataRequest, any[]>,

    // Admin Questions (server actions moved here)
    getCompanies: {
        method: "GET",
    // Companies list
    // Removed stray trailing quote which broke URL and caused empty dropdown.
    path: ({ query }) => {
      const base = `/api/Company?IncludeInactive=true&Language=English`;
      if (query && query.trim().length > 0) {
        return `${base}&${query}`;
      }
      return base;
    },
        type: "OPEN",
    } as Endpoint<import('./types').GetCompaniesRequest, any[]>,

  // Candidate groups hierarchy (placeholder – adjust path to actual API if different)
  getCandidateGroups: {
    method: "GET",
    path: () => `/api/TestAdminDashboard/candidategroup/hierarchy`,
    type: "CLOSE",
  } as Endpoint<null, any[]>,

    getCandidates: {
        method: "GET",
        // Use your specific API endpoint for getting questions by language
    // Candidate list (supports OData style query string already pre-built in caller)
    // NOTE: Removed stray trailing single quote which broke the URL and caused validation errors.
    // If a query string (e.g. "$top=15&$skip=0") is supplied, append with an ampersand.
    path: ({ query }) => {
      const base = `/api/CandidateRegistration?includeInactive=true`;
      if (query && query.trim().length > 0) {
        return `${base}&${query}`;
      }
      return base;
    },
        type: "OPEN",
    } as Endpoint<import('./types').GetCandidatesRequest, any[]>,

};
