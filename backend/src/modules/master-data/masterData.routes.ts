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

// Master Data API는 모두 로그인한 사용자만 접근 가능하다.
// 프론트 온보딩, 메뉴 목록, 추천 조건 선택 화면에서 사용된다.

// 메뉴 목록 조회
// query: categoryId, tagId, keyword, limit, offset
masterDataRouter.get("/menus", authMiddleware, listMenus);

// 메뉴 등록/수정/삭제
// 별도 관리자 테이블이 없어 GROUP_HOST 사용자에게만 허용한다.
masterDataRouter.post("/menus", authMiddleware, validateBody(createMenuSchema), createMenu);

// 메뉴 상세 조회
// path: menuId
masterDataRouter.get("/menus/:menuId", authMiddleware, getMenu);
masterDataRouter.patch("/menus/:menuId", authMiddleware, validateBody(updateMenuSchema), updateMenu);
masterDataRouter.delete("/menus/:menuId", authMiddleware, deleteMenu);

// 음식 카테고리 목록 조회
masterDataRouter.get("/menu-categories", authMiddleware, listMenuCategories);

// 음식 태그 목록 조회
masterDataRouter.get("/tags", authMiddleware, listTags);

// 카테고리별 선택 가능한 태그 목록 조회
masterDataRouter.get("/category-tags", authMiddleware, listCategoryTags);

// 알러지/식단 제한 조건 목록 조회
masterDataRouter.get("/allergies", authMiddleware, listAllergies);

// 식사 목적 목록 조회
masterDataRouter.get("/meeting-purposes", authMiddleware, listMeetingPurposes);
