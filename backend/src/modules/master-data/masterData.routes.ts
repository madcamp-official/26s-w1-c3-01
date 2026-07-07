import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import {
  createMenu,
  deleteMenu,
  getMenu,
  listAllergies,
  listCategoryTags,
  listMeetingPurposes,
  listMenuCategories,
  listMenus,
  listTags,
  updateMenu
} from "./masterData.controller.js";
import { createMenuSchema, updateMenuSchema } from "./masterData.validation.js";

export const masterDataRouter = Router();

// Master Data 조회 API는 온보딩 전에도 필요하므로 공개한다.
// 등록/수정/삭제는 별도 권한 검사를 위해 인증을 요구한다.

// 메뉴 목록 조회
// query: categoryId, tagId, keyword, limit, offset
masterDataRouter.get("/menus", listMenus);

// 메뉴 등록/수정/삭제
// 별도 관리자 테이블이 없어 GROUP_HOST 사용자에게만 허용한다.
masterDataRouter.post("/menus", authMiddleware, validateBody(createMenuSchema), createMenu);

// 메뉴 상세 조회
// path: menuId
masterDataRouter.get("/menus/:menuId", getMenu);
masterDataRouter.patch("/menus/:menuId", authMiddleware, validateBody(updateMenuSchema), updateMenu);
masterDataRouter.delete("/menus/:menuId", authMiddleware, deleteMenu);

// 음식 카테고리 목록 조회
masterDataRouter.get("/menu-categories", listMenuCategories);

// 음식 태그 목록 조회
masterDataRouter.get("/tags", listTags);

// 카테고리별 선택 가능한 태그 목록 조회
masterDataRouter.get("/category-tags", listCategoryTags);

// 알러지/식단 제한 조건 목록 조회
masterDataRouter.get("/allergies", listAllergies);

// 식사 목적 목록 조회
masterDataRouter.get("/meeting-purposes", listMeetingPurposes);
