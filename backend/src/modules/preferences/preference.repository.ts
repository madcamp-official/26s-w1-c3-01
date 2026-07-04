import { supabaseAdmin } from "../../config/supabase.js";
import type { ReplacePreferenceRequest } from "./preference.dto.js";

type PreferenceTable =
  | "user_menu_preferences"
  | "user_category_preferences"
  | "user_tag_preferences"
  | "user_allergies";

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
    const now = new Date().toISOString();

    await replaceRows(
      "user_menu_preferences",
      userId,
      input.menuPreferences?.map((item) => ({
        user_id: userId,
        menu_id: item.menuId,
        preference_score: item.preferenceScore,
        updated_at: now
      })) ?? []
    );

    await replaceRows(
      "user_category_preferences",
      userId,
      input.categoryPreferences?.map((item) => ({
        user_id: userId,
        category_id: item.categoryId,
        preference_score: item.preferenceScore,
        updated_at: now
      })) ?? []
    );

    await replaceRows(
      "user_tag_preferences",
      userId,
      input.tagPreferences?.map((item) => ({
        user_id: userId,
        tag_id: item.tagId,
        preference_score: item.preferenceScore,
        updated_at: now
      })) ?? []
    );

    await replaceRows(
      "user_allergies",
      userId,
      input.allergyIds?.map((allergyId) => ({
        user_id: userId,
        allergy_id: allergyId
      })) ?? []
    );

    return { updated: true };
  }
};

// 특정 사용자 선호도 테이블을 교체 저장한다.
// 삭제 후 insert 방식이라 구현은 단순하지만, 중간 실패 시 일부만 반영될 수 있다.
async function replaceRows(
  table: PreferenceTable,
  userId: number,
  rows: Record<string, unknown>[]
) {
  const deleteResult = await supabaseAdmin.from(table).delete().eq("user_id", userId);
  if (deleteResult.error) throw deleteResult.error;

  if (rows.length === 0) return;

  const insertResult = await supabaseAdmin.from(table).insert(rows);
  if (insertResult.error) throw insertResult.error;
}

// Supabase join 결과가 객체 또는 배열로 올 수 있어 공통 처리한다.
function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}