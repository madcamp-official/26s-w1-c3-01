import type { ApiResponse } from "../types/api";
import { authSessionStorage, tokenStorage } from "../utils/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
let refreshPromise: Promise<void> | null = null;

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.auth !== false) {
    if (authSessionStorage.shouldRefresh()) {
      await refreshStoredSessionOnce();
    }

    const token = tokenStorage.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401 && options.auth !== false && authSessionStorage.get()?.refreshToken) {
    await refreshStoredSessionOnce();
    const retryHeaders = new Headers(headers);
    const retryToken = tokenStorage.get();
    if (retryToken) retryHeaders.set("Authorization", `Bearer ${retryToken}`);
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: retryHeaders
    });
  }

  const responseText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    // Vite fallback HTML이나 배포 환경의 잘못된 API 주소가 JSON 파싱 에러로 UI를 깨지 않게 합니다.
    throw new Error(`API 서버 응답이 JSON이 아닙니다. VITE_API_BASE_URL 또는 백엔드 서버 상태를 확인해주세요. (${response.status})`);
  }

  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(responseText) as ApiResponse<T>;
  } catch {
    throw new Error("API 응답을 JSON으로 해석하지 못했습니다.");
  }

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

async function refreshStoredSession() {
  const session = authSessionStorage.get();
  if (!session?.refreshToken) return;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken })
  });

  if (!response.ok) {
    authSessionStorage.clear();
    throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
  }

  const payload = (await response.json()) as ApiResponse<{
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }>;

  if (!payload.success || !payload.data.accessToken) {
    authSessionStorage.clear();
    throw new Error("세션을 복구하지 못했습니다. 다시 로그인해주세요.");
  }

  authSessionStorage.set({
    accessToken: payload.data.accessToken,
    refreshToken: payload.data.refreshToken ?? session.refreshToken,
    expiresAt: payload.data.expiresAt
  });
}

async function refreshStoredSessionOnce() {
  refreshPromise ??= refreshStoredSession().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}
