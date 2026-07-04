import { supabaseAdmin } from "../../config/supabase.js";
import type { ReplacePreferenceRequest } from "./preference.dto.js";

export const preferenceRepository = {
  async findByUserId(_userId: number) {
    const userId = _userId;
    const [menus, categories, tags, allergies] = await Promise.all([
      supabaseAdmin.from("user_menu_preferences").select("menu_id, preference_score, menus(menu_id, name)").eq("user_id", userId),
      supabaseAdmin.from("user_category_preferences").select("category_id, preference_score, menu_categories(category_id, name)").eq("user_id", userId),
      supabaseAdmin.from("user_tag_preferences").select("tag_id, preference_score, tags(tag_id, name)").eq("user_id", userId),
      supabaseAdmin.from("user_allergies").select("allergy_id").eq("user_id", userId)
    ]);

    for (const result of [menus, categories, tags, allergies]) {
      if (result.error) throw result.error;
    }

    return {
      menuPreferences: menus.data ?? [],
      categoryPreferences: categories.data ?? [],
      tagPreferences: tags.data ?? [],
      allergyIds: allergies.data?.map((row) => row.allergy_id) ?? []
    };
  },

  async replaceByUserId(userId: number, input: ReplacePreferenceRequest) {
    const now = new Date().toISOString();

    await replaceRows("user_menu_preferences", userId, input.menuPreferences?.map((item) => ({
      user_id: userId,
      menu_id: item.menuId,
      preference_score: item.preferenceScore,
      updated_at: now
    })) ?? []);
    await replaceRows("user_category_preferences", userId, input.categoryPreferences?.map((item) => ({
      user_id: userId,
      category_id: item.categoryId,
      preference_score: item.preferenceScore,
      updated_at: now
    })) ?? []);
    await replaceRows("user_tag_preferences", userId, input.tagPreferences?.map((item) => ({
      user_id: userId,
      tag_id: item.tagId,
      preference_score: item.preferenceScore,
      updated_at: now
    })) ?? []);
    await replaceRows("user_allergies", userId, input.allergyIds?.map((allergyId) => ({
      user_id: userId,
      allergy_id: allergyId
    })) ?? []);

    return { updated: true };
  }
};

async function replaceRows(table: string, userId: number, rows: Record<string, unknown>[]) {
  const deleteResult = await supabaseAdmin.from(table).delete().eq("user_id", userId);
  if (deleteResult.error) throw deleteResult.error;
  if (rows.length === 0) return;
  const insertResult = await supabaseAdmin.from(table).insert(rows);
  if (insertResult.error) throw insertResult.error;
}
