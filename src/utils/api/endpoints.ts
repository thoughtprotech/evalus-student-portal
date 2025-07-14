import {
  CreateQuestionRequest,
  Endpoint,
  GetCandidateStarredTestRequest,
  GetCandidateStarredTestResponse,
  GetCandidateTestRequest,
  GetCandidateTestResponse,
  GetQuestionByIdRequest,
  GetQuestionByIdResponse,
  GetQuestionListRequest,
  GetQuestionListResponse,
  GetQuestionTypesResponse,
  GetSpotlightRequest,
  GetSpotlightResponse,
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

  getSpotLight: {
    method: "GET",
    path: () => `/api/Spotlights`,
    type: "CLOSE",
  } as Endpoint<GetSpotlightRequest, GetSpotlightResponse[]>,
};
