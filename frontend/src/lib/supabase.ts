import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "../assets";

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseAuthConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export function assertSupabaseAuthConfigured() {
  if (!isSupabaseAuthConfigured) {
    throw new Error("Supabase OAuth 설정이 필요합니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.");
  }
}
