import type { ApiResponse } from "../types/api";
import { tokenStorage } from "../utils/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.auth !== false) {
    const token = tokenStorage.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

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
