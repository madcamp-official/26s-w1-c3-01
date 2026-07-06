import { supabaseAdmin } from "../../config/supabase.js";
import type { CreateMenuRequest, ListMenusQuery, UpdateMenuRequest } from "./masterData.service.js";

type MenuRow = {
  menu_id: number;
  category_id: number;
  name: string;
  description: string | null;
  spicy_level: number;
  price_level: number | null;
  calorie: number | null;
  menu_categories?:
    | {
        category_id: number;
        name: string;
      }
    | Array<{
        category_id: number;
        name: string;
      }>
    | null;
};

export const masterDataRepository = {
  // 메뉴 목록을 조회한다.
  // categoryId, tagId, keyword 필터와 pagination을 지원한다.
  async findMenus(query: ListMenusQuery) {
    const { categoryId, tagId, keyword, limit = 50, offset = 0 } = query;

    // tagId 필터는 menus 테이블에 직접 없으므로
    // menu_tags에서 해당 tag를 가진 menu_id 목록을 먼저 구한다.
    let menuIdsByTag: number[] | null = null;

    if (tagId) {
      const { data: menuTagRows, error: menuTagError } = await supabaseAdmin
        .from("menu_tags")
        .select("menu_id")
        .eq("tag_id", tagId);

      if (menuTagError) throw menuTagError;

      menuIdsByTag = menuTagRows?.map((row) => row.menu_id) ?? [];

      // 해당 태그를 가진 메뉴가 없으면 menus 조회 없이 빈 결과를 반환한다.
      if (menuIdsByTag.length === 0) {
        return {
          items: [],
          pagination: { limit, offset, total: 0 }
        };
      }
    }

    // 메뉴 기본 정보와 카테고리 정보를 함께 조회한다.
    let queryBuilder = supabaseAdmin
      .from("menus")
      .select(
        "menu_id, category_id, name, description, spicy_level, price_level, calorie, menu_categories(category_id, name)",
        { count: "exact" }
      )
      .order("menu_id");

    // 카테고리 필터
    if (categoryId) {
      queryBuilder = queryBuilder.eq("category_id", categoryId);
    }

    // 메뉴명 검색 필터
    if (keyword) {
      queryBuilder = queryBuilder.ilike("name", `%${keyword}%`);
    }

    // 태그 기반 메뉴 ID 필터
    if (menuIdsByTag) {
      queryBuilder = queryBuilder.in("menu_id", menuIdsByTag);
    }

    // Supabase range는 양 끝 index를 모두 포함한다.
    const { data, error, count } = await queryBuilder.range(
      offset,
      offset + limit - 1
    );

    if (error) throw error;

    return {
      items: (data ?? []).map((row) => toMenuSummary(row as MenuRow)),
      pagination: {
        limit,
        offset,
        total: count ?? 0
      }
    };
  },

  // 메뉴 상세를 조회한다.
  // 메뉴 기본 정보에 태그, 알러지, 식사 목적 적합도를 합쳐서 반환한다.
  async findMenuById(menuId: number) {
    const { data: menu, error } = await supabaseAdmin
      .from("menus")
      .select(
        "menu_id, category_id, name, description, spicy_level, price_level, calorie, menu_categories(category_id, name)"
      )
      .eq("menu_id", menuId)
      .maybeSingle();

    if (error) throw error;
    if (!menu) return null;

    // 메뉴와 연결된 부가 정보를 병렬로 조회한다.
    const [tagsResult, allergiesResult, purposesResult] = await Promise.all([
      supabaseAdmin
        .from("menu_tags")
        .select("tag_id, tags(tag_id, name)")
        .eq("menu_id", menuId),
      supabaseAdmin
        .from("menu_allergies")
        .select("allergy_id, allergies(allergy_id, name)")
        .eq("menu_id", menuId),
      supabaseAdmin
        .from("menu_purpose_suitability")
        .select(
          "meeting_purpose_id, suitability_score, meeting_purposes(meeting_purpose_id, name)"
        )
        .eq("menu_id", menuId)
    ]);

    if (tagsResult.error) throw tagsResult.error;
    if (allergiesResult.error) throw allergiesResult.error;
    if (purposesResult.error) throw purposesResult.error;

    return {
      ...toMenuSummary(menu as MenuRow),

      // 메뉴에 붙은 태그 목록
      tags: (tagsResult.data ?? []).map((row) => {
        const tag = firstOrSelf(row.tags);
        return {
          tagId: row.tag_id,
          name: tag?.name ?? null
        };
      }),

      // 메뉴에 포함된 알러지/제한 조건 목록
      allergies: (allergiesResult.data ?? []).map((row) => {
        const allergy = firstOrSelf(row.allergies);
        return {
          allergyId: row.allergy_id,
          name: allergy?.name ?? null
        };
      }),

      // 메뉴가 각 식사 목적에 얼마나 적합한지 나타내는 점수 목록
      purposeSuitability: (purposesResult.data ?? []).map((row) => {
        const purpose = firstOrSelf(row.meeting_purposes);
        return {
          meetingPurposeId: row.meeting_purpose_id,
          name: purpose?.name ?? null,
          suitabilityScore: row.suitability_score
        };
      })
    };
  },

  async findMenuByName(name: string) {
    const { data, error } = await supabaseAdmin
      .from("menus")
      .select("menu_id")
      .eq("name", name)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createMenu(input: CreateMenuRequest) {
    const { data, error } = await supabaseAdmin
      .from("menus")
      .insert({
        category_id: input.categoryId,
        name: input.name,
        description: input.description ?? null,
        spicy_level: input.spicyLevel,
        price_level: input.priceLevel ?? null,
        calorie: input.calorie ?? null
      })
      .select("menu_id")
      .single();

    if (error) throw error;

    const menuId = Number(data.menu_id);
    await replaceMenuRelations(menuId, input);
    return this.findMenuById(menuId);
  },

  async updateMenu(menuId: number, input: UpdateMenuRequest) {
    const patch = {
      ...(input.categoryId !== undefined && { category_id: input.categoryId }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.spicyLevel !== undefined && { spicy_level: input.spicyLevel }),
      ...(input.priceLevel !== undefined && { price_level: input.priceLevel }),
      ...(input.calorie !== undefined && { calorie: input.calorie })
    };

    if (Object.keys(patch).length > 0) {
      const { error } = await supabaseAdmin
        .from("menus")
        .update(patch)
        .eq("menu_id", menuId);

      if (error) throw error;
    }

    await replaceMenuRelations(menuId, input);
    return this.findMenuById(menuId);
  },

  async deleteMenu(menuId: number) {
    await replaceMenuRelations(menuId, {
      tagIds: [],
      allergyIds: [],
      purposeSuitability: []
    });

    const { data, error } = await supabaseAdmin
      .from("menus")
      .delete()
      .eq("menu_id", menuId)
      .select("menu_id")
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // 음식 카테고리 목록을 조회한다.
  async findMenuCategories() {
    const { data, error } = await supabaseAdmin
      .from("menu_categories")
      .select("category_id, name")
      .order("category_id");

    if (error) throw error;

    return (data ?? []).map((row) => ({
      categoryId: row.category_id,
      name: row.name
    }));
  },

  // 음식 태그 목록을 조회한다.
  async findTags() {
    const { data, error } = await supabaseAdmin
      .from("tags")
      .select("tag_id, name")
      .order("tag_id");

    if (error) throw error;

    return (data ?? []).map((row) => ({
      tagId: row.tag_id,
      name: row.name
    }));
  },

  // 카테고리와 태그의 연결 정보를 조회한다.
  // 예: 한식 - 국물, 한식 - 매운맛
  async findCategoryTags() {
    const { data, error } = await supabaseAdmin
      .from("category_tags")
      .select("category_id, tag_id, menu_categories(category_id, name), tags(tag_id, name)")
      .order("category_id")
      .order("tag_id");

    if (error) throw error;

    return (data ?? []).map((row) => {
      const category = firstOrSelf(row.menu_categories);
      const tag = firstOrSelf(row.tags);

      return {
        categoryId: row.category_id,
        categoryName: category?.name ?? null,
        tagId: row.tag_id,
        tagName: tag?.name ?? null
      };
    });
  },

  // 알러지/식단 제한 조건 목록을 조회한다.
  async findAllergies() {
    const { data, error } = await supabaseAdmin
      .from("allergies")
      .select("allergy_id, name")
      .order("allergy_id");

    if (error) throw error;

    return (data ?? []).map((row) => ({
      allergyId: row.allergy_id,
      name: row.name
    }));
  },

  // 식사 목적 목록을 조회한다.
  async findMeetingPurposes() {
    const { data, error } = await supabaseAdmin
      .from("meeting_purposes")
      .select("meeting_purpose_id, name")
      .order("meeting_purpose_id");

    if (error) throw error;

    return (data ?? []).map((row) => ({
      meetingPurposeId: row.meeting_purpose_id,
      name: row.name
    }));
  }
};

// 메뉴 목록/상세에서 공통으로 쓰는 응답 변환 함수.
// DB의 snake_case 필드를 프론트에서 쓰기 쉬운 camelCase로 바꾼다.
function toMenuSummary(row: MenuRow) {
  const category = firstOrSelf(row.menu_categories);

  return {
    menuId: row.menu_id,
    name: row.name,
    description: row.description,
    spicyLevel: row.spicy_level,
    priceLevel: row.price_level,
    calorie: row.calorie,
    category: category
      ? {
          categoryId: category.category_id,
          name: category.name
        }
      : null
  };
}

async function replaceMenuRelations(menuId: number, input: Pick<UpdateMenuRequest, "tagIds" | "allergyIds" | "purposeSuitability">) {
  if (input.tagIds !== undefined) {
    const { error: deleteError } = await supabaseAdmin
      .from("menu_tags")
      .delete()
      .eq("menu_id", menuId);

    if (deleteError) throw deleteError;

    if (input.tagIds.length > 0) {
      const { error } = await supabaseAdmin
        .from("menu_tags")
        .insert(uniqueNumbers(input.tagIds).map((tagId) => ({ menu_id: menuId, tag_id: tagId })));

      if (error) throw error;
    }
  }

  if (input.allergyIds !== undefined) {
    const { error: deleteError } = await supabaseAdmin
      .from("menu_allergies")
      .delete()
      .eq("menu_id", menuId);

    if (deleteError) throw deleteError;

    if (input.allergyIds.length > 0) {
      const { error } = await supabaseAdmin
        .from("menu_allergies")
        .insert(uniqueNumbers(input.allergyIds).map((allergyId) => ({ menu_id: menuId, allergy_id: allergyId })));

      if (error) throw error;
    }
  }

  if (input.purposeSuitability !== undefined) {
    const { error: deleteError } = await supabaseAdmin
      .from("menu_purpose_suitability")
      .delete()
      .eq("menu_id", menuId);

    if (deleteError) throw deleteError;

    if (input.purposeSuitability.length > 0) {
      const uniqueByPurpose = new Map(
        input.purposeSuitability.map((item) => [
          item.meetingPurposeId,
          {
            menu_id: menuId,
            meeting_purpose_id: item.meetingPurposeId,
            suitability_score: item.suitabilityScore
          }
        ])
      );
      const { error } = await supabaseAdmin
        .from("menu_purpose_suitability")
        .insert(Array.from(uniqueByPurpose.values()));

      if (error) throw error;
    }
  }
}

function uniqueNumbers(values: number[]) {
  return Array.from(new Set(values.map(Number)));
}

// Supabase join 결과는 설정/관계에 따라 객체 또는 배열로 올 수 있다.
// 모듈 내부에서는 항상 단일 객체처럼 다루기 위해 공통 처리한다.
function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
