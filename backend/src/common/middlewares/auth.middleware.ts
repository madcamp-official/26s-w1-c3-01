import type { RequestHandler } from "express";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { userRepository } from "../../modules/users/user.repository.js";
import type { AuthProfile } from "../types/express.js";

type AuthContext = NonNullable<Express.Request["auth"]>;

const AUTH_CACHE_TTL_MS = 5 * 60_000;
const PROFILE_CACHE_TTL_MS = 5 * 60_000;
const MAX_AUTH_CACHE_ENTRIES = 500;
const MAX_PROFILE_CACHE_ENTRIES = 1_000;
const authCache = new Map<string, { expiresAt: number; auth: AuthContext }>();
const profileCache = new Map<string, { expiresAt: number; profile: AuthProfile }>();

function getCachedAuth(token: string) {
  const cached = authCache.get(token);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    authCache.delete(token);
    return null;
  }

  return cached.auth;
}

function setCachedAuth(token: string, auth: AuthContext) {
  if (authCache.size >= MAX_AUTH_CACHE_ENTRIES) {
    const oldestToken = authCache.keys().next().value;
    if (oldestToken) authCache.delete(oldestToken);
  }

  authCache.set(token, {
    expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
    auth
  });
}

export function invalidateAuthCache(token: string) {
  authCache.delete(token);
}

function getCachedProfile(authUserId: string) {
  const cached = profileCache.get(authUserId);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    profileCache.delete(authUserId);
    return null;
  }

  return cached.profile;
}

function setCachedProfile(profile: AuthProfile) {
  if (profileCache.size >= MAX_PROFILE_CACHE_ENTRIES) {
    const oldestAuthUserId = profileCache.keys().next().value;
    if (oldestAuthUserId) profileCache.delete(oldestAuthUserId);
  }

  profileCache.set(profile.authUserId, {
    expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
    profile
  });
}

export function invalidateProfileCache(authUserId: string) {
  profileCache.delete(authUserId);
}

// Authorization: Bearer {accessToken} 헤더를 검증한다.
// 토큰이 유효하면 Supabase Auth user와 앱 profile을 req.auth에 넣는다.
export const authMiddleware: RequestHandler = async (req, res, next) => {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: "로그인이 필요합니다.",
        details: {}
      }
    });
    return;
  }

  try {
    const cachedAuth = getCachedAuth(token);
    if (cachedAuth) {
      req.auth = cachedAuth;
      next();
      return;
    }

    // Supabase Auth에 access token이 유효한지 확인한다.
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      throw error ?? new Error("Missing Supabase user");
    }

    // Auth user와 연결된 public.users profile을 조회한다.
    // profile 생성은 회원가입/로그인/OAuth 동기화 흐름에서만 수행한다.
    const profile = getCachedProfile(data.user.id) ?? await userRepository.findByAuthUserId(data.user.id);
    if (!profile) {
      res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: "사용자 프로필을 찾지 못했습니다. 프로필 생성이 필요합니다.",
          details: {}
        }
      });
      return;
    }
    setCachedProfile(profile);

    const auth = {
      accessToken: token,
      user: data.user,
      profile
    };

    setCachedAuth(token, auth);
    req.auth = auth;

    next();
  } catch {
    res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: "유효하지 않은 토큰입니다.",
        details: {}
      }
    });
  }
};
