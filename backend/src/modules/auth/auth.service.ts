import { authRepository } from "./auth.repository.js";
import type { LoginRequest, SignupRequest } from "./auth.dto.js";

export const authService = {
  async signup(input: SignupRequest) {
    const { data, error } = await authRepository.signUp(input);
    if (error) throw Object.assign(new Error(error.message), { status: 400, code: "VALIDATION_ERROR" });

    if (data.user) {
      await authRepository.upsertProfile({
        authUserId: data.user.id,
        email: data.user.email ?? input.email,
        nickname: input.nickname,
        userType: input.userType
      });
    }

    return {
      user: data.user,
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at
    };
  },

  async login(input: LoginRequest) {
    const { data, error } = await authRepository.signInWithPassword(input);
    if (error || !data.session) {
      throw Object.assign(new Error("이메일 또는 비밀번호가 올바르지 않습니다."), { status: 401, code: "UNAUTHORIZED" });
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: data.user
    };
  }
};
