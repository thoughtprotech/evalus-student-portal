import {
  AdminDashboardAnallyticsRequest,
  AdminDashboardAnallyticsResponse,
  AdminDashboardRecentActivitiesResponse,
  AdminDashboardReportDataRequest,
  AdminDashboardReportDataResponse,
  AdminDashboardTestPerformanceSummaryRequest,
  AdminDashboardTestPerformanceSummaryResponse,
  CandidateAnalyticsDetailsRequest,
  CandidateAnalyticsDetailsResponse,
  CandidateAnalyticsReportHeaderRequest,
  CandidateAnalyticsReportHeaderResponse,
  CandidateAnalyticsReportSectionRequest,
  CandidateAnalyticsReportSectionResponse,
  CandidateAnalyticsSummaryRequest,
  CandidateAnalyticsSummaryResponse,
  CreateQuestionRequest,
  Endpoint,
  GetAdminDashboardTestCandidatePerformanceSummaryRequest,
  GetAdminDashboardTestCandidatePerformanceSummaryResponse,
  GetAdminDashboardTestStatusSummaryRequest,
  GetAdminDashboardTestStatusSummaryResponse,
  GetCandidateGroupsInorderRequest,
  GetCandidateGroupsInorderResponse,
  GetCandidateStarredTestRequest,
  GetCandidateStarredTestResponse,
  GetCandidateTestRequest,
  GetCandidateTestResponse,
  GetDifficultyLevelsResponse,
  GetInstructionsByTestIdRequest,
  GetInstructionsByTestIdResponse,
  GetLanguagesResponse,
  GetQuestionByIdRequest,
  GetQuestionByIdResponse,
  GetQuestionListRequest,
  GetQuestionListResponse,
  GetQuestionOptionsRequest,
  GetQuestionOptionsResponse,
  GetQuestionTypesResponse,
  GetReportsAuditSummaryRequest,
  GetReportsAuditSummaryResponse,
  GetReportsTestQuestionsPerformanceSummaryRequest,
  GetReportsTestQuestionsPerformanceSummaryResponse,
  GetSessionQuestionByIdRequest,
  GetSessionQuestionByIdResponse,
  GetSidebarMenusRequest,
  GetSidebarMenusResponse,
  GetSpotlightResponse,
  GetSubjectsResponse,
  GetTestMetaDataRequest,
  GetTestMetaDataResponse,
  GetTopicsRequest,
  GetTopicsResponse,
  GetWriteUpsResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  QuestionsMetaRequest,
  QuestionsMetaResponse,
  StartSessionRequest,
  StartSessionResponse,
  SubmitQuestionRequest,
  SubmitQuestionResponse,
  SubmitTestRequest,
  SubmitTestResponse,
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
    path: ({ candidateId }: { candidateId: number }) =>
      `/api/CandidateRegistration/${candidateId}`,
    type: "CLOSE",
  } as Endpoint<{ candidateId: number }, any>,

  // Update candidate
  updateCandidate: {
    method: "PUT",
    path: ({ candidateId }: { candidateId: number }) =>
      `/api/CandidateRegistration/${candidateId}`,
    type: "CLOSE",
  } as Endpoint<{ candidateId: number } & any, null>,

  // Delete candidate
  deleteCandidate: {
    method: "DELETE",
    path: ({ candidateId }: { candidateId: number }) =>
      `/api/CandidateRegistration/${candidateId}`,
    type: "CLOSE",
  } as Endpoint<{ candidateId: number }, null>,

  // Update existing question
  updateQuestion: {
    method: "PUT",
    path: ({ questionId }: { questionId: number }) =>
      `/api/Questions/${questionId}`,
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
    path: ({ username }: { username: string }) =>
      `/Odata/Tests/StudentDashboard(username=${encodeURIComponent(username)})`,

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

  // Raw Starred User Tests endpoints (simple CRUD) - used for toggle actions
  createStarredUserTest: {
    method: "POST",
    path: () => `/api/StarredUserTests`,
    type: "CLOSE",
  } as Endpoint<import("./types").StarredUserTestCreateRequest, null>,

  deleteStarredUserTest: {
    method: "DELETE",
    path: ({
      testId,
      userName,
    }: import("./types").StarredUserTestDeleteRequest) =>
      `/api/StarredUserTests/${testId}/${encodeURIComponent(userName)}`,
    type: "CLOSE",
  } as Endpoint<import("./types").StarredUserTestDeleteRequest, null>,

  listStarredUserTests: {
    method: "GET",
    path: ({ username }: import("./types").StarredUserTestListRequest) =>
      `/api/StarredUserTests?username=${encodeURIComponent(username)}`,
    type: "CLOSE",
  } as Endpoint<
    import("./types").StarredUserTestListRequest,
    import("./types").StarredUserTestListResponse[]
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
  // OData Spotlights listing (for grid filtering/sorting/paging)
  getSpotlightsOData: {
    method: "GET",
    path: ({ query }: { query?: string }) =>
      `/Odata/Spotlights${
        query ? (query.startsWith("?") ? query : `?${query}`) : ""
      }`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, { "@odata.count"?: number; value: any[] }>,
  createSpotlight: {
    method: "POST",
    path: () => `/api/Spotlights`,
    type: "CLOSE",
  } as Endpoint<
    {
      id: number;
      spotlightName: string;
      spotlightNameDescription: string;
      addedDate: string;
      validFrom: string;
      validTo: string;
      addedDay?: number;
    },
    null
  >,
  updateSpotlight: {
    method: "PUT",
    path: ({ id }: { id: number }) => `/api/Spotlights/${id}`,
    type: "CLOSE",
  } as Endpoint<
    { id: number } & {
      spotlightName: string;
      spotlightNameDescription: string;
      addedDate: string;
      validFrom: string;
      validTo: string;
      addedDay?: number;
    },
    null
  >,
  getSpotlightById: {
    method: "GET",
    path: ({ id }: { id: number }) => `/api/Spotlights/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, GetSpotlightResponse>,
  deleteSpotlight: {
    method: "DELETE",
    path: ({ id }: { id: number }) => `/api/Spotlights/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, null>,

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

  createSubject: {
    method: "POST",
    path: () => `/api/Subjects`,
    type: "CLOSE",
  } as Endpoint<import("./types").CreateSubjectRequest, null>,

  updateSubject: {
    method: "PUT",
    path: ({ subjectId }: { subjectId: number }) =>
      `/api/Subjects/${subjectId}`,
    type: "CLOSE",
  } as Endpoint<import("./types").UpdateSubjectRequest, null>,

  deleteSubject: {
    method: "DELETE",
    path: ({ subjectId }: { subjectId: number }) =>
      `/api/Subjects/${subjectId}`,
    type: "CLOSE",
  } as Endpoint<{ subjectId: number }, null>,

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
    path: () =>
      `/Odata/Writeups?$select=WriteUpId,WriteUpName,Language,IsActive`,
    type: "OPEN",
  } as Endpoint<null, import("./types").ODataList<GetWriteUpsResponse>>,

  // Admin WriteUps full OData listing (supports dynamic query string like Test Instructions)
  getAdminWriteUps: {
    method: "GET",
    path: ({ query }) =>
      `/Odata/Writeups${
        query ? (query.startsWith("?") ? query : `?${query}`) : ""
      }`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, { "@odata.count"?: number; value: any[] }>,

  // WriteUps CRUD
  createWriteUp: {
    method: "POST",
    path: () => `/api/Writeups`,
    type: "CLOSE",
  } as Endpoint<any, any>,
  updateWriteUp: {
    method: "PUT",
    path: ({ id }: { id: number }) => `/api/Writeups/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number } & any, any>,
  getWriteUpById: {
    method: "GET",
    path: ({ id }: { id: number }) => `/api/Writeups/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, any>,
  deleteWriteUp: {
    method: "DELETE",
    path: ({ id }: { id: number }) => `/api/Writeups/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, null>,

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

  // CRUD for Question Difficulty Levels
  createQuestionDifficultyLevel: {
    method: "POST",
    path: () => `/api/QuestionDifficultyLevels`,
    type: "CLOSE",
  } as Endpoint<Partial<GetDifficultyLevelsResponse>, any>,

  updateQuestionDifficultyLevel: {
    method: "PUT",
    path: ({
      questionDifficultylevelId,
    }: {
      questionDifficultylevelId: number;
    }) => `/api/QuestionDifficultyLevels/${questionDifficultylevelId}`,
    type: "CLOSE",
  } as Endpoint<
    {
      questionDifficultylevelId: number;
    } & Partial<GetDifficultyLevelsResponse>,
    any
  >,

  deleteQuestionDifficultyLevel: {
    method: "DELETE",
    path: ({
      questionDifficultylevelId,
    }: {
      questionDifficultylevelId: number;
    }) => `/api/QuestionDifficultyLevels/${questionDifficultylevelId}`,
    type: "CLOSE",
  } as Endpoint<{ questionDifficultylevelId: number }, null>,

  getQuestionDifficultyLevelById: {
    method: "GET",
    path: ({
      questionDifficultylevelId,
    }: {
      questionDifficultylevelId: number;
    }) => `/api/QuestionDifficultyLevels/${questionDifficultylevelId}`,
    type: "CLOSE",
  } as Endpoint<
    { questionDifficultylevelId: number },
    GetDifficultyLevelsResponse
  >,

  // OData - Question Difficulty Levels filtered by language
  getQuestionDifficultyLevelsOData: {
    method: "GET",
    path: ({ language }) => {
      // Escape single quotes per OData rules by doubling them
      const lang = (language ?? "").replace(/'/g, "''");
      const base = `/Odata/QuestionDifficultyLevels?$select=QuestionDifficultylevelId,QuestionDifficultylevel1,Language,IsActive`;
      const filter = lang
        ? `&$filter=Language eq '${lang}' and IsActive eq 1`
        : `&$filter=IsActive eq 1`;
      return `${base}${filter}`;
    },
    type: "OPEN",
  } as Endpoint<
    { language?: string },
    import("./types").ODataList<GetDifficultyLevelsResponse>
  >,

  getQuestionOptions: {
    method: "GET",
    path: () => `/api/QuestionOptions`,
    type: "CLOSE",
  } as Endpoint<GetQuestionOptionsRequest, GetQuestionOptionsResponse[]>,

  // Admin Tests (server actions moved here)
  getAdminTests: {
    method: "GET",
    // query should include leading ?params already: e.g., ?$top=25&$skip=0...
    path: ({ query }) => {
      const q = query ? (query.startsWith("?") ? query : `?${query}`) : "";
      const hasOrder =
        typeof q === "string" &&
        (/\$orderby=/i.test(q) || /%24orderby=/i.test(q));
      const orderClause = "$orderby=CreatedDate desc";
      const suffix = hasOrder ? "" : q ? `&${orderClause}` : `?${orderClause}`;
      return `/Odata/Tests${q}${suffix}`;
    },
    type: "OPEN",
    disableCache: true,
  } as Endpoint<
    import("./types").GetTestsODataRequest,
    {
      "@odata.count"?: number;
      value: any[];
    }
  >,

  deleteAdminTest: {
    method: "DELETE",
    path: ({ id }) => `/api/tests/${id}`,
    type: "CLOSE",
  } as Endpoint<import("./types").DeleteTestRequest, null>,

  deleteQuestionOption: {
    method: "DELETE",
    path: ({ questionOptionId }) => `/api/Questionoptions/${questionOptionId}`,
    type: "CLOSE",
  } as Endpoint<import("./types").DeleteQuestionOptionRequest, null>,

  deleteQuestion: {
    method: "DELETE",
    path: ({ questionId }) => `/api/Questions/${questionId}`,
    type: "CLOSE",
  } as Endpoint<import("./types").DeleteQuestionRequest, null>,

  // Test model for binding (New/Edit shared model)
  getNewTestModel: {
    method: "GET",
    path: () => `/api/Tests/New`,
    type: "CLOSE",
  } as Endpoint<null, any>,

  // Create Test (Step 5 Save)
  createTest: {
    method: "POST",
    path: () => `/api/Tests`,
    type: "CLOSE",
  } as Endpoint<any, any>,

  // Update Test (Edit Save)
  updateTest: {
    method: "PUT",
    path: ({ id }: { id: number | string }) => `/api/Tests/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number | string } & any, any>,

  // Publish Test (Admin)
  publishTest: {
    method: "POST",
    path: ({ id }: { id: number | string }) => `/api/Tests/${id}/publish`,
    type: "CLOSE",
  } as Endpoint<{ id: number | string }, any>,

  // Get Test by Id (Edit mode prefill)
  getTestById: {
    method: "GET",
    path: ({ id }: { id: number | string }) => `/api/Tests/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number | string }, any>,

  // OData lists for Admin Test creation
  getTestTypes: {
    method: "GET",
    path: () => `/Odata/TestTypes?$select=TestTypeId,TestType1`,
    type: "OPEN",
  } as Endpoint<
    null,
    import("./types").ODataList<import("./types").TestTypeOData>
  >,

  // Admin Test Types full OData listing (grid with paging/filter/sort)
  getAdminTestTypes: {
    method: "GET",
    path: ({ query }: { query?: string }) =>
      `/Odata/TestTypes${
        query ? (query.startsWith("?") ? query : `?${query}`) : ""
      }`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, { "@odata.count"?: number; value: any[] }>,
  // Test Types CRUD
  createTestType: {
    method: "POST",
    path: () => `/api/TestTypes`,
    type: "CLOSE",
  } as Endpoint<
    {
      testTypeId: number;
      testType1: string;
      language: string;
      isActive: number;
      createdBy?: string;
      createdDate?: string;
      modifiedBy?: string;
      modifiedDate?: string;
    },
    null
  >,
  updateTestType: {
    method: "PUT",
    path: ({ id }: { id: number }) => `/api/TestTypes/${id}`,
    type: "CLOSE",
  } as Endpoint<
    { id: number } & {
      testTypeId: number;
      testType1: string;
      language: string;
      isActive: number;
      createdBy?: string;
      createdDate?: string;
      modifiedBy?: string;
      modifiedDate?: string;
    },
    null
  >,
  getTestTypeById: {
    method: "GET",
    path: ({ id }: { id: number }) => `/api/TestTypes/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, any>,
  deleteTestType: {
    method: "DELETE",
    path: ({ id }: { id: number }) => `/api/TestTypes/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, null>,

  getTestCategories: {
    method: "GET",
    path: () => `/Odata/TestCategories?$select=TestCategoryId,TestCategoryName`,
    type: "OPEN",
  } as Endpoint<
    null,
    import("./types").ODataList<import("./types").TestCategoryOData>
  >,

  // Admin Test Categories full OData listing (tree + paging/filter/sort)
  getAdminTestCategories: {
    method: "GET",
    path: ({ query }: { query?: string }) =>
      `/Odata/TestCategories${
        query ? (query.startsWith("?") ? query : `?${query}`) : ""
      }`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, { "@odata.count"?: number; value: any[] }>,

  // Test Categories CRUD
  createTestCategory: {
    method: "POST",
    path: () => `/api/TestCategories`,
    type: "CLOSE",
  } as Endpoint<
    {
      testCategoryId: number;
      testCategoryName: string;
      testCategoryType: string;
      parentId: number;
      language: string;
      isActive: number;
      createdBy?: string;
      createdDate?: string;
      modifiedBy?: string;
      modifiedDate?: string;
    },
    null
  >,
  updateTestCategory: {
    method: "PUT",
    // Use body.testCategoryId to form the path so we don't need an extra 'id' key in JSON body
    path: ({ testCategoryId }: { testCategoryId: number }) =>
      `/api/TestCategories/${testCategoryId}`,
    type: "CLOSE",
  } as Endpoint<
    {
      testCategoryId: number;
      testCategoryName: string;
      testCategoryType: string;
      parentId: number;
      language: string;
      isActive: number;
      createdBy?: string;
      createdDate?: string;
      modifiedBy?: string;
      modifiedDate?: string;
    },
    null
  >,
  getTestCategoryById: {
    method: "GET",
    path: ({ id }: { id: number }) => `/api/TestCategories/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, any>,
  deleteTestCategory: {
    method: "DELETE",
    path: ({ id }: { id: number }) => `/api/TestCategories/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, null>,

  // OData - Category Tree (function import)
  // Returns hierarchical category data (no params required)
  getTestCategoryTree: {
    method: "GET",
    path: () => `/Odata/TestCategories/GetTestCategoryTree`,
    type: "OPEN",
  } as Endpoint<null, any[]>,

  getTestInstructions: {
    method: "GET",
    path: () =>
      `/Odata/TestInstructions?$select=TestInstructionId,TestInstructionName`,
    type: "OPEN",
  } as Endpoint<
    null,
    import("./types").ODataList<import("./types").TestInstructionOData>
  >,
  // Admin Test Instructions full OData listing (supports dynamic query string built in action)
  getAdminTestInstructions: {
    method: "GET",
    path: ({ query }) =>
      `/Odata/TestInstructions${
        query ? (query.startsWith("?") ? query : `?${query}`) : ""
      }`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, { "@odata.count"?: number; value: any[] }>,

  // Test Instructions CRUD (assumed REST endpoints similar to other entities)
  createTestInstruction: {
    method: "POST",
    path: () => `/api/TestInstructions`,
    type: "CLOSE",
  } as Endpoint<any, any>,
  updateTestInstruction: {
    method: "PUT",
    path: ({ id }: { id: number }) => `/api/TestInstructions/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number } & any, any>,
  getTestInstructionById: {
    method: "GET",
    path: ({ id }: { id: number }) => `/api/TestInstructions/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, any>,
  deleteTestInstruction: {
    method: "DELETE",
    path: ({ id }: { id: number }) => `/api/TestInstructions/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, null>,

  getTestDifficultyLevelsOData: {
    method: "GET",
    path: () =>
      `/Odata/TestDifficultyLevels?$select=TestDifficultyLevelId,TestDifficultyLevel1`,
    type: "OPEN",
  } as Endpoint<
    null,
    import("./types").ODataList<import("./types").TestDifficultyLevelOData>
  >,

  // CRUD for Test Difficulty Levels
  createTestDifficultyLevel: {
    method: "POST",
    path: () => `/api/TestDifficultyLevels`,
    type: "CLOSE",
  } as Endpoint<any, any>,

  updateTestDifficultyLevel: {
    method: "PUT",
    path: ({ id }: { id: number }) => `/api/TestDifficultyLevels/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number } & any, any>,

  getTestDifficultyLevelById: {
    method: "GET",
    path: ({ id }: { id: number }) => `/api/TestDifficultyLevels/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, any>,

  deleteTestDifficultyLevel: {
    method: "DELETE",
    path: ({ id }: { id: number }) => `/api/TestDifficultyLevels/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, null>,

  // OData - Test Templates for Step 1 template picker
  getTestTemplatesOData: {
    method: "GET",
    path: () =>
      `/api/odata/TestTemplates?$filter=IsActive eq 1&$select=TestTemplateId,TestTemplateName,TestHtmlpreview,TestTemplateThumbNail`,
    type: "OPEN",
  } as Endpoint<
    null,
    import("./types").ODataList<import("./types").TestTemplateOData>
  >,

  // Select Questions page endpoints
  getLanguagesOData: {
    method: "GET",
    path: () => `/api/odata/Languages?$select=Language1`,
    type: "OPEN",
  } as Endpoint<null, import("./types").ODataList<{ Language1: string }>>,

  getSubjectsByLanguageOData: {
    method: "GET",
    path: ({ language }) => {
      const lang = (language ?? "").replace(/'/g, "''");
      return `/Odata/Subjects?$filter=Language eq '${lang}' and ParentId eq 0&$select=SubjectId,SubjectName`;
    },
    type: "OPEN",
  } as Endpoint<
    { language?: string },
    import("./types").ODataList<{ SubjectId: number; SubjectName: string }>
  >,

  getQuestionTypesOData: {
    method: "GET",
    path: ({ language }) => {
      const lang = (language ?? "").replace(/'/g, "''");
      return `/Odata/QuestionTypes?$filter=Language eq '${lang}'&$select=QuestionTypeId,QuestionType1`;
    },
    type: "OPEN",
  } as Endpoint<
    { language?: string },
    import("./types").ODataList<{
      QuestionTypeId: number;
      QuestionType1: string;
    }>
  >,

  getSubjectTree: {
    method: "GET",
    path: ({ parentId }) =>
      `/Odata/Subjects/GetSubjectTree(ParentId=${parentId})`,
    type: "OPEN",
  } as Endpoint<{ parentId: number }, any[]>,

  // Generic Subjects OData listing with dynamic query (server-side filtering/pagination)
  listSubjectsOData: {
    method: "GET",
    path: ({ query }) => `/Odata/Subjects${query || ""}`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, { "@odata.count"?: number; value: any[] }>,

  // OData - Candidate Group Tree for Step 5 Assign
  getCandidateGroupTreeOData: {
    method: "GET",
    path: () => `/api/odata/CandidateGroups/GetCandidateGroupTree`,
    type: "OPEN",
  } as Endpoint<null, any[]>,

  // Admin Candidate Groups OData list (supports dynamic query)
  listCandidateGroupsOData: {
    method: "GET",
    path: ({ query }) =>
      `/api/odata/CandidateGroups${
        query ? (query.startsWith("?") ? query : `?${query}`) : ""
      }`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, { "@odata.count"?: number; value: any[] }>,

  // Public OData path (no /api prefix) for Candidate Groups
  listCandidateGroupsODataOpen: {
    method: "GET",
    path: ({ query }) => {
      let q = query || "";
      // ensure leading ? when any query is present
      if (q && !q.startsWith("?")) q = `?${q}`;
      // add default filter when none provided
      const hasFilter = /\$filter=/i.test(q);
      if (!hasFilter) {
        if (!q) q = "?$filter=ParentId eq 0";
        else q = `${q}&$filter=ParentId eq 0`;
      }
      return `/odata/CandidateGroups${q}`;
    },
    type: "OPEN",
  } as Endpoint<{ query?: string }, { "@odata.count"?: number; value: any[] }>,

  // Candidate Groups CRUD
  createCandidateGroup: {
    method: "POST",
    path: () => `/api/CandidateGroup`,
    type: "CLOSE",
  } as Endpoint<any, any>,
  updateCandidateGroup: {
    method: "PUT",
    path: ({ id }: { id: number }) => `/api/CandidateGroup/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number } & any, any>,
  deleteCandidateGroup: {
    method: "DELETE",
    path: ({ id }: { id: number }) => `/api/CandidateGroup/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, null>,

  getQuestionsByQuery: {
    method: "GET",
    path: ({ query }) => `/Odata/Questions${query}`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, { value: any[] }>,

  // OData - Filtered Questions with pagination and expands, using SubjectId list
  getQuestionsFilteredOData: {
    method: "GET",
    path: ({
      language,
      subjectIds,
      questionTypeId,
      difficultyId,
      tags,
      top = 15,
      skip = 0,
    }) => {
      const lang = (language ?? "").replace(/'/g, "''");
      const parts: string[] = ["IsActive eq 1", `Language eq '${lang}'`];
      const idsArr = (Array.isArray(subjectIds) ? subjectIds : []).filter((n) =>
        Number.isFinite(n)
      );
      if (idsArr.length === 1) {
        parts.push(`SubjectId eq ${idsArr[0]}`);
      } else if (idsArr.length > 1) {
        parts.push(`(${idsArr.map((n) => `SubjectId eq ${n}`).join(" or ")})`);
      }
      if (questionTypeId) parts.push(`QuestionTypeId eq ${questionTypeId}`);
      if (difficultyId)
        parts.push(`QuestionDifficultyLevelId eq ${difficultyId}`);
      // Optional tags filter (matches any of the selected tags)
      if (Array.isArray(tags) && tags.length > 0) {
        const tagConds = tags
          .filter((t) => typeof t === "string" && t.trim().length > 0)
          .map(
            (t) => `contains(QuestionTags,'${String(t).replace(/'/g, "''")}')`
          );
        if (tagConds.length > 0) parts.push(`(${tagConds.join(" or ")})`);
      }
      const filter = encodeURIComponent(parts.join(" and "));
      // Encode $expand value so inner $select is represented as %24select (matches working browser URL)
      const expand = encodeURIComponent(
        "Questionoptions($select=QuestionText),Questiondifficultylevel($select=QuestionDifficultylevel1)"
      );
      const select = encodeURIComponent(
        "QuestionId,Marks,NegativeMarks,GraceMarks,Language,SubjectId,QuestionTypeId,QuestionDifficultyLevelId"
      );
      return `/api/odata/Questions?$count=true&$top=${top}&$skip=${skip}&$filter=${filter}&$expand=${expand}&$select=${select}`;
    },
    type: "OPEN",
  } as Endpoint<
    {
      language: string;
      subjectIds: number[];
      questionTypeId: number;
      difficultyId?: number;
      tags?: string[];
      top?: number;
      skip?: number;
    },
    {
      "@odata.count"?: number;
      value: any[];
    }
  >,

  // OData - Distinct Batch Numbers for filter
  getDistinctBatchNumbersOData: {
    method: "GET",
    path: () => `/api/odata/Questions/GetDistinctBatchNumbers`,
    type: "OPEN",
  } as Endpoint<null, import("./types").ODataList<any>>,

  // OData - Distinct Question Tags for filter
  getDistinctQuestionTagsOData: {
    method: "GET",
    path: () => `/api/odata/QuestionTags/GetDistinctQuestionTags`,
    type: "OPEN",
  } as Endpoint<null, import("./types").ODataList<any>>,

  // OData - Questions by Batch Number with pagination
  getQuestionsByBatchNumberOData: {
    method: "GET",
    path: ({
      batchNumber,
      top = 15,
      skip = 0,
    }: {
      batchNumber: string;
      top?: number;
      skip?: number;
    }) => {
      const bn = (batchNumber ?? "").replace(/'/g, "''");
      const filter = encodeURIComponent(
        `IsActive eq 1 and BatchNumber eq '${bn}'`
      );
      const expand = encodeURIComponent(
        "Questionoptions($select=QuestionText),Questiondifficultylevel($select=QuestionDifficultylevel1)"
      );
      const select = encodeURIComponent(
        "QuestionId,Marks,NegativeMarks,GraceMarks,Language,SubjectId,QuestionTypeId,QuestionDifficultyLevelId"
      );
      return `/api/odata/Questions?$count=true&$top=${top}&$skip=${skip}&$filter=${filter}&$expand=${expand}&$select=${select}`;
    },
    type: "OPEN",
  } as Endpoint<
    { batchNumber: string; top?: number; skip?: number },
    { "@odata.count"?: number; value: any[] }
  >,

  // OData - Check if a Question is in use (pre-edit guard)
  isQuestionInUse: {
    method: "GET",
    // Exact OData function signature requested
    path: ({ testQuestionId }: { testQuestionId: number }) =>
      `/odata/Questions/IsQuestionInUse(testQuestionId=${testQuestionId})`,
    type: "OPEN",
  } as Endpoint<{ testQuestionId: number }, any>,

  // Admin Questions (server actions moved here)
  getAdminQuestions: {
    method: "GET",
    // Use your specific API endpoint for getting questions by language
    path: ({ query }) =>
      `/Odata/Questions/GetAllQuestionsByLanguage(language=English)${
        query ? (query.startsWith("?") ? query : `?${query}`) : ""
      }`,
    type: "OPEN",
  } as Endpoint<import("./types").GetQuestionsODataRequest, any[]>,

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
  } as Endpoint<import("./types").GetCompaniesRequest, any[]>,

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
  } as Endpoint<import("./types").GetCandidatesRequest, any[]>,

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

  // OData - Active Test Products for Step 5 Assign (dropdown)
  getActiveTestProductsOData: {
    method: "GET",
    path: () =>
      `/api/odata/TestProducts?$filter=IsActive eq 1&$select=ProductId,ProductName`,
    type: "OPEN",
  } as Endpoint<
    null,
    import("./types").ODataList<{ ProductId: number; ProductName: string }>
  >,

  // OData - Test Sections (for Step 3 bulk assignment)
  getTestSectionsOData: {
    method: "GET",
    path: () => `/api/odata/TestSections?$select=TestSectionId,TestSectionName`,
    type: "OPEN",
  } as Endpoint<
    null,
    import("./types").ODataList<{
      TestSectionId: number;
      TestSectionName: string;
    }>
  >,
  // Admin Test Sections CRUD + OData listing
  // Generic OData listing with dynamic query for grid (supports $top, $skip, $filter, $orderby)
  listTestSectionsOData: {
    method: "GET",
    path: ({ query }) =>
      `/Odata/TestSections${
        query ? (query.startsWith("?") ? query : `?${query}`) : ""
      }`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, { "@odata.count"?: number; value: any[] }>,

  createTestSection: {
    method: "POST",
    path: () => `/api/TestSections`,
    type: "CLOSE",
  } as Endpoint<any, any>,
  updateTestSection: {
    method: "PUT",
    path: ({ id }: { id: number }) => `/api/TestSections/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number } & any, any>,
  getTestSectionById: {
    method: "GET",
    path: ({ id }: { id: number }) => `/api/TestSections/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, any>,
  deleteTestSection: {
    method: "DELETE",
    path: ({ id }: { id: number }) => `/api/TestSections/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, null>,
  getProductById: {
    method: "GET",
    path: ({ productId }: { productId: number }) =>
      `/api/TestProducts/${productId}`,
    type: "OPEN",
  } as Endpoint<{ productId: number }, any>,
  createProduct: {
    method: "POST",
    path: () => `/api/TestProducts`,
    type: "CLOSE",
  } as Endpoint<any, any>,
  updateProduct: {
    method: "PUT",
    path: ({ productId }: { productId: number }) =>
      `/api/TestProducts/${productId}`,
    type: "CLOSE",
  } as Endpoint<{ productId: number } & any, any>,
  deleteProduct: {
    method: "DELETE",
    path: ({ productId }: { productId: number }) =>
      `/api/TestProducts/${productId}`,
    type: "CLOSE",
  } as Endpoint<{ productId: number }, null>,

  // Candidate registers for a test
  registerTest: {
    method: "POST",
    path: () => `/api/TestRegistrations`,
    type: "OPEN",
  } as Endpoint<any, any>,

  // Update existing Test Registration (e.g., reschedule without new row)
  updateTestRegistration: {
    method: "PUT",
    path: ({ testRegistrationId }: { testRegistrationId: number }) =>
      `/api/TestRegistrations/${testRegistrationId}`,
    type: "OPEN",
  } as Endpoint<{ testRegistrationId: number } & any, any>,

  submitTest: {
    path: () => `/api/TestSessions/submit`,
    method: "POST",
    type: "CLOSE",
  } as Endpoint<SubmitTestRequest, SubmitTestResponse>,

  getInstructionsByTestId: {
    path: ({ testId }) => `/api/TestInstructions/by-test/${testId}`,
    method: "GET",
    type: "CLOSE",
  } as Endpoint<
    GetInstructionsByTestIdRequest,
    GetInstructionsByTestIdResponse[]
  >,

  startTestSession: {
    path: () => `/api/TestSessions/start`,
    method: "POST",
    type: "CLOSE",
  } as Endpoint<StartSessionRequest, StartSessionResponse>,

  submitQuestion: {
    path: ({ TestId }) => `/api/TestSessions/${TestId}/answers`,
    method: "POST",
    type: "CLOSE",
  } as Endpoint<SubmitQuestionRequest, SubmitQuestionResponse>,

  getTestMetaData: {
    path: ({ testId, testResponseId, userName }) =>
      `/api/Tests/${testId}/meta-payload?userName=${encodeURIComponent(
        userName
      )}&testResponseId=${testResponseId}`,
    method: "GET",
    type: "CLOSE",
    disableCache: true,
  } as Endpoint<GetTestMetaDataRequest, GetTestMetaDataResponse>,

  getSessionQuestionById: {
    path: ({ questionId, testResponseId }) =>
      `/api/TestSessions/${testResponseId}/question-with-response/${questionId}`,
    method: "GET",
    type: "CLOSE",
  } as Endpoint<GetSessionQuestionByIdRequest, GetSessionQuestionByIdResponse>,

  getAdminRoles: {
    method: "GET",
    path: () => `/api/Role`,
    type: "CLOSE",
  } as Endpoint<null, any[]>,
  // OData - Published Documents Tree
  getPublishedDocumentsTree: {
    method: "GET",
    // Absolute or relative? We'll use relative so apiHandler prefixes API_BASE_URL
    path: () => `/odata/PublishedDocuments/GetDocumentsTree()`,
    type: "OPEN",
  } as Endpoint<null, import("./types").PublishedDocumentTreeItem[]>,
  // Admin - Published Document Folders (CRUD + OData list)
  listPublishedDocumentFoldersOData: {
    method: "GET",
    // Matches backend: /odata/PublishedDocumentsFolders
    path: ({ query }: { query?: string }) =>
      `/odata/PublishedDocumentsFolders${
        query ? (query.startsWith("?") ? query : `?${query}`) : ""
      }`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, any>,
  createPublishedDocumentFolder: {
    method: "POST",
    path: () => `/api/PublishedDocumentFolder`,
    type: "CLOSE",
  } as Endpoint<
    {
      id: number;
      publishedDocumentFolderName: string;
      parentId: number;
      language: string;
    },
    null
  >,
  updatePublishedDocumentFolder: {
    method: "PUT",
    path: ({ id }: { id: number }) => `/api/PublishedDocumentsFolders/${id}`,
    type: "CLOSE",
  } as Endpoint<
    {
      id: number;
      publishedDocumentFolderName: string;
      parentId: number;
      language: string;
    },
    null
  >,
  deletePublishedDocumentFolder: {
    method: "DELETE",
    path: ({ id }: { id: number }) => `/api/PublishedDocumentsFolders/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, null>,

  // Published Documents list (OData) and CRUD
  listPublishedDocumentsOData: {
    method: "GET",
    // Backend OData: /odata/PublishedDocuments
    path: ({ query }: { query?: string }) =>
      `/odata/PublishedDocuments${
        query ? (query.startsWith("?") ? query : `?${query}`) : ""
      }`,
    type: "OPEN",
  } as Endpoint<{ query?: string }, { "@odata.count"?: number; value: any[] }>,

  createPublishedDocument: {
    method: "POST",
    path: () => `/api/PublishedDocuments`,
    type: "CLOSE",
  } as Endpoint<
    {
      id: number;
      publishedDocumentFolderId: number;
      documentName: string;
      documentUrl: string;
      validFrom?: string;
      validTo?: string;
    },
    null
  >,

  updatePublishedDocument: {
    method: "PUT",
    path: ({ id }: { id: number }) => `/api/PublishedDocuments/${id}`,
    type: "CLOSE",
  } as Endpoint<
    {
      id: number;
      publishedDocumentFolderId: number;
      documentName: string;
      documentUrl: string;
      validFrom?: string;
      validTo?: string;
    },
    null
  >,

  getPublishedDocumentById: {
    method: "GET",
    path: ({ id }: { id: number }) => `/api/PublishedDocuments/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, any>,

  deletePublishedDocument: {
    method: "DELETE",
    path: ({ id }: { id: number }) => `/api/PublishedDocuments/${id}`,
    type: "CLOSE",
  } as Endpoint<{ id: number }, null>,

  getAdminDashboardAnalytics: {
    method: "GET",
    path: ({ startDate, endDate }) =>
      `/api/TestAdminDashboard/adminDashboard/analytics?startDate=${startDate}&endDate=${endDate}`,
    type: "CLOSE",
  } as Endpoint<
    AdminDashboardAnallyticsRequest,
    AdminDashboardAnallyticsResponse
  >,

  getAdminDashboardRecentActivities: {
    method: "GET",
    path: () => `/api/TestAdminDashboard/adminDashboard/recentActivities`,
    type: "CLOSE",
  } as Endpoint<null, AdminDashboardRecentActivitiesResponse[]>,

  getCandidateAnalyticsSummary: {
    method: "GET",
    path: ({ username }) =>
      `/api/TestAdminDashboard/analytics/completed/summary/${username}`,
    type: "CLOSE",
  } as Endpoint<
    CandidateAnalyticsSummaryRequest,
    CandidateAnalyticsSummaryResponse
  >,

  getCandidateAnalyticsDetails: {
    method: "GET",
    path: ({ username }) =>
      `/api/TestAdminDashboard/analytics/completed/details/${username}`,
    type: "CLOSE",
  } as Endpoint<
    CandidateAnalyticsDetailsRequest,
    CandidateAnalyticsDetailsResponse[]
  >,

  getCandidateAnalyticsReportHeader: {
    method: "GET",
    path: ({ testResponseId }) => `/api/TestResponse/result/${testResponseId}`,
    type: "CLOSE",
  } as Endpoint<
    CandidateAnalyticsReportHeaderRequest,
    CandidateAnalyticsReportHeaderResponse
  >,

  getCandidateAnalyticsReportSection: {
    method: "GET",
    path: ({ testResponseId }) =>
      `/api/TestResponse/result/sections/${testResponseId}`,
    type: "CLOSE",
  } as Endpoint<
    CandidateAnalyticsReportSectionRequest,
    CandidateAnalyticsReportSectionResponse[]
  >,

  getAdminDashboardReportData: {
    method: "GET",
    path: () => `/api/TestAdminDashboard/adminDashboard/dashboardReportData`,
    type: "CLOSE",
  } as Endpoint<
    AdminDashboardReportDataRequest,
    AdminDashboardReportDataResponse
  >,

  getAdminTestPerformanceSummaryRequest: {
    method: "GET",
    path: ({ testid }) =>
      `/api/TestAdminDashboard/adminDashboard/GetReportsTestPerformanceSummary?${
        testid ? `testId=${testid}` : ""
      }`,
    type: "CLOSE",
  } as Endpoint<
    AdminDashboardTestPerformanceSummaryRequest,
    AdminDashboardTestPerformanceSummaryResponse[]
  >,

  getAdminReportsTestQuestionsPerformanceSummary: {
    method: "GET",
    path: ({ testid }) =>
      `/api/TestAdminDashboard/adminDashboard/GetReportsTestQuestionsPerformanceSummary?${
        testid ? `testId=${testid}` : ""
      }`,
    type: "CLOSE",
  } as Endpoint<
    GetReportsTestQuestionsPerformanceSummaryRequest,
    GetReportsTestQuestionsPerformanceSummaryResponse[]
  >,

  getAdminDashboardTestCandidatePerformanceSummary: {
    method: "GET",
    path: ({ search, candidateGroupId }) =>
      `/api/TestAdminDashboard/adminDashboard/GetReportsTestCandidatePerformanceSummary?search=${search}&candidateGroupId=${candidateGroupId}`,
    type: "CLOSE",
  } as Endpoint<
    GetAdminDashboardTestCandidatePerformanceSummaryRequest,
    GetAdminDashboardTestCandidatePerformanceSummaryResponse[]
  >,

  getAdminDashboardTestStatusSummary: {
    method: "GET",
    path: ({ testId }) =>
      `/api/TestAdminDashboard/adminDashboard/GetReportsTestStatusSummary?${
        testId ? `testId=${testId}` : ""
      }`,
    type: "CLOSE",
  } as Endpoint<
    GetAdminDashboardTestStatusSummaryRequest,
    GetAdminDashboardTestStatusSummaryResponse[]
  >,

  getAdminReportsAuditSummary: {
    method: "GET",
    path: ({ userTimeStamp, module }) =>
      `/api/TestAdminDashboard/adminDashboard/GetReportsAuditSummary
?userTimeStamp=${encodeURIComponent(
        userTimeStamp ?? ""
      )}&module=${encodeURIComponent(module ?? "")}
    `,
    type: "CLOSE",
  } as Endpoint<
    GetReportsAuditSummaryRequest,
    GetReportsAuditSummaryResponse[]
  >,

  getCandidateGroupInorder: {
    method: "GET",
    path: () => `/api/CandidateGroup/inOrder?includeInactive=false`,
    type: "CLOSE",
  } as Endpoint<
    GetCandidateGroupsInorderRequest,
    GetCandidateGroupsInorderResponse[]
  >,
};
