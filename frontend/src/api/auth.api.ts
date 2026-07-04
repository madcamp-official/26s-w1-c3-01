import { apiRequest } from "./client";
import type { LoginRequest, LoginResponse, SignupRequest, SignupResponse } from "../features/auth/auth.types";

export const authApi = {
  signup(body: SignupRequest) {
    return apiRequest<SignupResponse>("/auth/signup", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body)
    });
  },
  login(body: LoginRequest) {
    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body)
    });
  },
  logout() {
    return apiRequest<{ loggedOut: boolean }>("/auth/logout", { method: "POST" });
  }
};
