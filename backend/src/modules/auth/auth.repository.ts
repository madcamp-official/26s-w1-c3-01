import { supabaseAdmin, supabaseAnon } from "../../config/supabase.js";
import type { LoginRequest, SignupRequest } from "./auth.dto.js";

export const authRepository = {
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

  async signInWithPassword(input: LoginRequest) {
    return supabaseAnon.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });
  },

  async upsertProfile(input: {
    authUserId: string;
    email: string;
    nickname: string;
    userType?: string;
  }) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert({
        auth_user_id: input.authUserId,
        email: input.email,
        nickname: input.nickname,
        user_type: input.userType ?? "PERSONAL"
      }, { onConflict: "auth_user_id" })
      .select("user_id, auth_user_id, email, nickname, user_type")
      .single();

    if (error) throw error;
    return data;
  }
};
