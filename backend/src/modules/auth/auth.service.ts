import { randomBytes } from "node:crypto";
import { authRepository } from "./auth.repository.js";
import type { LoginRequest, RefreshRequest, SignupRequest } from "./auth.dto.js";

const GUEST_PASSWORD_PREFIX = "Mukpick-guest-";

export const authService = {
  async signup(input: SignupRequest) {
    if (await authRepository.findProfileByNickname(input.nickname)) {
      throw Object.assign(new Error("이미 사용 중인 닉네임입니다."), { status: 409, code: "CONFLICT" });
    }

    const { data, error } = await authRepository.signUp(input);
    if (error) throw Object.assign(new Error(error.message), { status: 400, code: "VALIDATION_ERROR" });

    if (data.user && !(await authRepository.findProfileByAuthUserId(data.user.id))) {
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

  async signupGuest() {
    // 게스트는 사용자가 입력하지 않는 내부 닉네임을 충돌 없이 생성합니다.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const nickname = `guest-${randomToken(8)}`;
      if (await authRepository.findProfileByNickname(nickname)) continue;

      const email = `${nickname}-${Date.now()}@guest.mukpick.local`;
      const password = `${GUEST_PASSWORD_PREFIX}${randomToken(16)}`;
      const { data, error } = await authRepository.signUpGuest({ email, password, nickname });
      if (error) {
        if (error.message.toLowerCase().includes("duplicate")) continue;
        throw Object.assign(new Error(error.message), { status: 400, code: "VALIDATION_ERROR" });
      }

      if (data.user && !(await authRepository.findProfileByAuthUserId(data.user.id))) {
        await authRepository.upsertProfile({
          authUserId: data.user.id,
          email: data.user.email ?? email,
          nickname,
          userType: "GUEST"
        });
      }

      const login = await authRepository.signInWithPassword({ email, password });
      if (login.error || !login.data.session) {
        throw Object.assign(new Error("게스트 세션을 생성하지 못했습니다. Supabase 인증 설정을 확인해주세요."), {
          status: 400,
          code: "VALIDATION_ERROR"
        });
      }

      return {
        guest: true,
        nickname,
        user: login.data.user,
        accessToken: login.data.session.access_token,
        refreshToken: login.data.session.refresh_token,
        expiresAt: login.data.session.expires_at
      };
    }

    throw Object.assign(new Error("게스트 닉네임 생성에 실패했습니다."), { status: 500, code: "INTERNAL_ERROR" });
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
  },

  async refresh(input: RefreshRequest) {
    const { data, error } = await authRepository.refreshSession(input.refreshToken);
    if (error || !data.session) {
      throw Object.assign(new Error("세션이 만료되었습니다. 다시 로그인해주세요."), { status: 401, code: "UNAUTHORIZED" });
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: data.user
    };
  },

  async checkNickname(nickname: string) {
    const normalized = nickname.trim();
    if (!normalized) {
      throw Object.assign(new Error("닉네임을 입력해주세요."), { status: 400, code: "VALIDATION_ERROR" });
    }

    return {
      nickname: normalized,
      available: !(await authRepository.findProfileByNickname(normalized))
    };
  }
};

function randomToken(length: number) {
  return Array.from(randomBytes(length))
    .map((value) => (value % 36).toString(36))
    .join("");
}
