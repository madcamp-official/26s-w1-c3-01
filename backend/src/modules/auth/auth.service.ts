import { authRepository } from "./auth.repository.js";
import { userRepository } from "../users/user.repository.js";
import type { LoginRequest, SignupRequest } from "./auth.dto.js";

export const authService = {
  // 회원가입 후 public.users profile을 보장한다.
  // Supabase 설정에 따라 email confirmation이 켜져 있으면 session이 null일 수 있다.
  async signup(input: SignupRequest) {
    const { data, error } = await authRepository.signUp(input);

    if (error) {
      throw Object.assign(new Error(error.message), {
        status: 400,
        code: "VALIDATION_ERROR"
      });
    }

    const profile = data.user
      ? await authRepository.upsertProfile({
          authUserId: data.user.id,
          email: data.user.email ?? input.email,
          nickname: input.nickname,
          userType: input.userType
        })
      : null;

    return {
      user: profile ? userRepository.toPublicProfile(profile) : null,
      session: {
        accessToken: data.session?.access_token ?? null,
        refreshToken: data.session?.refresh_token ?? null,
        expiresAt: data.session?.expires_at ?? null
      }
    };
  },

  // 이메일/비밀번호 로그인 후 access token과 앱 profile을 반환한다.
  async login(input: LoginRequest) {
    const { data, error } = await authRepository.signInWithPassword(input);

    if (error || !data.user || !data.session) {
      throw Object.assign(new Error("이메일 또는 비밀번호가 올바르지 않습니다."), {
        status: 401,
        code: "UNAUTHORIZED"
      });
    }

    const profile = await userRepository.ensureProfile(data.user);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? null,
      user: profile
    };
  }
};