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

    const nicknameBase = typeof user.user_metadata?.nickname === "string"
      ? user.user_metadata.nickname
      : user.email?.split("@")[0] ?? "user";
    const nickname = await createUniqueNickname(nicknameBase);
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

  async findByNickname(nickname: string) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("user_id, auth_user_id, email, nickname, user_type")
      .eq("nickname", nickname)
      .maybeSingle();

    if (error) throw error;
    return data ? toCamelProfile(data) : null;
  },

  async search(query = "") {
    const builder = supabaseAdmin
      .from("users")
      .select("user_id, auth_user_id, email, nickname, user_type")
      .order("nickname")
      .limit(20);

    const normalized = query.trim();
    const { data, error } = normalized
      ? await builder.ilike("nickname", `%${normalized}%`)
      : await builder;

    if (error) throw error;
    return (data ?? []).map(toCamelProfile);
  },

  async update(userId: number, input: UpdateUserRequest) {
    const updatePayload: Record<string, string> = {};
    if (input.nickname !== undefined) updatePayload.nickname = input.nickname;
    if (input.userType !== undefined) updatePayload.user_type = input.userType;

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updatePayload)
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

async function createUniqueNickname(baseNickname: string) {
  const normalized = normalizeNickname(baseNickname);
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("nickname")
    .ilike("nickname", `${normalized}%`);

  if (error) throw error;

  const usedNicknames = new Set((data ?? []).map((row) => row.nickname));

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const candidate = `${normalized.slice(0, 50 - suffix.length)}${suffix}`;
    if (!usedNicknames.has(candidate)) return candidate;
  }

  return `user-${Date.now().toString(36)}`;
}

function normalizeNickname(value: string) {
  const normalized = value.trim().slice(0, 50);
  return normalized || "user";
}
