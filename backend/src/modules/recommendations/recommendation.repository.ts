import { supabaseAdmin } from "../../config/supabase.js";

export const recommendationRepository = {
  async loadRecommendationBase(userId: number) {
    const [menus, menuTags, menuAllergies, categoryPreferences, tagPreferences, menuPreferences, userAllergies, history] = await Promise.all([
      supabaseAdmin
        .from("menus")
        .select("menu_id, category_id, name, description, spicy_level, price_level, calorie, menu_categories(category_id, name)")
        .order("menu_id"),
      supabaseAdmin.from("menu_tags").select("menu_id, tag_id"),
      supabaseAdmin.from("menu_allergies").select("menu_id, allergy_id"),
      supabaseAdmin.from("user_category_preferences").select("category_id, preference_score").eq("user_id", userId),
      supabaseAdmin.from("user_tag_preferences").select("tag_id, preference_score").eq("user_id", userId),
      supabaseAdmin.from("user_menu_preferences").select("menu_id, preference_score").eq("user_id", userId),
      supabaseAdmin.from("user_allergies").select("allergy_id").eq("user_id", userId),
      supabaseAdmin.from("meal_history").select("menu_id, eaten_at, rating").eq("user_id", userId).order("eaten_at", { ascending: false })
    ]);

    for (const result of [menus, menuTags, menuAllergies, categoryPreferences, tagPreferences, menuPreferences, userAllergies, history]) {
      if (result.error) throw result.error;
    }

    return {
      menus: menus.data ?? [],
      menuTags: menuTags.data ?? [],
      menuAllergies: menuAllergies.data ?? [],
      categoryPreferences: categoryPreferences.data ?? [],
      tagPreferences: tagPreferences.data ?? [],
      menuPreferences: menuPreferences.data ?? [],
      userAllergies: userAllergies.data ?? [],
      history: history.data ?? []
    };
  }
};
