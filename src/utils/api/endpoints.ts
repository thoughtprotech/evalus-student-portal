import {
  Endpoint,
  GetQuestionListRequest,
  GetQuestionListResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
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
};
