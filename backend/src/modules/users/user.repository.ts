import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../config/supabase.js";
import type { UpdateUserRequest } from "./user.dto.js";

export const userRepository = {
  async ensureProfile(user: User) {
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("users")
      .select("user_id, auth_user_id, email, nickname, user_type")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (selectError) throw selectError;
    if (existing) return toCamelProfile(existing);

    const nickname = typeof user.user_metadata?.nickname === "string"
      ? user.user_metadata.nickname
      : user.email?.split("@")[0] ?? "user";
    const userType = typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "PERSONAL";

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        auth_user_id: user.id,
        email: user.email ?? "",
        nickname,
        user_type: userType
      })
      .select("user_id, auth_user_id, email, nickname, user_type")
      .single();

    if (error) throw error;
    return toCamelProfile(data);
  },

  async findById(userId: number) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("user_id, auth_user_id, email, nickname, user_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ? toCamelProfile(data) : null;
  },

  async update(userId: number, input: UpdateUserRequest) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        nickname: input.nickname,
        user_type: input.userType
      })
      .eq("user_id", userId)
      .select("user_id, auth_user_id, email, nickname, user_type")
      .single();

    if (error) throw error;
    return toCamelProfile(data);
  }
};

function toCamelProfile(row: any) {
  return {
    userId: Number(row.user_id),
    authUserId: row.auth_user_id,
    email: row.email,
    nickname: row.nickname,
    userType: row.user_type
  };
}
