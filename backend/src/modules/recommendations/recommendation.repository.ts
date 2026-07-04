import { supabaseAdmin } from "../../config/supabase.js";

export const recommendationRepository = {
  async loadRecommendationBase() {
    const [menus, menuTags, menuAllergies, purposeSuitability] = await Promise.all([
      supabaseAdmin.from("menus").select("*").order("menu_id"),
      supabaseAdmin.from("menu_tags").select("menu_id, tag_id"),
      supabaseAdmin.from("menu_allergies").select("menu_id, allergy_id"),
      supabaseAdmin.from("menu_purpose_suitability").select("menu_id, meeting_purpose_id, suitability_score")
    ]);

    for (const result of [menus, menuTags, menuAllergies, purposeSuitability]) {
      if (result.error) throw result.error;
    }

    return {
      menus: menus.data ?? [],
      menuTags: menuTags.data ?? [],
      menuAllergies: menuAllergies.data ?? [],
      purposeSuitability: purposeSuitability.data ?? []
    };
  }
};
