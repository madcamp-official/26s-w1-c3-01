import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../config/supabase.js";
import type { UpdateUserRequest, UserProfileResponse } from "./user.dto.js";

type UserProfileRow = {
  user_id: number;
  auth_user_id: string;
  email: string;
  nickname: string;
  user_type: string | null;
};

export const userRepository = {
  // Supabase Auth user에 대응되는 public.users profile을 보장한다.
  // 이미 있으면 조회하고, 없으면 새로 만든다.
  async ensureProfile(user: User): Promise<UserProfileResponse> {
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("users")
      .select("user_id, auth_user_id, email, nickname, user_type")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (selectError) throw selectError;
    if (existing) return toPublicProfile(existing as UserProfileRow);

    const nickname =
      typeof user.user_metadata?.nickname === "string" &&
      user.user_metadata.nickname.trim()
        ? user.user_metadata.nickname.trim()
        : user.email?.split("@")[0] ?? "user";

    const userType =
      typeof user.user_metadata?.user_type === "string"
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
    return toPublicProfile(data as UserProfileRow);
  },

  // user_id 기준으로 profile을 조회한다.
  async findById(userId: number): Promise<UserProfileResponse | null> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("user_id, auth_user_id, email, nickname, user_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ? toPublicProfile(data as UserProfileRow) : null;
  },

  async findByNickname(nickname: string): Promise<UserProfileResponse | null> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("user_id, auth_user_id, email, nickname, user_type")
      .eq("nickname", nickname)
      .maybeSingle();

    if (error) throw error;
    return data ? toPublicProfile(data as UserProfileRow) : null;
  },

  // 수정 가능한 profile 필드를 업데이트한다.
  async update(userId: number, input: UpdateUserRequest): Promise<UserProfileResponse> {
    const updateData: Record<string, unknown> = {};

    if (input.nickname !== undefined) {
      updateData.nickname = input.nickname;
    }

    if (input.userType !== undefined) {
      updateData.user_type = input.userType;
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("user_id", userId)
      .select("user_id, auth_user_id, email, nickname, user_type")
      .single();

    if (error) throw error;
    return toPublicProfile(data as UserProfileRow);
  },

  // 다른 모듈에서도 DB row를 API 응답 형태로 변환할 수 있게 공개한다.
  toPublicProfile(row: UserProfileRow): UserProfileResponse {
    return toPublicProfile(row);
  }
};

// DB의 snake_case user row를 API 응답용 camelCase 객체로 변환한다.
function toPublicProfile(row: UserProfileRow): UserProfileResponse {
  return {
    userId: Number(row.user_id),
    authUserId: row.auth_user_id,
    email: row.email,
    nickname: row.nickname,
    userType: row.user_type
  };
}
