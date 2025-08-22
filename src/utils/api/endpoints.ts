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

  // Student Dashboard consolidated tests (absolute OData endpoint)
  getStudentDashboardTests: {
    method: "GET",
    // OData function import style endpoint returning tests grouped by status for a candidate
    path: ({ username }: { username: string }) => `http://localhost:5000/odata/Tests/StudentDashboard(username=${encodeURIComponent(username)})`,
    type: "CLOSE",
  } as Endpoint<{ username: string }, GetCandidateTestResponse[]>,

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
    path: () => `/Odata/Writeups?$select=WriteUpId,WriteUpName,Language,IsActive`,
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
      const base = `/Odata/QuestionDifficultyLevels?$select=QuestionDifficultylevelId,QuestionDifficultylevel1,Language,IsActive`;
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
    path: ({ query }) => `/Odata/Tests${query ? (query.startsWith('?') ? query : `?${query}`) : ''}`,
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

  // Test model for binding (New/Edit shared model)
  getNewTestModel: {
    method: "GET",
    path: () => `/api/Tests/New`,
    type: "CLOSE",
  } as Endpoint<null, any>,

  // OData lists for Admin Test creation
  getTestTypes: {
    method: "GET",
    path: () => `/Odata/TestTypes?$select=TestTypeId,TestType1`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<import('./types').TestTypeOData>>,

  getTestCategories: {
    method: "GET",
    path: () => `/Odata/TestCategories?$select=TestCategoryId,TestCategoryName`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<import('./types').TestCategoryOData>>,

  getTestInstructions: {
    method: "GET",
    path: () => `/Odata/TestInstructions?$select=TestInstructionId,TestInstructionName`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<import('./types').TestInstructionOData>>,

  getTestDifficultyLevelsOData: {
    method: "GET",
    path: () => `/Odata/TestDifficultyLevels?$select=TestDifficultyLevelId,TestDifficultyLevel1`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<import('./types').TestDifficultyLevelOData>>,

  // OData - Test Templates for Step 1 template picker
  getTestTemplatesOData: {
    method: "GET",
    path: () => `/Odata/TestTemplates?$select=TestTemplateId,TestTemplateName,TestHtmlpreview,TestTemplateThumbNail`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<import('./types').TestTemplateOData>>,

  // Select Questions page endpoints
  getLanguagesOData: {
    method: "GET",
    path: () => `/Odata/Languages?$select=Language1`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<{ Language1: string }>>,

  getSubjectsByLanguageOData: {
    method: "GET",
    path: ({ language }) => {
      const lang = (language ?? "").replace(/'/g, "''");
      return `/Odata/Subjects?$filter=Language eq '${lang}' and ParentId eq 0&$select=SubjectId,SubjectName`;
    },
    type: "OPEN",
  } as Endpoint<{ language?: string }, import('./types').ODataList<{ SubjectId: number; SubjectName: string }>>,

  getQuestionTypesOData: {
    method: "GET",
    path: ({ language }) => {
      const lang = (language ?? "").replace(/'/g, "''");
      return `/Odata/QuestionTypes?$filter=Language eq '${lang}'&$select=QuestionTypeId,QuestionType1`;
    },
    type: "OPEN",
  } as Endpoint<{ language?: string }, import('./types').ODataList<{ QuestionTypeId: number; QuestionType1: string }>>,

  getSubjectTree: {
    method: "GET",
    path: ({ parentId }) => `/Odata/Subjects/GetSubjectTree(ParentId=${parentId})`,
    type: "OPEN",
  } as Endpoint<{ parentId: number }, any[]>,

  getQuestionsByQuery: {
    method: "GET",
    path: ({ query }) => `/Odata/Questions${query}`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, { value: any[] }>,

  // OData - Filtered Questions with pagination and expands, using SubjectId list
  getQuestionsFilteredOData: {
    method: "GET",
    path: ({ language, subjectIds, questionTypeId, difficultyId, top = 15, skip = 0 }) => {
      const lang = (language ?? "").replace(/'/g, "''");
      const parts: string[] = [
        "IsActive eq 1",
        `Language eq '${lang}'`,
      ];
      const idsArr = (Array.isArray(subjectIds) ? subjectIds : []).filter((n) => Number.isFinite(n));
      if (idsArr.length === 1) {
        parts.push(`SubjectId eq ${idsArr[0]}`);
      } else if (idsArr.length > 1) {
        parts.push(`(${idsArr.map((n) => `SubjectId eq ${n}`).join(" or ")})`);
      }
      if (questionTypeId) parts.push(`QuestionTypeId eq ${questionTypeId}`);
      if (difficultyId) parts.push(`QuestionDifficultyLevelId eq ${difficultyId}`);
      const filter = encodeURIComponent(parts.join(" and "));
      // Encode $expand value so inner $select is represented as %24select (matches working browser URL)
      const expand = encodeURIComponent("Questionoptions($select=QuestionText),Questiondifficultylevel($select=QuestionDifficultylevel1)");
      const select = encodeURIComponent("QuestionId,Marks,NegativeMarks,GraceMarks,Language,SubjectId,QuestionTypeId,QuestionDifficultyLevelId");
      return `/api/odata/Questions?$count=true&$top=${top}&$skip=${skip}&$filter=${filter}&$expand=${expand}&$select=${select}`;
    },
    type: "OPEN",
  } as Endpoint<{
    language: string;
    subjectIds: number[];
    questionTypeId: number;
    difficultyId?: number;
    top?: number;
    skip?: number;
  }, {
    "@odata.count"?: number;
    value: any[];
  }>,

  // Admin Questions (server actions moved here)
  getAdminQuestions: {
    method: "GET",
    // Use your specific API endpoint for getting questions by language
    path: ({ query }) => `/Odata/Questions/GetAllQuestionsByLanguage(language=English)${query ? (query.startsWith('?') ? query : `?${query}`) : ''}`,
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

  // Products CRUD
  getProducts: {
    method: "GET",
    // For now mimic candidates pattern (include inactive, filterable by language if needed later)
    path: ({ query }) => {
      const base = `/api/TestProducts`;
      if (query && query.trim().length > 0) {
        return `${base}?${query}`;
      }
      return base;
    },
    type: "OPEN",
  } as Endpoint<{ query?: string }, any[]>,

  // OData - Test Sections (for Step 3 bulk assignment)
  getTestSectionsOData: {
    method: "GET",
    path: () => `/Odata/TestSections?$select=TestSectionId,TestSectionName`,
    type: "OPEN",
  } as Endpoint<null, import('./types').ODataList<{ TestSectionId: number; TestSectionName: string }>>,
  getProductById: {
    method: "GET",
    path: ({ productId }: { productId: number }) => `/api/TestProducts/${productId}`,
    type: "OPEN",
  } as Endpoint<{ productId: number }, any>,
  createProduct: {
    method: "POST",
    path: () => `/api/TestProducts`,
    type: "CLOSE",
  } as Endpoint<any, any>,
  updateProduct: {
    method: "PUT",
    path: ({ productId }: { productId: number }) => `/api/TestProducts/${productId}`,
    type: "CLOSE",
  } as Endpoint<{ productId: number } & any, any>,
  deleteProduct: {
    method: "DELETE",
    path: ({ productId }: { productId: number }) => `/api/TestProducts/${productId}`,
    type: "CLOSE",
  } as Endpoint<{ productId: number }, null>,

  // Candidate registers for a test
  registerTest: {
    method: "POST",
    path: () => `/api/TestRegistrations`,
    type: "OPEN",
  } as Endpoint<any, any>,

};
