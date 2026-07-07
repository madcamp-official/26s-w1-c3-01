import { supabaseAdmin } from "../../config/supabase.js";
import type {
  PersonalRecommendationRequest,
  RecommendationBaseData,
  RecommendationResult
} from "./recommendation.dto.js";

type GlobalRecommendationData = Pick<
  RecommendationBaseData,
  "menus" | "menuAllergies" | "ratingStats" | "popularityStats"
>;

const GLOBAL_RECOMMENDATION_DATA_TTL_MS = 5 * 60 * 1000;
let globalRecommendationDataCache: {
  expiresAt: number;
  data: GlobalRecommendationData | null;
  promise: Promise<GlobalRecommendationData> | null;
} = {
  expiresAt: 0,
  data: null,
  promise: null
};

export const recommendationRepository = {
  async loadRecommendationBase(userId: number): Promise<RecommendationBaseData> {
    const globalDataPromise = getGlobalRecommendationData();
    const [
      globalData,
      userCategoryPreferences,
      userAllergies,
      mealHistory,
      userPreference,
      userMenuInteractions
    ] = await Promise.all([
      globalDataPromise,

      supabaseAdmin
        .from("user_category_preferences")
        .select("category_id, preference_score")
        .eq("user_id", userId),

      supabaseAdmin
        .from("user_allergies")
        .select("allergy_id")
        .eq("user_id", userId),

      // 최근 식사 제외와 과거 평점 반영을 위해 식사 기록을 함께 읽습니다.
      supabaseAdmin
        .from("meal_history")
        .select("menu_id, eaten_at")
        .eq("user_id", userId)
        .order("eaten_at", { ascending: false }),

      optionalSingle(
        supabaseAdmin
          .from("user_preferences")
          .select("budget_min, budget_max")
          .eq("user_id", userId)
          .maybeSingle()
      ),

      optionalRows(
        supabaseAdmin
          .from("user_menu_interactions")
          .select("menu_id, interaction_type, created_at")
          .eq("user_id", userId)
      )
    ]);

    for (const result of [
      userCategoryPreferences,
      userAllergies,
      mealHistory,
      userPreference,
      userMenuInteractions
    ]) {
      if ("error" in result && result.error) throw result.error;
    }

    return {
      ...globalData,
      userCategoryPreferences: (userCategoryPreferences.data ?? []) as RecommendationBaseData["userCategoryPreferences"],
      userAllergies: (userAllergies.data ?? []) as RecommendationBaseData["userAllergies"],
      mealHistory: (mealHistory.data ?? []) as RecommendationBaseData["mealHistory"],
      userPreference: (userPreference.data ?? null) as RecommendationBaseData["userPreference"],
      userMenuInteractions: (userMenuInteractions.data ?? []) as RecommendationBaseData["userMenuInteractions"]
    };
  },

  async savePersonalRun(userId: number, results: RecommendationResult[], input: PersonalRecommendationRequest) {
    const { data: run, error: runError } = await supabaseAdmin
      .from("personal_recommendation_runs")
      .insert({
        user_id: userId,
        algorithm_version: "personal-weighted-v1",
        config_json: input
      })
      .select("run_id")
      .single();

    if (isMissingRelationError(runError)) {
      return { runId: 0 };
    }
    if (runError) throw runError;

    if (results.length > 0) {
      const { error } = await supabaseAdmin
        .from("personal_recommendation_results")
        .insert(
          results.map((item) => ({
            run_id: run.run_id,
            menu_id: item.menuId,
            rank_no: item.rankNo,
            total_score: item.totalScore,
            scores_json: item.scores,
            reason: item.reason,
            is_new_suggestion: item.isNewSuggestion ?? false
          }))
        );

      if (isMissingRelationError(error)) {
        return { runId: Number(run.run_id) };
      }
      if (error) throw error;
    }

    return { runId: Number(run.run_id) };
  }
};

async function getGlobalRecommendationData(): Promise<GlobalRecommendationData> {
  const now = Date.now();
  if (globalRecommendationDataCache.data && globalRecommendationDataCache.expiresAt > now) {
    return globalRecommendationDataCache.data;
  }

  if (globalRecommendationDataCache.promise) {
    return globalRecommendationDataCache.promise;
  }

  globalRecommendationDataCache.promise = loadGlobalRecommendationData().then((data) => {
    globalRecommendationDataCache = {
      data,
      expiresAt: Date.now() + GLOBAL_RECOMMENDATION_DATA_TTL_MS,
      promise: null
    };
    return data;
  }).catch((error) => {
    globalRecommendationDataCache.promise = null;
    throw error;
  });

  return globalRecommendationDataCache.promise;
}

async function loadGlobalRecommendationData(): Promise<GlobalRecommendationData> {
  const [
    menus,
    menuAllergies,
    ratingStats,
    popularityStats
  ] = await Promise.all([
    supabaseAdmin
      .from("menus")
      .select("menu_id, category_id, name, price_level, menu_categories(category_id, name)")
      .order("menu_id"),

    supabaseAdmin
      .from("menu_allergies")
      .select("menu_id, allergy_id"),

    optionalRows(
      supabaseAdmin
        .from("menu_rating_stats")
        .select("menu_id, rating_average, rating_count")
    ),

    optionalRows(
      supabaseAdmin
        .from("menu_popularity_stats")
        .select("menu_id, popularity_raw")
    )
  ]);

  for (const result of [menus, menuAllergies, ratingStats, popularityStats]) {
    if ("error" in result && result.error) throw result.error;
  }

  return {
    menus: (menus.data ?? []) as RecommendationBaseData["menus"],
    menuAllergies: (menuAllergies.data ?? []) as RecommendationBaseData["menuAllergies"],
    ratingStats: (ratingStats.data ?? []) as RecommendationBaseData["ratingStats"],
    popularityStats: (popularityStats.data ?? []) as RecommendationBaseData["popularityStats"]
  };
}

async function optionalRows<T extends { data: unknown[] | null; error: unknown }>(
  query: PromiseLike<T>
): Promise<{ data: unknown[]; error: null }> {
  const result = await query;
  if (isMissingRelationError(result.error)) {
    return { data: [], error: null };
  }

  return {
    data: result.data ?? [],
    error: result.error as null
  };
}

async function optionalSingle<T extends { data: unknown | null; error: unknown }>(
  query: PromiseLike<T>
): Promise<{ data: unknown | null; error: null }> {
  const result = await query;
  if (isMissingRelationError(result.error)) {
    return { data: null, error: null };
  }

  return {
    data: result.data ?? null,
    error: result.error as null
  };
}

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const value = error as { code?: string; message?: string };
  return (
    value.code === "42P01" ||
    value.code === "PGRST205" ||
    value.message?.includes("Could not find the table") === true ||
    value.message?.includes("does not exist") === true
  );
}
