import { apiRequest } from "./client";
import type {
  GuestSignupResponse,
  LoginRequest,
  LoginResponse,
  NicknameAvailabilityResponse,
  ResendSignupEmailResponse,
  RefreshResponse,
  SignupRequest,
  SignupResponse
} from "../features/auth/auth.types";

export const authApi = {
  signup(body: SignupRequest) {
    return apiRequest<SignupResponse>("/auth/signup", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body)
    });
  },
  resendSignupEmail(email: string) {
    return apiRequest<ResendSignupEmailResponse>("/auth/signup/resend", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email: email.trim() })
    });
  },
  login(body: LoginRequest) {
    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body)
    });
  },
  refresh(refreshToken: string) {
    return apiRequest<RefreshResponse>("/auth/refresh", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ refreshToken })
    });
  },
  syncProfile() {
    return apiRequest<{ user: unknown }>("/auth/profile", { method: "POST" });
  },
  checkNickname(nickname: string) {
    return apiRequest<NicknameAvailabilityResponse>(`/auth/nickname?nickname=${encodeURIComponent(nickname.trim())}`, {
      auth: false
    });
  },
  guest() {
    return apiRequest<GuestSignupResponse>("/auth/guest", {
      method: "POST",
      auth: false,
      body: JSON.stringify({})
    });
  },
  logout() {
    return apiRequest<{ loggedOut: boolean }>("/auth/logout", { method: "POST" });
  }
};
