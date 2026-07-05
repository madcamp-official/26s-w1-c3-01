import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import type { LoginRequest, SignupRequest } from "./auth.dto.js";

function createAuthClient() {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export const authRepository = {
  async signUp(input: SignupRequest) {
    return createAuthClient().auth.signUp({
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

  async signUpGuest(input: { email: string; password: string; nickname: string }) {
    return createAuthClient().auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          nickname: input.nickname,
          user_type: "GUEST"
        }
      }
    });
  },

  async signInWithPassword(input: LoginRequest) {
    return createAuthClient().auth.signInWithPassword({
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
  },

  async findProfileByAuthUserId(authUserId: string) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("user_id, auth_user_id, email, nickname, user_type")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findProfileByNickname(nickname: string) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("user_id, auth_user_id, email, nickname, user_type")
      .eq("nickname", nickname)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
