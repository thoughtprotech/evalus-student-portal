import {
  Endpoint,
  LoginRequest,
  LoginResponse,
} from "./types";

export const endpoints = {
  loginUser: {
    method: "POST",
    path: () => "/api/auth/login",
    type: "OPEN"
  } as Endpoint<LoginRequest, LoginResponse>,
};
