import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// service role key를 사용하는 관리자 client
// DB 조회/삽입/수정/삭제 등 서버 내부 작업에 사용한다.
export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// anon key를 사용하는 공개 client
// 회원가입/로그인처럼 Supabase Auth의 일반 사용자 흐름에 사용한다.
export const supabaseAnon = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// 사용자 access token을 포함한 client를 만든다.
// RLS를 사용자 권한 기준으로 적용해야 할 때 사용할 수 있다.
export function createSupabaseUserClient(accessToken: string) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}