import { masterDataRepository } from "./masterData.repository.js";
import { userRepository } from "../users/user.repository.js";

export type ListMenusQuery = {
  categoryId?: number;
  tagId?: number;
  keyword?: string;
  limit?: number;
  offset?: number;
  includeTotal?: boolean;
};

export type MenuPurposeSuitabilityInput = {
  meetingPurposeId: number;
  suitabilityScore: number;
};

export type CreateMenuRequest = {
  categoryId: number;
  name: string;
  description?: string | null;
  spicyLevel: number;
  priceLevel?: number | null;
  calorie?: number | null;
  tagIds?: number[];
  allergyIds?: number[];
  purposeSuitability?: MenuPurposeSuitabilityInput[];
};

export type UpdateMenuRequest = Partial<CreateMenuRequest>;

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

  async createMenu(userId: number, input: CreateMenuRequest) {
    await assertCanManageMasterData(userId);
    await assertUniqueMenuName(input.name);

    return masterDataRepository.createMenu(input);
  },

  async updateMenu(userId: number, menuId: number, input: UpdateMenuRequest) {
    await assertCanManageMasterData(userId);
    validateMenuId(menuId);

    const existing = await masterDataRepository.findMenuById(menuId);
    if (!existing) throwMenuNotFound();

    if (input.name !== undefined) {
      await assertUniqueMenuName(input.name, menuId);
    }

    const updated = await masterDataRepository.updateMenu(menuId, input);
    if (!updated) throwMenuNotFound();

    return updated;
  },

  async deleteMenu(userId: number, menuId: number) {
    await assertCanManageMasterData(userId);
    validateMenuId(menuId);

    const deleted = await masterDataRepository.deleteMenu(menuId);
    if (!deleted) throwMenuNotFound();

    return { deleted: true, menuId };
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

async function assertCanManageMasterData(userId: number) {
  const user = await userRepository.findById(userId);

  // 별도 관리자 테이블이 없어 현재 서비스의 관리형 사용자 타입을 마스터 데이터 관리 권한으로 사용한다.
  if (!user || user.userType !== "GROUP_HOST") {
    throw Object.assign(new Error("메뉴 데이터를 관리할 권한이 없습니다."), {
      status: 403,
      code: "FORBIDDEN"
    });
  }
}

async function assertUniqueMenuName(name: string, currentMenuId?: number) {
  const existing = await masterDataRepository.findMenuByName(name);
  if (existing && Number(existing.menu_id) !== currentMenuId) {
    throw Object.assign(new Error("이미 등록된 메뉴 이름입니다."), {
      status: 409,
      code: "CONFLICT"
    });
  }
}

function validateMenuId(menuId: number) {
  if (!Number.isFinite(menuId) || menuId <= 0) {
    throw Object.assign(new Error("메뉴 ID가 올바르지 않습니다."), {
      status: 400,
      code: "VALIDATION_ERROR"
    });
  }
}

function throwMenuNotFound(): never {
  throw Object.assign(new Error("메뉴를 찾을 수 없습니다."), {
    status: 404,
    code: "NOT_FOUND"
  });
}
