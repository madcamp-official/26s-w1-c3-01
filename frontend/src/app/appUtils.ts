import { tokenStorage } from "../utils/storage";

export const DEV_AUTH_PASSWORD = "Mukpick-dev-2026!";

export function slugifyNickname(value: string) {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "user";
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "API 요청 중 오류가 발생했습니다.";
}

export function persistAccessToken(response: { accessToken?: string; refreshToken?: string; expiresAt?: number }) {
  if (!response.accessToken) {
    throw new Error("인증 토큰을 받지 못했습니다. Supabase 이메일 인증 설정을 확인해주세요.");
  }
  tokenStorage.set(response.accessToken);
}

export function hasPreferenceRows(preferences: any) {
  return Boolean(
    preferences?.categoryPreferences?.length ||
      preferences?.tagPreferences?.length ||
      preferences?.menuPreferences?.length ||
      preferences?.allergyIds?.length
  );
}
