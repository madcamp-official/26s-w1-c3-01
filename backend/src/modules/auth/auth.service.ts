import { ERROR_CODES } from "../../common/constants/errorCodes.js";
import { authRepository } from "./auth.repository.js";
import { userRepository } from "../users/user.repository.js";
import type { LoginRequest, SignupRequest } from "./auth.dto.js";

export const authService = {
  // 회원가입 후 Supabase Auth 계정과 public.users profile을 함께 보장합니다.
  async signup(input: SignupRequest) {
    await assertSignupAvailable(input);

    const { data, error } = await authRepository.signUp(input);

    if (error) {
      throwAuthSignupError(error.message);
    }

    if (!data.user) {
      throwApiError(400, ERROR_CODES.VALIDATION_ERROR, "회원가입에 실패했습니다.");
    }

    try {
      const profile = await authRepository.upsertProfile({
        authUserId: data.user.id,
        email: data.user.email ?? input.email,
        nickname: input.nickname,
        userType: input.userType
      });

      return {
        user: userRepository.toPublicProfile(profile),
        session: {
          accessToken: data.session?.access_token ?? null,
          refreshToken: data.session?.refresh_token ?? null,
          expiresAt: data.session?.expires_at ?? null
        }
      };
    } catch (error) {
      // 동시 가입 요청 등으로 DB unique constraint가 늦게 터지는 경우를 API 에러로 변환합니다.
      if (isUniqueViolation(error)) {
        throwApiError(409, ERROR_CODES.CONFLICT, "이미 사용 중인 이메일 또는 닉네임입니다.");
      }

      throw error;
    }
  },

  // 이메일/비밀번호 로그인 후 access token과 앱 profile을 반환합니다.
  async login(input: LoginRequest) {
    const { data, error } = await authRepository.signInWithPassword(input);

    if (error || !data.user || !data.session) {
      throwApiError(401, ERROR_CODES.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
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

async function assertSignupAvailable(input: SignupRequest) {
  const [sameEmail, sameNickname] = await Promise.all([
    authRepository.findProfileByEmail(input.email),
    authRepository.findProfileByNickname(input.nickname)
  ]);

  if (sameEmail) {
    throwApiError(409, ERROR_CODES.CONFLICT, "이미 가입된 이메일입니다.");
  }

  if (sameNickname) {
    throwApiError(409, ERROR_CODES.CONFLICT, "이미 사용 중인 닉네임입니다.");
  }
}

function throwAuthSignupError(message: string): never {
  const normalized = message.toLowerCase();

  if (normalized.includes("already") || normalized.includes("registered")) {
    throwApiError(409, ERROR_CODES.CONFLICT, "이미 가입된 이메일입니다.");
  }

  throwApiError(400, ERROR_CODES.VALIDATION_ERROR, message || "회원가입 요청이 올바르지 않습니다.");
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

function throwApiError(status: number, code: string, message: string): never {
  throw {
    status,
    code,
    message
  };
}