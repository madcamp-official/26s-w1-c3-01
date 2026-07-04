import { masterDataRepository } from "./masterData.repository.js";

export type ListMenusQuery = {
  categoryId?: number;
  tagId?: number;
  keyword?: string;
  limit?: number;
  offset?: number;
};

export const masterDataService = {
  // 메뉴 목록 조회 조건을 정리한다.
  // limit/offset 기본값과 범위를 여기서 통제한다.
  listMenus(query: ListMenusQuery) {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);

    return masterDataRepository.findMenus({
      ...query,
      limit,
      offset
    });
  },

  // 메뉴 상세 조회 전 path parameter를 검증한다.
  // 없는 메뉴는 404 에러로 변환한다.
  async getMenu(menuId: number) {
    if (!Number.isFinite(menuId)) {
      throw Object.assign(new Error("메뉴 ID가 올바르지 않습니다."), {
        status: 400,
        code: "VALIDATION_ERROR"
      });
    }

    const menu = await masterDataRepository.findMenuById(menuId);

    if (!menu) {
      throw Object.assign(new Error("메뉴를 찾을 수 없습니다."), {
        status: 404,
        code: "NOT_FOUND"
      });
    }

    return menu;
  },

  // 음식 카테고리 기준 데이터를 조회한다.
  listMenuCategories() {
    return masterDataRepository.findMenuCategories();
  },

  // 음식 특성 태그 기준 데이터를 조회한다.
  listTags() {
    return masterDataRepository.findTags();
  },

  // 카테고리와 태그의 연결 기준 데이터를 조회한다.
  listCategoryTags() {
    return masterDataRepository.findCategoryTags();
  },

  // 알러지/식단 제한 기준 데이터를 조회한다.
  listAllergies() {
    return masterDataRepository.findAllergies();
  },

  // 식사 목적 기준 데이터를 조회한다.
  listMeetingPurposes() {
    return masterDataRepository.findMeetingPurposes();
  }
};