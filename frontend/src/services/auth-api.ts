import { apiClient } from "./api-client";
import { UserProfile } from "@/types";

export interface CsrfResponse {
  detail: string;
  csrfToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LogoutResponse {
  detail: string;
}

export const authApi = {
  getCsrf: async (): Promise<CsrfResponse> => {
    return apiClient<CsrfResponse>("/auth/csrf/");
  },

  login: async (credentials: LoginCredentials): Promise<UserProfile> => {
    // 1. Ensure CSRF cookie is set before login
    await authApi.getCsrf();
    // 2. Perform login request
    return apiClient<UserProfile>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  logout: async (): Promise<LogoutResponse> => {
    return apiClient<LogoutResponse>("/auth/logout/", {
      method: "POST",
    });
  },

  getMe: async (): Promise<UserProfile> => {
    return apiClient<UserProfile>("/auth/me/");
  },
};
