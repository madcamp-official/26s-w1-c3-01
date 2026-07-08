import { randomBytes } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { authRepository } from "./auth.repository.js";
import { userRepository } from "../users/user.repository.js";
import type { LoginRequest, RefreshRequest, ResendSignupEmailRequest, SignupRequest } from "./auth.dto.js";

const GUEST_PASSWORD_PREFIX = "Mukpick-guest-";
const GUEST_ACCOUNT_TTL_MS = 24 * 60 * 60 * 1000;

export const authService = {
  async signup(input: SignupRequest) {
    await cleanupUnconfirmedProfileByEmail(input.email);
    if (input.nickname) await cleanupUnconfirmedProfileByNickname(input.nickname);

    if (input.nickname && await authRepository.findProfileByNickname(input.nickname)) {
      throw Object.assign(new Error("이미 사용 중인 닉네임입니다."), { status: 409, code: "CONFLICT" });
    }

    const { data, error } = await authRepository.signUp(input);
    if (error) throw Object.assign(new Error(error.message), { status: 400, code: "VALIDATION_ERROR" });

    return {
      user: data.user,
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at
    };
  },

  async signupGuest() {
    await cleanupExpiredGuestProfiles().catch(() => undefined);

    // 게스트는 사용자가 입력하지 않는 내부 닉네임을 충돌 없이 생성합니다.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const nickname = `guest-${randomToken(8)}`;
      if (await authRepository.findProfileByNickname(nickname)) continue;

      const email = `${nickname}-${Date.now()}@guest.mukpick.local`;
      const password = `${GUEST_PASSWORD_PREFIX}${randomToken(16)}`;
      const { data, error } = await authRepository.signUpGuest({ email, password, nickname });
      const createdAuthUserId = data.user?.id;
      if (error) {
        if (error.message.toLowerCase().includes("duplicate")) continue;
        throw Object.assign(new Error(error.message), { status: 400, code: "VALIDATION_ERROR" });
      }

      try {
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
      } catch (rollbackError) {
        if (createdAuthUserId) await authRepository.deleteAuthUser(createdAuthUserId).catch(() => undefined);
        throw rollbackError;
      }
    }

    throw Object.assign(new Error("게스트 닉네임 생성에 실패했습니다."), { status: 500, code: "INTERNAL_ERROR" });
  },

  async login(input: LoginRequest) {
    const { data, error } = await authRepository.signInWithPassword(input);
    if (error || !data.session) {
      throw Object.assign(new Error("이메일 또는 비밀번호가 올바르지 않습니다."), { status: 401, code: "UNAUTHORIZED" });
    }

    if (data.user) await ensureProfileForAuthUser(data.user);

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

    if (data.user) await ensureProfileForAuthUser(data.user);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: data.user
    };
  },

  async resendSignupEmail(input: ResendSignupEmailRequest) {
    const { error } = await authRepository.resendSignupEmail(input.email);
    if (error) throw Object.assign(new Error(error.message), { status: 400, code: "VALIDATION_ERROR" });

    return { email: input.email };
  },

  async checkNickname(nickname: string) {
    const normalized = nickname.trim();
    if (!normalized) {
      throw Object.assign(new Error("닉네임을 입력해주세요."), { status: 400, code: "VALIDATION_ERROR" });
    }

    await cleanupUnconfirmedProfileByNickname(normalized);

    return {
      nickname: normalized,
      available: !(await authRepository.findProfileByNickname(normalized))
    };
  },

  async syncProfile(user: User) {
    return ensureProfileForAuthUser(user);
  },

  async logout(auth: { profile: { userType: string | null }; user: { id: string } }) {
    if (auth.profile.userType === "GUEST") {
      await authRepository.deleteAuthUser(auth.user.id);
      return { loggedOut: true, deletedGuest: true };
    }

    return { loggedOut: true, deletedGuest: false };
  },

  async cleanupExpiredGuests() {
    return cleanupExpiredGuestProfiles();
  }
};

async function ensureProfileForAuthUser(user: User) {
  return userRepository.ensureProfile(user);
}

async function cleanupUnconfirmedProfileByEmail(email: string) {
  const profile = await authRepository.findProfileByEmail(email.trim());
  await cleanupUnconfirmedProfile(profile);
}

async function cleanupUnconfirmedProfileByNickname(nickname: string) {
  const profile = await authRepository.findProfileByNickname(nickname.trim());
  await cleanupUnconfirmedProfile(profile);
}

async function cleanupUnconfirmedProfile(profile: { auth_user_id: string | null } | null) {
  if (!profile?.auth_user_id) return;

  const authUser = await authRepository.getAuthUser(String(profile.auth_user_id));
  const confirmedAt = authUser?.email_confirmed_at ?? authUser?.confirmed_at;
  if (!confirmedAt) {
    await authRepository.deleteAuthUser(String(profile.auth_user_id));
  }
}

async function cleanupExpiredGuestProfiles() {
  const cutoffIso = new Date(Date.now() - GUEST_ACCOUNT_TTL_MS).toISOString();
  const guests = await authRepository.listExpiredGuestProfiles(cutoffIso);
  let deleted = 0;

  for (const guest of guests) {
    await authRepository.deleteAuthUser(String(guest.auth_user_id));
    deleted += 1;
  }

  return {
    deleted,
    cutoffIso
  };
}

function randomToken(length: number) {
  return Array.from(randomBytes(length))
    .map((value) => (value % 36).toString(36))
    .join("");
}
