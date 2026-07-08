import "dotenv/config";

const DEFAULT_PUBLIC_SITE_URL = "http://localhost:5173";

function normalizePublicUrl(value: string | undefined, fallback = DEFAULT_PUBLIC_SITE_URL) {
  const url = value?.trim() || fallback;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(url)) return `http://${url}`;
  return `https://${url}`;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  publicSiteUrl: normalizePublicUrl(process.env.PUBLIC_SITE_URL),
  authEmailRedirectUrl: normalizePublicUrl(process.env.AUTH_EMAIL_REDIRECT_URL ?? process.env.PUBLIC_SITE_URL)
};
