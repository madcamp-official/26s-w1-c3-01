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
      mealHistory
    ] = await Promise.all([
      supabaseAdmin
        .from("menus")
        .select("menu_id, category_id, name, description, spicy_level, price_level, calorie")
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
        .order("eaten_at", { ascending: false })
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
      mealHistory
    ]) {
      if (result.error) throw result.error;
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
      mealHistory: (mealHistory.data ?? []) as RecommendationBaseData["mealHistory"]
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
            reason: item.reason,
            is_new_suggestion: item.isNewSuggestion ?? false
          }))
        );

      if (error) throw error;
    }

    return { runId: Number(run.run_id) };
  }
};