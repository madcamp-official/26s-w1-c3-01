import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { masterDataService } from "./masterData.service.js";

// 메뉴 목록 요청을 처리한다.
// query string을 숫자/문자 타입으로 변환한 뒤 service로 넘긴다.
export const listMenus: RequestHandler = async (req, res, next) => {
  try {
    const data = await masterDataService.listMenus({
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      tagId: req.query.tagId ? Number(req.query.tagId) : undefined,
      keyword: typeof req.query.keyword === "string" ? req.query.keyword : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
      includeTotal: req.query.includeTotal === "true"
    });

    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// 특정 메뉴의 상세 정보를 조회한다.
// 상세 응답에는 메뉴 기본 정보뿐 아니라 태그, 알러지, 목적 적합도도 포함된다.
export const getMenu: RequestHandler = async (req, res, next) => {
  try {
    const data = await masterDataService.getMenu(Number(req.params.menuId));
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const createMenu: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const data = await masterDataService.createMenu(userId, req.body);

    sendSuccess(res, data, 201, "메뉴가 등록되었습니다.");
  } catch (error) {
    next(error);
  }
};

export const updateMenu: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const data = await masterDataService.updateMenu(userId, Number(req.params.menuId), req.body);

    sendSuccess(res, data, 200, "메뉴가 수정되었습니다.");
  } catch (error) {
    next(error);
  }
};

export const deleteMenu: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const data = await masterDataService.deleteMenu(userId, Number(req.params.menuId));

    sendSuccess(res, data, 200, "메뉴가 삭제되었습니다.");
  } catch (error) {
    next(error);
  }
};

// 음식 카테고리 목록을 조회한다.
// 예: 한식, 중식, 양식, 일식 등
export const listMenuCategories: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await masterDataService.listMenuCategories());
  } catch (error) {
    next(error);
  }
};

// 음식 태그 목록을 조회한다.
// 예: 구이, 국물, 볶음, 매운맛 등
export const listTags: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await masterDataService.listTags());
  } catch (error) {
    next(error);
  }
};

// 카테고리와 태그의 연결 정보를 조회한다.
// 온보딩에서 카테고리를 고른 뒤 관련 태그만 보여줄 때 사용할 수 있다.
export const listCategoryTags: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await masterDataService.listCategoryTags());
  } catch (error) {
    next(error);
  }
};

// 알러지 및 식단 제한 조건 목록을 조회한다.
export const listAllergies: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await masterDataService.listAllergies());
  } catch (error) {
    next(error);
  }
};

// 식사 목적 목록을 조회한다.
// 예: 가벼운 식사, 회식, 데이트, 건강식 등
export const listMeetingPurposes: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await masterDataService.listMeetingPurposes());
  } catch (error) {
    next(error);
  }
};
