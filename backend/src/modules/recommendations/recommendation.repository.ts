import { supabaseAdmin } from "../../config/supabase.js";
import type {
  PersonalRecommendationRequest,
  RecommendationBaseData,
  RecommendationResult
} from "./recommendation.dto.js";

export const recommendationRepository = {
  async loadRecommendationBase(userId: number): Promise<RecommendationBaseData> {
    const [
      menus,
      menuTags,
      menuAllergies,
      purposeSuitability,
      userMenuPreferences,
      userCategoryPreferences,
      userTagPreferences,
      userAllergies,
      mealHistory,
      allMealRatings,
      reviews,
      userPreference,
      userMenuInteractions,
      allMenuInteractions
    ] = await Promise.all([
      supabaseAdmin
        .from("menus")
        .select("menu_id, category_id, name, description, spicy_level, price_level, calorie, menu_categories(category_id, name)")
        .order("menu_id"),

      supabaseAdmin
        .from("menu_tags")
        .select("menu_id, tag_id"),

      supabaseAdmin
        .from("menu_allergies")
        .select("menu_id, allergy_id"),

      supabaseAdmin
        .from("menu_purpose_suitability")
        .select("menu_id, meeting_purpose_id, suitability_score"),

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

      // 최근 식사 제외와 과거 평점 반영을 위해 식사 기록을 함께 읽습니다.
      supabaseAdmin
        .from("meal_history")
        .select("menu_id, rating, eaten_at")
        .eq("user_id", userId)
        .order("eaten_at", { ascending: false }),

      supabaseAdmin
        .from("meal_history")
        .select("menu_id, rating, eaten_at")
        .not("rating", "is", null),

      optionalRows(
        supabaseAdmin
          .from("reviews")
          .select("menu_id, rating")
      ),

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
          .select("user_id, menu_id, interaction_type, created_at")
          .eq("user_id", userId)
      ),

      optionalRows(
        supabaseAdmin
          .from("user_menu_interactions")
          .select("user_id, menu_id, interaction_type, created_at")
      )
    ]);

    for (const result of [
      menus,
      menuTags,
      menuAllergies,
      purposeSuitability,
      userMenuPreferences,
      userCategoryPreferences,
      userTagPreferences,
      userAllergies,
      mealHistory,
      allMealRatings,
      reviews,
      userPreference,
      userMenuInteractions,
      allMenuInteractions
    ]) {
      if ("error" in result && result.error) throw result.error;
    }

    return {
      menus: (menus.data ?? []) as RecommendationBaseData["menus"],
      menuTags: (menuTags.data ?? []) as RecommendationBaseData["menuTags"],
      menuAllergies: (menuAllergies.data ?? []) as RecommendationBaseData["menuAllergies"],
      purposeSuitability: (purposeSuitability.data ?? []) as RecommendationBaseData["purposeSuitability"],
      userMenuPreferences: (userMenuPreferences.data ?? []) as RecommendationBaseData["userMenuPreferences"],
      userCategoryPreferences: (userCategoryPreferences.data ?? []) as RecommendationBaseData["userCategoryPreferences"],
      userTagPreferences: (userTagPreferences.data ?? []) as RecommendationBaseData["userTagPreferences"],
      userAllergies: (userAllergies.data ?? []) as RecommendationBaseData["userAllergies"],
      mealHistory: (mealHistory.data ?? []) as RecommendationBaseData["mealHistory"],
      allMealRatings: (allMealRatings.data ?? []) as RecommendationBaseData["allMealRatings"],
      reviews: (reviews.data ?? []) as RecommendationBaseData["reviews"],
      userPreference: (userPreference.data ?? null) as RecommendationBaseData["userPreference"],
      userMenuInteractions: (userMenuInteractions.data ?? []) as RecommendationBaseData["userMenuInteractions"],
      allMenuInteractions: (allMenuInteractions.data ?? []) as RecommendationBaseData["allMenuInteractions"]
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
