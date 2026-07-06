import { SUPABASE_URL } from "../assets";

export type OAuthProvider = "kakao" | "google";

type OAuthCallbackResult =
  | { type: "session"; accessToken: string; refreshToken?: string }
  | { type: "error"; message: string }
  | { type: "none" };

export function startOAuthLogin(provider: OAuthProvider) {
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const authUrl = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  authUrl.searchParams.set("provider", provider);
  authUrl.searchParams.set("redirect_to", redirectTo);
  window.location.assign(authUrl.toString());
}

export function readOAuthCallback(): OAuthCallbackResult {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const errorMessage = hash.get("error_description") ?? query.get("error_description") ?? hash.get("error") ?? query.get("error");

  if (errorMessage) {
    return { type: "error", message: errorMessage };
  }

  const accessToken = hash.get("access_token");
  if (accessToken) {
    return {
      type: "session",
      accessToken,
      refreshToken: hash.get("refresh_token") ?? undefined
    };
  }

  return { type: "none" };
}

export function clearOAuthCallbackUrl() {
  if (!window.location.hash && !window.location.search.includes("error")) return;
  window.history.replaceState({}, document.title, window.location.pathname);
}
