import "@supabase/functions-js/edge-runtime.d.ts";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

const ALGORITHM_VERSION = "baseline-v1";

type RecommendationConfig = {
  menuPreference: number;
  categoryPreference: number;
  tagPreference: number;
  purposeSuitabilityRule: "exclude_if_score_zero";
  averageScore: number;
  minimumScore: number;
  strongDislikePenalty: number;
  strongDislikeScore: number;
  recentDuplicateDays: number;
  resultLimit: number;
};

const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  menuPreference: 0.5,
  categoryPreference: 0.3,
  tagPreference: 0.2,
  purposeSuitabilityRule: "exclude_if_score_zero",
  averageScore: 0.7,
  minimumScore: 0.3,
  strongDislikePenalty: 20,
  strongDislikeScore: -3,
  recentDuplicateDays: 3,
  resultLimit: 3,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

type AppContext = {
  admin: SupabaseClient;
  client: SupabaseClient;
  user: User;
  profile: UserProfile;
};

type UserProfile = {
  user_id: number;
  auth_user_id: string;
  email: string;
  nickname: string;
  user_type: string | null;
};

type MenuRow = {
  menu_id: number;
  category_id: number;
  name: string;
  description: string | null;
  spicy_level: number;
  price_level: number | null;
  calorie: number | null;
};

type RecommendationResult = {
  rankNo: number;
  menuId: number;
  menuName: string;
  totalScore: number;
  reason: string;
  isNewSuggestion?: boolean;
};

function envValue(...names: string[]) {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value) return value;
  }
  return "";
}

function resolveNamedKey(jsonEnvName: string, fallbackNames: string[]) {
  const direct = envValue(...fallbackNames);
  if (direct) return direct;

  const raw = Deno.env.get(jsonEnvName);
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const value = parsed.default ?? Object.values(parsed)[0];
    if (!value) return "";
    return value.startsWith("sb_") || value.includes(".")
      ? value
      : Deno.env.get(value) ?? "";
  } catch {
    return "";
  }
}

function supabaseUrl() {
  return envValue("SUPABASE_URL");
}

function publishableKey() {
  return resolveNamedKey("SUPABASE_PUBLISHABLE_KEYS", [
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  ]);
}

function secretKey() {
  return resolveNamedKey("SUPABASE_SECRET_KEYS", [
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]);
}

function createPublicClient() {
  return createClient(supabaseUrl(), publishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createScopedClient(authHeader: string) {
  return createClient(supabaseUrl(), publishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });
}

function createAdminClient() {
  return createClient(supabaseUrl(), secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ok(data: unknown = null, status = 200, message: string | null = null) {
  return json({ success: true, data, message }, status);
}

function fail(
  status: number,
  code: string,
  message: string,
  details: unknown = null,
) {
  return json({ success: false, error: { code, message, details } }, status);
}

function normalizePath(req: Request) {
  const url = new URL(req.url);
  let path = url.pathname;
  path = path.replace(/^\/functions\/v1\/api/, "");
  path = path.replace(/^\/api\/v1/, "");
  return path || "/";
}

function pathParts(path: string) {
  return path.split("/").filter(Boolean);
}

async function readJson(req: Request) {
  if (req.headers.get("content-length") === "0") return {};
  const text = await req.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function numberOrUndefined(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function recommendationConfigFromBody(
  body: Record<string, unknown>,
): RecommendationConfig {
  const resultLimit = Math.max(
    1,
    Math.min(
      numberOrUndefined(body.resultLimit) ?? numberOrUndefined(body.limit) ??
        DEFAULT_RECOMMENDATION_CONFIG.resultLimit,
      20,
    ),
  );
  const recentDuplicateDays = Math.max(
    numberOrUndefined(body.recentDuplicateDays) ??
      numberOrUndefined(body.excludeRecentDays) ??
      DEFAULT_RECOMMENDATION_CONFIG.recentDuplicateDays,
    0,
  );

  return {
    ...DEFAULT_RECOMMENDATION_CONFIG,
    recentDuplicateDays,
    resultLimit,
  };
}

function requireString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`MISSING_${key.toUpperCase()}`);
  }
  return value.trim();
}

function toCamelUser(row: UserProfile) {
  return {
    userId: row.user_id,
    authUserId: row.auth_user_id,
    email: row.email,
    nickname: row.nickname,
    userType: row.user_type,
  };
}

async function ensureProfile(
  admin: SupabaseClient,
  user: User,
): Promise<UserProfile> {
  const { data: existing, error: selectError } = await admin
    .from("users")
    .select("user_id, auth_user_id, email, nickname, user_type")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as UserProfile;

  const nickname = typeof user.user_metadata?.nickname === "string" &&
      user.user_metadata.nickname.trim()
    ? user.user_metadata.nickname.trim()
    : user.email?.split("@")[0] ?? "user";

  const userType = typeof user.user_metadata?.user_type === "string"
    ? user.user_metadata.user_type
    : "PERSONAL";

  const { data, error } = await admin
    .from("users")
    .insert({
      auth_user_id: user.id,
      email: user.email ?? "",
      nickname,
      user_type: userType,
    })
    .select("user_id, auth_user_id, email, nickname, user_type")
    .single();

  if (error) throw error;
  return data as UserProfile;
}

async function requireAuth(req: Request): Promise<AppContext | Response> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token || token === authHeader) {
    return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const admin = createAdminClient();
  const client = createScopedClient(authHeader);
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    return fail(401, "UNAUTHORIZED", "유효하지 않은 인증 토큰입니다.");
  }

  const profile = await ensureProfile(admin, data.user);
  return { admin, client, user: data.user, profile };
}

async function assertMeetingVisible(ctx: AppContext, meetingId: number) {
  const { data: meeting, error } = await ctx.admin
    .from("meetings")
    .select("*")
    .eq("meeting_id", meetingId)
    .maybeSingle();

  if (error) throw error;
  if (!meeting) return null;
  if (meeting.created_by === ctx.profile.user_id) return meeting;

  const { data: participant, error: participantError } = await ctx.admin
    .from("meeting_participants")
    .select("participant_id")
    .eq("meeting_id", meetingId)
    .eq("user_id", ctx.profile.user_id)
    .neq("attendance_status", "DECLINED")
    .maybeSingle();

  if (participantError) throw participantError;
  return participant ? meeting : null;
}

async function assertMeetingCreator(ctx: AppContext, meetingId: number) {
  const meeting = await assertMeetingVisible(ctx, meetingId);
  if (!meeting) return null;
  return meeting.created_by === ctx.profile.user_id ? meeting : "FORBIDDEN";
}

async function handleSignup(body: Record<string, unknown>) {
  const email = requireString(body, "email");
  const password = requireString(body, "password");
  const nickname = requireString(body, "nickname");
  const userType = typeof body.userType === "string"
    ? body.userType
    : "PERSONAL";

  const client = createPublicClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { nickname, user_type: userType } },
  });

  if (error) return fail(400, "VALIDATION_ERROR", error.message);

  return ok(
    {
      user: data.user
        ? {
          authUserId: data.user.id,
          email: data.user.email,
          nickname,
          userType,
        }
        : null,
      session: data.session
        ? {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
        }
        : null,
    },
    201,
    "회원가입이 완료되었습니다.",
  );
}

async function handleLogin(body: Record<string, unknown>) {
  const email = requireString(body, "email");
  const password = requireString(body, "password");

  const client = createPublicClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return fail(
      401,
      "UNAUTHORIZED",
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    );
  }
  if (!data.user || !data.session) {
    return fail(401, "UNAUTHORIZED", "로그인에 실패했습니다.");
  }

  const profile = await ensureProfile(createAdminClient(), data.user);

  return ok({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
    user: toCamelUser(profile),
  });
}

async function handleMasterData(ctx: AppContext, path: string, req: Request) {
  const url = new URL(req.url);

  if (path === "/menu-categories") {
    const { data, error } = await ctx.admin.from("menu_categories").select("*")
      .order("category_id");
    if (error) throw error;
    return ok(data);
  }

  if (path === "/tags") {
    const { data, error } = await ctx.admin.from("tags").select("*").order(
      "tag_id",
    );
    if (error) throw error;
    return ok(data);
  }

  if (path === "/category-tags") {
    const { data, error } = await ctx.admin.from("category_tags").select(
      "category_id, tag_id, menu_categories(category_id, name), tags(tag_id, name)",
    )
      .order("category_id")
      .order("tag_id");
    if (error) throw error;
    return ok(data);
  }

  if (path === "/allergies") {
    const { data, error } = await ctx.admin.from("allergies").select("*").order(
      "allergy_id",
    );
    if (error) throw error;
    return ok(data);
  }

  if (path === "/meeting-purposes") {
    const { data, error } = await ctx.admin
      .from("meeting_purposes")
      .select("*")
      .order("meeting_purpose_id");
    if (error) throw error;
    return ok(data);
  }

  if (path === "/menus") {
    let query = ctx.admin
      .from("menus")
      .select(
        "menu_id, category_id, name, description, spicy_level, price_level, calorie, menu_categories(category_id, name)",
        { count: "exact" },
      )
      .order("menu_id");

    const categoryId = numberOrUndefined(url.searchParams.get("categoryId"));
    const keyword = url.searchParams.get("keyword");
    const limit = numberOrUndefined(url.searchParams.get("limit")) ?? 50;
    const offset = numberOrUndefined(url.searchParams.get("offset")) ?? 0;

    if (categoryId) query = query.eq("category_id", categoryId);
    if (keyword) query = query.ilike("name", `%${keyword}%`);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return ok({
      items: data,
      pagination: { limit, offset, total: count ?? data?.length ?? 0 },
    });
  }

  const match = path.match(/^\/menus\/(\d+)$/);
  if (match) {
    const menuId = Number(match[1]);
    const { data, error } = await ctx.admin
      .from("menus")
      .select(
        "menu_id, category_id, name, description, spicy_level, price_level, calorie, menu_categories(category_id, name)",
      )
      .eq("menu_id", menuId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return fail(404, "NOT_FOUND", "메뉴를 찾을 수 없습니다.");

    const [tags, allergies] = await Promise.all([
      ctx.admin.from("menu_tags").select("tag_id, tags(tag_id, name)").eq(
        "menu_id",
        menuId,
      ),
      ctx.admin.from("menu_allergies").select(
        "allergy_id, allergies(allergy_id, name)",
      ).eq("menu_id", menuId),
    ]);
    if (tags.error) throw tags.error;
    if (allergies.error) throw allergies.error;

    return ok({ ...data, tags: tags.data, allergies: allergies.data });
  }

  return null;
}

async function handleGetPreferences(ctx: AppContext) {
  const userId = ctx.profile.user_id;
  const [menus, categories, tags, allergies] = await Promise.all([
    ctx.admin
      .from("user_menu_preferences")
      .select("menu_id, preference_score, menus(menu_id, name)")
      .eq("user_id", userId),
    ctx.admin
      .from("user_category_preferences")
      .select(
        "category_id, preference_score, menu_categories(category_id, name)",
      )
      .eq("user_id", userId),
    ctx.admin
      .from("user_tag_preferences")
      .select("tag_id, preference_score, tags(tag_id, name)")
      .eq("user_id", userId),
    ctx.admin.from("user_allergies").select("allergy_id").eq("user_id", userId),
  ]);

  for (const result of [menus, categories, tags, allergies]) {
    if (result.error) throw result.error;
  }

  return ok({
    menuPreferences: menus.data,
    categoryPreferences: categories.data,
    tagPreferences: tags.data,
    allergyIds: allergies.data?.map((row) => row.allergy_id) ?? [],
  });
}

async function replaceRows(
  ctx: AppContext,
  table: string,
  rows: Record<string, unknown>[],
  userId: number,
) {
  const deleteResult = await ctx.admin.from(table).delete().eq(
    "user_id",
    userId,
  );
  if (deleteResult.error) throw deleteResult.error;
  if (rows.length === 0) return;
  const insertResult = await ctx.admin.from(table).insert(rows);
  if (insertResult.error) throw insertResult.error;
}

async function handlePutPreferences(
  ctx: AppContext,
  body: Record<string, unknown>,
) {
  const userId = ctx.profile.user_id;
  const now = new Date().toISOString();

  const menuPreferences = Array.isArray(body.menuPreferences)
    ? body.menuPreferences
    : [];
  const categoryPreferences = Array.isArray(body.categoryPreferences)
    ? body.categoryPreferences
    : [];
  const tagPreferences = Array.isArray(body.tagPreferences)
    ? body.tagPreferences
    : [];
  const allergyIds = Array.isArray(body.allergyIds) ? body.allergyIds : [];

  await replaceRows(
    ctx,
    "user_menu_preferences",
    menuPreferences.map((item) => ({
      user_id: userId,
      menu_id: Number((item as Record<string, unknown>).menuId),
      preference_score: Number(
        (item as Record<string, unknown>).preferenceScore,
      ),
      updated_at: now,
    })),
    userId,
  );

  await replaceRows(
    ctx,
    "user_category_preferences",
    categoryPreferences.map((item) => ({
      user_id: userId,
      category_id: Number((item as Record<string, unknown>).categoryId),
      preference_score: Number(
        (item as Record<string, unknown>).preferenceScore,
      ),
      updated_at: now,
    })),
    userId,
  );

  await replaceRows(
    ctx,
    "user_tag_preferences",
    tagPreferences.map((item) => ({
      user_id: userId,
      tag_id: Number((item as Record<string, unknown>).tagId),
      preference_score: Number(
        (item as Record<string, unknown>).preferenceScore,
      ),
      updated_at: now,
    })),
    userId,
  );

  await replaceRows(
    ctx,
    "user_allergies",
    allergyIds.map((allergyId) => ({
      user_id: userId,
      allergy_id: Number(allergyId),
    })),
    userId,
  );

  return ok({ updated: true }, 200, "선호도가 저장되었습니다.");
}

async function loadRecommendationBase(admin: SupabaseClient) {
  const [menus, tagRows, allergyRows, suitabilityRows] = await Promise.all([
    admin.from("menus").select("*").order("menu_id"),
    admin.from("menu_tags").select("menu_id, tag_id, tags(tag_id, name)"),
    admin.from("menu_allergies").select("menu_id, allergy_id"),
    admin.from("menu_purpose_suitability").select(
      "menu_id, meeting_purpose_id, suitability_score",
    ),
  ]);

  for (const result of [menus, tagRows, allergyRows, suitabilityRows]) {
    if (result.error) throw result.error;
  }

  const tagsByMenu = new Map<number, { tagId: number; name: string }[]>();
  for (const row of tagRows.data ?? []) {
    const current = tagsByMenu.get(row.menu_id) ?? [];
    const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags;
    if (tag) current.push({ tagId: tag.tag_id, name: tag.name });
    tagsByMenu.set(row.menu_id, current);
  }

  const allergiesByMenu = new Map<number, Set<number>>();
  for (const row of allergyRows.data ?? []) {
    const current = allergiesByMenu.get(row.menu_id) ?? new Set<number>();
    current.add(row.allergy_id);
    allergiesByMenu.set(row.menu_id, current);
  }

  const suitabilityByMenuPurpose = new Map<string, number>();
  for (const row of suitabilityRows.data ?? []) {
    suitabilityByMenuPurpose.set(
      `${row.menu_id}:${row.meeting_purpose_id}`,
      row.suitability_score,
    );
  }

  return {
    menus: (menus.data ?? []) as MenuRow[],
    tagsByMenu,
    allergiesByMenu,
    suitabilityByMenuPurpose,
  };
}

async function loadUserSignals(admin: SupabaseClient, userIds: number[]) {
  const [menuPrefs, categoryPrefs, tagPrefs, allergies, history] = await Promise
    .all([
      admin.from("user_menu_preferences").select("*").in("user_id", userIds),
      admin.from("user_category_preferences").select("*").in(
        "user_id",
        userIds,
      ),
      admin.from("user_tag_preferences").select("*").in("user_id", userIds),
      admin.from("user_allergies").select("*").in("user_id", userIds),
      admin.from("meal_history").select("*").in("user_id", userIds),
    ]);

  for (
    const result of [menuPrefs, categoryPrefs, tagPrefs, allergies, history]
  ) {
    if (result.error) throw result.error;
  }

  return {
    menuPrefs: menuPrefs.data ?? [],
    categoryPrefs: categoryPrefs.data ?? [],
    tagPrefs: tagPrefs.data ?? [],
    allergies: allergies.data ?? [],
    history: history.data ?? [],
  };
}

function scoreMenuForUser(options: {
  menu: MenuRow;
  userId: number;
  meetingPurposeId?: number;
  config: RecommendationConfig;
  includeNewMenu: boolean;
  tagsByMenu: Map<number, { tagId: number; name: string }[]>;
  allergiesByMenu: Map<number, Set<number>>;
  suitabilityByMenuPurpose: Map<string, number>;
  signals: Awaited<ReturnType<typeof loadUserSignals>>;
}) {
  const {
    menu,
    userId,
    meetingPurposeId,
    config,
    includeNewMenu,
    tagsByMenu,
    allergiesByMenu,
    suitabilityByMenuPurpose,
    signals,
  } = options;

  const userAllergies = new Set(
    signals.allergies.filter((row) => row.user_id === userId).map((row) =>
      row.allergy_id
    ),
  );
  const menuAllergies = allergiesByMenu.get(menu.menu_id) ?? new Set<number>();
  for (const allergyId of menuAllergies) {
    if (userAllergies.has(allergyId)) return null;
  }

  const menuPref = signals.menuPrefs.find(
    (row) => row.user_id === userId && row.menu_id === menu.menu_id,
  )?.preference_score ?? 0;
  const categoryPref = signals.categoryPrefs.find(
    (row) => row.user_id === userId && row.category_id === menu.category_id,
  )?.preference_score ?? 0;

  const tags = tagsByMenu.get(menu.menu_id) ?? [];
  const tagScores = tags.map((tag) => {
    const pref = signals.tagPrefs.find((row) =>
      row.user_id === userId && row.tag_id === tag.tagId
    );
    return pref?.preference_score ?? 0;
  });
  const tagScore = tagScores.length
    ? tagScores.reduce((sum, score) => sum + score, 0) / tagScores.length
    : 0;

  const suitability = meetingPurposeId
    ? suitabilityByMenuPurpose.get(`${menu.menu_id}:${meetingPurposeId}`) ?? 0
    : 0;
  if (
    meetingPurposeId &&
    config.purposeSuitabilityRule === "exclude_if_score_zero" &&
    suitability <= 0
  ) {
    return null;
  }

  const userHistory = signals.history.filter((row) => row.user_id === userId);
  const now = Date.now();
  const recentDuplicateDays = config.recentDuplicateDays;
  const cutoff = now - recentDuplicateDays * 24 * 60 * 60 * 1000;
  const recentSameMenuAges = recentDuplicateDays > 0
    ? userHistory
      .filter((row) =>
        row.menu_id === menu.menu_id &&
        new Date(row.eaten_at).getTime() >= cutoff
      )
      .map((row) =>
        Math.max(0, (now - new Date(row.eaten_at).getTime()) / 86400000)
      )
    : [];
  const recentDuplicatePenalty = recentSameMenuAges.length
    ? 3 - (3 * Math.min(...recentSameMenuAges)) / recentDuplicateDays
    : 0;
  const triedBefore = userHistory.some((row) => row.menu_id === menu.menu_id);
  const isNewSuggestion = !triedBefore;
  const hasStrongDislike = menuPref <= config.strongDislikeScore ||
    categoryPref <= config.strongDislikeScore ||
    tagScores.some((score) => score <= config.strongDislikeScore);

  let score = 50;
  score += (menuPref * config.menuPreference +
    categoryPref * config.categoryPreference +
    tagScore * config.tagPreference) * 10;
  score += suitability * 5;
  score -= recentDuplicatePenalty;
  if (includeNewMenu && isNewSuggestion) score += 4;
  if (hasStrongDislike) score -= config.strongDislikePenalty;

  const reasons = [];
  if (menuPref > 0) reasons.push("메뉴 선호도가 높습니다");
  if (categoryPref > 0) reasons.push("선호 카테고리에 속합니다");
  if (tagScore > 0) reasons.push("선호 태그와 잘 맞습니다");
  if (suitability > 0) reasons.push("식사 목적 적합도가 높습니다");
  if (hasStrongDislike) {
    reasons.push("강한 비선호 조건이 있어 점수를 낮췄습니다");
  }
  if (recentDuplicatePenalty > 0) {
    reasons.push("최근 먹은 기록이 있어 점수를 낮췄습니다");
  }
  if (isNewSuggestion) {
    reasons.push("최근 식사 기록에 없어 새로운 선택지입니다");
  }

  return {
    menu,
    score,
    reason: reasons.length
      ? reasons.join(", ") + "."
      : "기본 조건을 만족하는 메뉴입니다.",
    isNewSuggestion,
  };
}

async function handlePersonalRecommendation(
  ctx: AppContext,
  body: Record<string, unknown>,
) {
  const meetingPurposeId = numberOrUndefined(body.meetingPurposeId);
  const config = recommendationConfigFromBody(body);
  const includeNewMenu = body.includeNewMenu !== false;

  const base = await loadRecommendationBase(ctx.admin);
  const signals = await loadUserSignals(ctx.admin, [ctx.profile.user_id]);

  const scored = base.menus
    .map((menu) =>
      scoreMenuForUser({
        menu,
        userId: ctx.profile.user_id,
        meetingPurposeId,
        config,
        includeNewMenu,
        tagsByMenu: base.tagsByMenu,
        allergiesByMenu: base.allergiesByMenu,
        suitabilityByMenuPurpose: base.suitabilityByMenuPurpose,
        signals,
      })
    )
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score)
    .slice(0, config.resultLimit)
    .map((item, index) => ({
      rankNo: index + 1,
      menuId: item!.menu.menu_id,
      menuName: item!.menu.name,
      totalScore: Number(item!.score.toFixed(2)),
      reason: item!.reason,
      isNewSuggestion: item!.isNewSuggestion,
    }));

  return ok({ config, results: scored });
}

async function handleMeetings(
  ctx: AppContext,
  method: string,
  path: string,
  body: Record<string, unknown>,
) {
  if (method === "POST" && path === "/meetings") {
    const title = typeof body.title === "string" ? body.title : null;
    const meetingTime = requireString(body, "meetingTime");
    const meetingPurposeId = Number(body.meetingPurposeId);
    const location = typeof body.location === "string" ? body.location : null;

    const { data, error } = await ctx.admin
      .from("meetings")
      .insert({
        title,
        meeting_time: meetingTime,
        meeting_purpose_id: meetingPurposeId,
        location,
        created_by: ctx.profile.user_id,
        status: "CREATED",
      })
      .select("*")
      .single();

    if (error) throw error;

    await ctx.admin.from("meeting_participants").insert({
      meeting_id: data.meeting_id,
      user_id: ctx.profile.user_id,
      display_name: ctx.profile.nickname,
      attendance_status: "JOINED",
      joined_at: new Date().toISOString(),
    });

    return ok(
      {
        meetingId: data.meeting_id,
        title: data.title,
        status: data.status,
        createdBy: data.created_by,
      },
      201,
      "모임이 생성되었습니다.",
    );
  }

  if (method === "GET" && path === "/meetings") {
    const { data: own, error: ownError } = await ctx.admin
      .from("meetings")
      .select("*")
      .eq("created_by", ctx.profile.user_id)
      .order("created_at", { ascending: false });

    if (ownError) throw ownError;

    const { data: participantRows, error: participantError } = await ctx.admin
      .from("meeting_participants")
      .select("meeting_id")
      .eq("user_id", ctx.profile.user_id)
      .neq("attendance_status", "DECLINED");

    if (participantError) throw participantError;

    const meetingIds = [
      ...new Set(participantRows?.map((row) => row.meeting_id) ?? []),
    ];
    const { data: joined, error: joinedError } = meetingIds.length
      ? await ctx.admin.from("meetings").select("*").in(
        "meeting_id",
        meetingIds,
      )
      : { data: [], error: null };

    if (joinedError) throw joinedError;

    const byId = new Map<number, unknown>();
    for (const meeting of [...(own ?? []), ...(joined ?? [])]) {
      byId.set(meeting.meeting_id, meeting);
    }
    return ok({ items: [...byId.values()] });
  }

  const match = path.match(/^\/meetings\/(\d+)$/);
  if (match) {
    const meetingId = Number(match[1]);
    const meeting = await assertMeetingVisible(ctx, meetingId);
    if (!meeting) return fail(404, "NOT_FOUND", "모임을 찾을 수 없습니다.");

    if (method === "GET") {
      const { data: participants, error } = await ctx.admin
        .from("meeting_participants")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("participant_id");
      if (error) throw error;
      return ok({ ...meeting, participants });
    }

    if (method === "PATCH") {
      if (meeting.created_by !== ctx.profile.user_id) {
        return fail(403, "FORBIDDEN", "모임 수정 권한이 없습니다.");
      }

      const update: Record<string, unknown> = {};
      if (typeof body.title === "string") update.title = body.title;
      if (typeof body.meetingTime === "string") {
        update.meeting_time = body.meetingTime;
      }
      if (body.meetingPurposeId !== undefined) {
        update.meeting_purpose_id = Number(body.meetingPurposeId);
      }
      if (typeof body.location === "string") update.location = body.location;
      if (typeof body.status === "string") update.status = body.status;

      const { data, error } = await ctx.admin
        .from("meetings")
        .update(update)
        .eq("meeting_id", meetingId)
        .select("*")
        .single();

      if (error) throw error;
      return ok(data);
    }
  }

  return null;
}

async function handleParticipants(
  ctx: AppContext,
  method: string,
  path: string,
  body: Record<string, unknown>,
) {
  const listMatch = path.match(/^\/meetings\/(\d+)\/participants$/);
  if (listMatch) {
    const meetingId = Number(listMatch[1]);
    const meeting = await assertMeetingVisible(ctx, meetingId);
    if (!meeting) return fail(404, "NOT_FOUND", "모임을 찾을 수 없습니다.");

    if (method === "GET") {
      const { data, error } = await ctx.admin
        .from("meeting_participants")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("participant_id");
      if (error) throw error;
      return ok({ items: data });
    }

    if (method === "POST") {
      if (meeting.created_by !== ctx.profile.user_id) {
        return fail(403, "FORBIDDEN", "참여자 추가 권한이 없습니다.");
      }

      const displayName = requireString(body, "displayName");
      const userId = body.userId === null || body.userId === undefined
        ? null
        : Number(body.userId);
      const attendanceStatus = typeof body.attendanceStatus === "string"
        ? body.attendanceStatus
        : "PENDING";

      const { data, error } = await ctx.admin
        .from("meeting_participants")
        .insert({
          meeting_id: meetingId,
          user_id: userId,
          display_name: displayName,
          attendance_status: attendanceStatus,
          joined_at: attendanceStatus === "JOINED"
            ? new Date().toISOString()
            : null,
        })
        .select("*")
        .single();

      if (error) throw error;
      return ok(data, 201);
    }
  }

  const updateMatch = path.match(/^\/meetings\/(\d+)\/participants\/(\d+)$/);
  if (updateMatch && method === "PATCH") {
    const meetingId = Number(updateMatch[1]);
    const participantId = Number(updateMatch[2]);
    const meeting = await assertMeetingVisible(ctx, meetingId);
    if (!meeting) return fail(404, "NOT_FOUND", "모임을 찾을 수 없습니다.");

    const { data: participant, error: participantError } = await ctx.admin
      .from("meeting_participants")
      .select("*")
      .eq("participant_id", participantId)
      .eq("meeting_id", meetingId)
      .maybeSingle();

    if (participantError) throw participantError;
    if (!participant) {
      return fail(404, "NOT_FOUND", "참여자를 찾을 수 없습니다.");
    }

    const canUpdate = meeting.created_by === ctx.profile.user_id ||
      participant.user_id === ctx.profile.user_id;
    if (!canUpdate) {
      return fail(403, "FORBIDDEN", "참여자 수정 권한이 없습니다.");
    }

    const update: Record<string, unknown> = {};
    if (typeof body.displayName === "string") {
      update.display_name = body.displayName;
    }
    if (typeof body.attendanceStatus === "string") {
      update.attendance_status = body.attendanceStatus;
      update.joined_at = body.attendanceStatus === "JOINED"
        ? new Date().toISOString()
        : participant.joined_at;
    }

    const { data, error } = await ctx.admin
      .from("meeting_participants")
      .update(update)
      .eq("participant_id", participantId)
      .select("*")
      .single();

    if (error) throw error;
    return ok(data);
  }

  return null;
}

async function handleMeetingRecommendations(
  ctx: AppContext,
  method: string,
  path: string,
  body: Record<string, unknown>,
) {
  const recommendMatch = path.match(/^\/meetings\/(\d+)\/recommendations$/);
  if (recommendMatch && method === "POST") {
    const meetingId = Number(recommendMatch[1]);
    const meeting = await assertMeetingCreator(ctx, meetingId);
    if (!meeting) return fail(404, "NOT_FOUND", "모임을 찾을 수 없습니다.");
    if (meeting === "FORBIDDEN") {
      return fail(403, "FORBIDDEN", "추천 생성 권한이 없습니다.");
    }

    const config = recommendationConfigFromBody(body);
    const algorithmVersion = typeof body.algorithmVersion === "string"
      ? body.algorithmVersion
      : ALGORITHM_VERSION;

    const { data: participants, error: participantError } = await ctx.admin
      .from("meeting_participants")
      .select("user_id")
      .eq("meeting_id", meetingId)
      .eq("attendance_status", "JOINED")
      .not("user_id", "is", null);

    if (participantError) throw participantError;

    const userIds = [
      ...new Set([
        ctx.profile.user_id,
        ...((participants ?? []).map((p) => p.user_id) as number[]),
      ]),
    ];
    const base = await loadRecommendationBase(ctx.admin);
    const signals = await loadUserSignals(ctx.admin, userIds);

    const scored = base.menus
      .map((menu) => {
        const perUser = userIds
          .map((userId) =>
            scoreMenuForUser({
              menu,
              userId,
              meetingPurposeId: meeting.meeting_purpose_id,
              config,
              includeNewMenu: true,
              tagsByMenu: base.tagsByMenu,
              allergiesByMenu: base.allergiesByMenu,
              suitabilityByMenuPurpose: base.suitabilityByMenuPurpose,
              signals,
            })
          )
          .filter(Boolean);

        if (perUser.length !== userIds.length) return null;

        const scores = perUser.map((item) => item!.score);
        const average = scores.reduce((sum, score) => sum + score, 0) /
          scores.length;
        const minimum = Math.min(...scores);
        const totalScore = average * config.averageScore +
          minimum * config.minimumScore;

        return {
          menu,
          score: totalScore,
          reason:
            `참여자 ${userIds.length}명의 평균 선호도와 최저 선호도를 함께 반영했습니다. ` +
            perUser[0]!.reason,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, config.resultLimit);

    const firstPickCounts = new Map<number, number>();
    for (const userId of userIds) {
      const topPick = base.menus
        .map((menu) =>
          scoreMenuForUser({
            menu,
            userId,
            meetingPurposeId: meeting.meeting_purpose_id,
            config,
            includeNewMenu: true,
            tagsByMenu: base.tagsByMenu,
            allergiesByMenu: base.allergiesByMenu,
            suitabilityByMenuPurpose: base.suitabilityByMenuPurpose,
            signals,
          })
        )
        .filter(Boolean)
        .sort((a, b) => b!.score - a!.score)[0];

      if (topPick) {
        firstPickCounts.set(
          topPick.menu.menu_id,
          (firstPickCounts.get(topPick.menu.menu_id) ?? 0) + 1,
        );
      }
    }

    const majorityFirstPick = [...firstPickCounts.entries()]
      .map(([menuId, count]) => {
        const ranked = scored.find((item) => item!.menu.menu_id === menuId);
        const menu = ranked?.menu ??
          base.menus.find((item) => item.menu_id === menuId);
        return menu
          ? {
            menuId,
            menuName: menu.name,
            count,
            totalScore: ranked ? Number(ranked.score.toFixed(2)) : null,
          }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) =>
        b!.count - a!.count ||
        ((b!.totalScore ?? 0) - (a!.totalScore ?? 0))
      )[0] ?? null;

    const { data: run, error: runError } = await ctx.admin
      .from("recommendation_runs")
      .insert({
        meeting_id: meetingId,
        algorithm_version: algorithmVersion,
        config_json: config,
      })
      .select("*")
      .single();

    if (runError) throw runError;

    const recommendationRows = scored.map((item, index) => ({
      run_id: run.run_id,
      menu_id: item!.menu.menu_id,
      rank_no: index + 1,
      total_score: Number(item!.score.toFixed(2)),
      reason: item!.reason,
    }));

    if (recommendationRows.length) {
      const { error } = await ctx.admin.from("meeting_recommendations").insert(
        recommendationRows,
      );
      if (error) throw error;
    }

    await ctx.admin.from("meetings").update({ status: "RECOMMENDED" }).eq(
      "meeting_id",
      meetingId,
    );

    const results: RecommendationResult[] = scored.map((item, index) => ({
      rankNo: index + 1,
      menuId: item!.menu.menu_id,
      menuName: item!.menu.name,
      totalScore: Number(item!.score.toFixed(2)),
      reason: item!.reason,
    }));

    return ok(
      {
        runId: run.run_id,
        meetingId,
        algorithmVersion,
        config,
        majorityFirstPick,
        results,
      },
      201,
      "모임 추천 결과가 생성되었습니다.",
    );
  }

  const latestMatch = path.match(
    /^\/meetings\/(\d+)\/recommendations\/latest$/,
  );
  if (latestMatch && method === "GET") {
    const meetingId = Number(latestMatch[1]);
    const meeting = await assertMeetingVisible(ctx, meetingId);
    if (!meeting) return fail(404, "NOT_FOUND", "모임을 찾을 수 없습니다.");

    const { data: run, error: runError } = await ctx.admin
      .from("recommendation_runs")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (runError) throw runError;
    if (!run) return ok({ runId: null, results: [] });

    const { data: recommendations, error } = await ctx.admin
      .from("meeting_recommendations")
      .select("*, menus(menu_id, name)")
      .eq("run_id", run.run_id)
      .order("rank_no");

    if (error) throw error;

    return ok({
      runId: run.run_id,
      generatedAt: run.generated_at,
      config: run.config_json ?? null,
      results: recommendations?.map((row) => ({
        rankNo: row.rank_no,
        menuId: row.menu_id,
        menuName: Array.isArray(row.menus)
          ? row.menus[0]?.name
          : row.menus?.name,
        totalScore: Number(row.total_score),
        reason: row.reason,
      })) ?? [],
    });
  }

  const selectedMatch = path.match(/^\/meetings\/(\d+)\/selected-menu$/);
  if (selectedMatch && method === "PATCH") {
    const meetingId = Number(selectedMatch[1]);
    const meeting = await assertMeetingCreator(ctx, meetingId);
    if (!meeting) return fail(404, "NOT_FOUND", "모임을 찾을 수 없습니다.");
    if (meeting === "FORBIDDEN") {
      return fail(403, "FORBIDDEN", "최종 메뉴 선택 권한이 없습니다.");
    }

    const menuId = Number(body.menuId);
    const { data, error } = await ctx.admin
      .from("meetings")
      .update({ selected_menu_id: menuId, status: "DECIDED" })
      .eq("meeting_id", meetingId)
      .select("meeting_id, selected_menu_id, status")
      .single();

    if (error) throw error;
    return ok(
      {
        meetingId: data.meeting_id,
        selectedMenuId: data.selected_menu_id,
        status: data.status,
      },
      200,
      "최종 메뉴가 선택되었습니다.",
    );
  }

  return null;
}

async function handleMealHistory(
  ctx: AppContext,
  method: string,
  path: string,
  req: Request,
  body: Record<string, unknown>,
) {
  if (method === "POST" && path === "/meal-history") {
    const menuId = Number(body.menuId);
    const eatenAt = typeof body.eatenAt === "string"
      ? body.eatenAt
      : new Date().toISOString();
    const rating = body.rating === undefined || body.rating === null
      ? null
      : Number(body.rating);
    const memo = typeof body.memo === "string" ? body.memo : null;

    const { data, error } = await ctx.admin
      .from("meal_history")
      .insert({
        user_id: ctx.profile.user_id,
        menu_id: menuId,
        eaten_at: eatenAt,
        rating,
        memo,
      })
      .select("*")
      .single();

    if (error) throw error;
    return ok(
      {
        historyId: data.history_id,
        menuId: data.menu_id,
        rating: data.rating,
      },
      201,
      "식사 기록이 저장되었습니다.",
    );
  }

  if (method === "GET" && path === "/meal-history/me") {
    const url = new URL(req.url);
    const limit = Math.min(
      numberOrUndefined(url.searchParams.get("limit")) ?? 50,
      100,
    );

    const { data, error } = await ctx.admin
      .from("meal_history")
      .select("*, menus(menu_id, name)")
      .eq("user_id", ctx.profile.user_id)
      .order("eaten_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ok({ items: data });
  }

  const match = path.match(/^\/meal-history\/(\d+)$/);
  if (match) {
    const historyId = Number(match[1]);

    if (method === "PATCH") {
      const update: Record<string, unknown> = {};
      if (body.menuId !== undefined) update.menu_id = Number(body.menuId);
      if (typeof body.eatenAt === "string") update.eaten_at = body.eatenAt;
      if (body.rating !== undefined) {
        update.rating = body.rating === null ? null : Number(body.rating);
      }
      if (typeof body.memo === "string" || body.memo === null) {
        update.memo = body.memo;
      }

      const { data, error } = await ctx.admin
        .from("meal_history")
        .update(update)
        .eq("history_id", historyId)
        .eq("user_id", ctx.profile.user_id)
        .select("*")
        .maybeSingle();

      if (error) throw error;
      if (!data) return fail(404, "NOT_FOUND", "식사 기록을 찾을 수 없습니다.");
      return ok(data);
    }

    if (method === "DELETE") {
      const { error } = await ctx.admin
        .from("meal_history")
        .delete()
        .eq("history_id", historyId)
        .eq("user_id", ctx.profile.user_id);

      if (error) throw error;
      return ok({ deleted: true });
    }
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const method = req.method.toUpperCase();
    const path = normalizePath(req);
    const body = ["POST", "PUT", "PATCH"].includes(method)
      ? ((await readJson(req)) as Record<string, unknown>)
      : {};

    if (method === "POST" && path === "/auth/signup") {
      return await handleSignup(body);
    }
    if (method === "POST" && path === "/auth/login") {
      return await handleLogin(body);
    }

    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;
    const ctx = auth;

    if (method === "POST" && path === "/auth/logout") {
      const { error } = await ctx.client.auth.signOut();
      if (error) return fail(400, "VALIDATION_ERROR", error.message);
      return ok({ loggedOut: true });
    }

    if (method === "GET" && path === "/users/me") {
      return ok({ user: toCamelUser(ctx.profile) });
    }

    if (method === "PATCH" && path === "/users/me") {
      const update: Record<string, unknown> = {};
      if (typeof body.nickname === "string") update.nickname = body.nickname;
      if (typeof body.userType === "string") update.user_type = body.userType;

      const { data, error } = await ctx.admin
        .from("users")
        .update(update)
        .eq("user_id", ctx.profile.user_id)
        .select("user_id, auth_user_id, email, nickname, user_type")
        .single();

      if (error) throw error;
      return ok({ user: toCamelUser(data as UserProfile) });
    }

    const masterDataResponse = await handleMasterData(ctx, path, req);
    if (masterDataResponse) return masterDataResponse;

    if (method === "GET" && path === "/preferences/me") {
      return await handleGetPreferences(ctx);
    }
    if (method === "PUT" && path === "/preferences/me") {
      return await handlePutPreferences(ctx, body);
    }
    if (method === "POST" && path === "/recommendations/personal") {
      return await handlePersonalRecommendation(ctx, body);
    }

    const meetingsResponse = await handleMeetings(ctx, method, path, body);
    if (meetingsResponse) return meetingsResponse;

    const participantsResponse = await handleParticipants(
      ctx,
      method,
      path,
      body,
    );
    if (participantsResponse) return participantsResponse;

    const meetingRecommendationsResponse = await handleMeetingRecommendations(
      ctx,
      method,
      path,
      body,
    );
    if (meetingRecommendationsResponse) return meetingRecommendationsResponse;

    const mealHistoryResponse = await handleMealHistory(
      ctx,
      method,
      path,
      req,
      body,
    );
    if (mealHistoryResponse) return mealHistoryResponse;

    return fail(404, "NOT_FOUND", "API 경로를 찾을 수 없습니다.", {
      method,
      path,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_JSON") {
      return fail(
        400,
        "VALIDATION_ERROR",
        "JSON 요청 본문이 올바르지 않습니다.",
      );
    }

    if (error instanceof Error && error.message.startsWith("MISSING_")) {
      return fail(400, "VALIDATION_ERROR", "필수 요청 값이 누락되었습니다.", {
        field: error.message.replace("MISSING_", "").toLowerCase(),
      });
    }

    console.error(error);
    return fail(
      500,
      "INTERNAL_SERVER_ERROR",
      "서버 내부 오류가 발생했습니다.",
      {
        message: error instanceof Error ? error.message : String(error),
      },
    );
  }
});
