import { createSupabaseAuthClient } from "../lib/supabase";

export type OAuthProvider = "kakao" | "google";

type OAuthCallbackResult =
  | { type: "session"; accessToken: string; refreshToken?: string; expiresAt?: number }
  | { type: "error"; message: string }
  | { type: "none" };

export async function startOAuthLogin(provider: OAuthProvider) {
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await createSupabaseAuthClient().auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      scopes: provider === "kakao" ? "profile_nickname profile_image" : undefined
    }
  });

  if (error) throw error;
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
      refreshToken: hash.get("refresh_token") ?? undefined,
      expiresAt: Number(hash.get("expires_at")) || undefined
    };
  }

  return { type: "none" };
}

export function clearOAuthCallbackUrl() {
  if (!window.location.hash && !window.location.search.includes("error")) return;
  window.history.replaceState({}, document.title, window.location.pathname);
}
