import { supabaseAdmin } from "../../config/supabase.js";
import type {
  MenuRecommendationFeatureRow,
  PersonalRecommendationRequest,
  RecommendationBaseData,
  RecommendationResult
} from "./recommendation.dto.js";

const GLOBAL_RECOMMENDATION_DATA_TTL_MS = 5 * 60 * 1000;
let menuFeatureCache: {
  expiresAt: number;
  data: MenuRecommendationFeatureRow[] | null;
  promise: Promise<MenuRecommendationFeatureRow[]> | null;
} = {
  expiresAt: 0,
  data: null,
  promise: null
};

export const recommendationRepository = {
  async loadRecommendationBase(userId: number): Promise<RecommendationBaseData> {
    const [
      menus,
      userMenuPreferences,
      userCategoryPreferences,
      userTagPreferences,
      userAllergies,
      mealHistory,
      userPreference
    ] = await Promise.all([
      getMenuFeatures(),

      supabaseAdmin
        .from("user_menu_preferences")
        .select("menu_id, preference_score")
        .eq("user_id", userId),

      supabaseAdmin
        .from("user_category_preferences")
        .select("category_id, preference_score")
        .eq("user_id", userId),

      supabaseAdmin
        .from("user_tag_preferences")
        .select("tag_id, preference_score")
        .eq("user_id", userId),

      supabaseAdmin
        .from("user_allergies")
        .select("allergy_id")
        .eq("user_id", userId),

      supabaseAdmin
        .from("meal_history")
        .select("menu_id, eaten_at, rating")
        .eq("user_id", userId)
        .order("eaten_at", { ascending: false }),

      supabaseAdmin
        .from("user_preferences")
        .select("budget_min, budget_max")
        .eq("user_id", userId)
        .maybeSingle()
    ]);

    for (const result of [
      userMenuPreferences,
      userCategoryPreferences,
      userTagPreferences,
      userAllergies,
      mealHistory,
      userPreference
    ]) {
      if (result.error) throw result.error;
    }

    return {
      menus,
      userMenuPreferences: userMenuPreferences.data ?? [],
      userCategoryPreferences: userCategoryPreferences.data ?? [],
      userTagPreferences: userTagPreferences.data ?? [],
      userAllergyIds: (userAllergies.data ?? []).map((row) => Number(row.allergy_id)),
      mealHistory: mealHistory.data ?? [],
      userPreference: userPreference.data ?? null
    };
  },

  async savePersonalRun(userId: number, results: RecommendationResult[], input: PersonalRecommendationRequest) {
    const { data: run, error: runError } = await supabaseAdmin
      .from("personal_recommendation_runs")
      .insert({
        user_id: userId,
        algorithm_version: "personal-simple-v2",
        config_json: input
      })
      .select("run_id")
      .single();

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
            is_new_suggestion: item.isNewSuggestion
          }))
        );

      if (error) throw error;
    }

    return { runId: Number(run.run_id) };
  }
};

async function getMenuFeatures(): Promise<MenuRecommendationFeatureRow[]> {
  const now = Date.now();
  if (menuFeatureCache.data && menuFeatureCache.expiresAt > now) {
    return menuFeatureCache.data;
  }

  if (menuFeatureCache.promise) {
    return menuFeatureCache.promise;
  }

  menuFeatureCache.promise = loadMenuFeatures().then((data) => {
    menuFeatureCache = {
      data,
      expiresAt: Date.now() + GLOBAL_RECOMMENDATION_DATA_TTL_MS,
      promise: null
    };
    return data;
  }).catch((error) => {
    menuFeatureCache.promise = null;
    throw error;
  });

  return menuFeatureCache.promise;
}

async function loadMenuFeatures(): Promise<MenuRecommendationFeatureRow[]> {
  const { data, error } = await supabaseAdmin
    .from("menu_recommendation_features")
    .select("menu_id, category_id, category_name, name, price_level, tag_ids, allergy_ids")
    .order("menu_id");

  if (error) throw error;
  return data ?? [];
}
