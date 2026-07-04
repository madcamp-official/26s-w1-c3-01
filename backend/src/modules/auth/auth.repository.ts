import { supabaseAdmin, supabaseAnon } from "../../config/supabase.js";
import type { LoginRequest, SignupRequest } from "./auth.dto.js";

export const authRepository = {
  // 회원가입 전에 public.users 기준으로 이메일 중복을 확인합니다.
  async findProfileByEmail(email: string) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // 회원가입 전에 public.users 기준으로 닉네임 중복을 확인합니다.
  async findProfileByNickname(nickname: string) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("user_id")
      .eq("nickname", nickname)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Supabase Auth에 새 사용자를 등록합니다.
  // 한글 nickname은 Auth metadata에 넣지 않고 public.users에 따로 저장합니다.
  async signUp(input: SignupRequest) {
    return supabaseAnon.auth.signUp({
      email: input.email,
      password: input.password
    });
  },

  // Supabase Auth 이메일/비밀번호 로그인을 수행합니다.
  async signInWithPassword(input: LoginRequest) {
    return supabaseAnon.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });
  },

  // Supabase Auth user와 public.users profile을 연결합니다.
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