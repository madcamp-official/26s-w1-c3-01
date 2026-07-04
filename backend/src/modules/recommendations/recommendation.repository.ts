import { supabaseAdmin } from "../../config/supabase.js";

export const recommendationRepository = {
  async loadRecommendationBase(userId: number) {
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
      menus: menus.data ?? [],
      menuTags: menuTags.data ?? [],
      menuAllergies: menuAllergies.data ?? [],
      purposeSuitability: purposeSuitability.data ?? [],
      userMenuPreferences: userMenuPreferences.data ?? [],
      userCategoryPreferences: userCategoryPreferences.data ?? [],
      userTagPreferences: userTagPreferences.data ?? [],
      userAllergies: userAllergies.data ?? [],
      mealHistory: mealHistory.data ?? []
    };
  }
};