export interface ApiResponse<T> {
  status: number;
  error: boolean;
  message?: string;
  errorMessage?: string;
  data?: T;
}

export type Endpoint<Request, Response> = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: (params: Request) => string;
  type: "OPEN" | "CLOSE"
};

//   Define request and response types for api endpoints below

// User Login
export interface LoginRequest {
  Username: string;
  Password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  username: string;
  roleDetailsJson: string;
  isAuthorized: boolean;
  message: string;
}

export interface LogoutRequest {
  Username: string
}