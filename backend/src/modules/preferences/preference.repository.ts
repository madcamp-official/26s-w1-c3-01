import { supabaseAdmin } from "../../config/supabase.js";
import type { ReplacePreferenceRequest } from "./preference.dto.js";

export const preferenceRepository = {
  // 사용자 선호도 전체를 조회한다.
  // 메뉴, 카테고리, 태그, 알러지 데이터를 한 번에 내려준다.
  async findByUserId(userId: number) {
    const [menus, categories, tags, allergies] = await Promise.all([
      supabaseAdmin
        .from("user_menu_preferences")
        .select("menu_id, preference_score, menus(menu_id, name)")
        .eq("user_id", userId),

      supabaseAdmin
        .from("user_category_preferences")
        .select("category_id, preference_score, menu_categories(category_id, name)")
        .eq("user_id", userId),

      supabaseAdmin
        .from("user_tag_preferences")
        .select("tag_id, preference_score, tags(tag_id, name)")
        .eq("user_id", userId),

      supabaseAdmin
        .from("user_allergies")
        .select("allergy_id")
        .eq("user_id", userId)
    ]);

    for (const result of [menus, categories, tags, allergies]) {
      if (result.error) throw result.error;
    }

    return {
      menuPreferences: (menus.data ?? []).map((row) => {
        const menu = firstOrSelf(row.menus);

        return {
          menuId: row.menu_id,
          menuName: menu?.name ?? null,
          preferenceScore: row.preference_score
        };
      }),

      categoryPreferences: (categories.data ?? []).map((row) => {
        const category = firstOrSelf(row.menu_categories);

        return {
          categoryId: row.category_id,
          categoryName: category?.name ?? null,
          preferenceScore: row.preference_score
        };
      }),

      tagPreferences: (tags.data ?? []).map((row) => {
        const tag = firstOrSelf(row.tags);

        return {
          tagId: row.tag_id,
          tagName: tag?.name ?? null,
          preferenceScore: row.preference_score
        };
      }),

      allergyIds: allergies.data?.map((row) => row.allergy_id) ?? []
    };
  },

  // 사용자 선호도 전체를 새 값으로 교체한다.
  // 각 테이블의 기존 row를 삭제한 뒤 요청 body 기준으로 다시 insert한다.
  async replaceByUserId(userId: number, input: ReplacePreferenceRequest) {
    const { error } = await supabaseAdmin.rpc("replace_user_preferences", {
      p_user_id: userId,
      p_menu_preferences: input.menuPreferences?.map((item) => ({
        menu_id: item.menuId,
        preference_score: item.preferenceScore
      })) ?? [],
      p_category_preferences: input.categoryPreferences?.map((item) => ({
        category_id: item.categoryId,
        preference_score: item.preferenceScore
      })) ?? [],
      p_tag_preferences: input.tagPreferences?.map((item) => ({
        tag_id: item.tagId,
        preference_score: item.preferenceScore
      })) ?? [],
      p_allergy_ids: input.allergyIds ?? []
    });

    if (error) throw error;

    return { updated: true };
  }
};

// Supabase join 결과가 객체 또는 배열로 올 수 있어 공통 처리한다.
function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
