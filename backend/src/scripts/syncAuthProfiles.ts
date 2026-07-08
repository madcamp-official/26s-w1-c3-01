import "dotenv/config";
import { createClient, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const deleteUnconfirmed = process.argv.includes("--delete-unconfirmed");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

type ProfileRow = {
  auth_user_id: string;
  email: string;
  nickname: string;
  user_type: string | null;
};

async function main() {
  const authUsers = await listAllAuthUsers();
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("users")
    .select("auth_user_id, email, nickname, user_type");

  if (profilesError) throw profilesError;

  const profileRows = (profiles ?? []) as ProfileRow[];
  const existingAuthIds = new Set(profileRows.map((profile) => profile.auth_user_id));
  const usedNicknames = new Set(profileRows.map((profile) => profile.nickname));
  const confirmedUsers = authUsers.filter(isConfirmedUser);
  const unconfirmedUsers = authUsers.filter((user) => !isConfirmedUser(user));

  const missingProfiles = confirmedUsers.filter((user) => !existingAuthIds.has(user.id));
  let insertedProfiles = 0;

  for (const user of missingProfiles) {
    const nickname = createUniqueNickname(preferredNickname(user), usedNicknames);
    const { error } = await supabaseAdmin.from("users").insert({
      auth_user_id: user.id,
      email: user.email ?? "",
      nickname,
      user_type: readMetadataString(user, "user_type") ?? "PERSONAL"
    });
    if (error) throw error;

    usedNicknames.add(nickname);
    insertedProfiles += 1;
  }

  let deletedUnconfirmedAuthUsers = 0;
  if (deleteUnconfirmed) {
    for (const user of unconfirmedUsers) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (error) throw error;
      deletedUnconfirmedAuthUsers += 1;
    }
  }

  console.log(JSON.stringify({
    authUsers: authUsers.length,
    confirmedAuthUsers: confirmedUsers.length,
    unconfirmedAuthUsers: unconfirmedUsers.length,
    existingProfiles: profileRows.length,
    insertedProfiles,
    deletedUnconfirmedAuthUsers
  }, null, 2));
}

async function listAllAuthUsers() {
  const users: User[] = [];
  const perPage = 1000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    users.push(...data.users);
    if (data.users.length < perPage) return users;
  }
}

function isConfirmedUser(user: User) {
  return Boolean(user.email_confirmed_at ?? user.confirmed_at);
}

function preferredNickname(user: User) {
  return readMetadataString(user, "nickname") ?? `user-${user.id.slice(0, 8)}`;
}

function readMetadataString(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function createUniqueNickname(baseNickname: string, usedNicknames: Set<string>) {
  const normalized = normalizeNickname(baseNickname);

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

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
