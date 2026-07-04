import { supabaseAdmin, supabaseAnon } from "../../config/supabase.js";
import type { LoginRequest, SignupRequest } from "./auth.dto.js";

export const authRepository = {
  // Supabase Auth에 새 사용자를 등록한다.
  // 회원가입/로그인은 anon key 기반 client를 사용해야 한다.
  async signUp(input: SignupRequest) {
    return supabaseAnon.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          nickname: input.nickname,
          user_type: input.userType ?? "PERSONAL"
        }
      }
    });
  },

  // Supabase Auth 이메일/비밀번호 로그인을 수행한다.
  async signInWithPassword(input: LoginRequest) {
    return supabaseAnon.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });
  },

  // Supabase Auth user와 public.users profile을 연결한다.
  // Auth trigger가 profile을 만들지 못한 경우에도 여기서 보정한다.
  async upsertProfile(input: {
    authUserId: string;
    email: string;
    nickname: string;
    userType?: string;
  }) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          auth_user_id: input.authUserId,
          email: input.email,
          nickname: input.nickname,
          user_type: input.userType ?? "PERSONAL"
        },
        { onConflict: "auth_user_id" }
      )
      .select("user_id, auth_user_id, email, nickname, user_type")
      .single();

    if (error) throw error;
    return data;
  }
};