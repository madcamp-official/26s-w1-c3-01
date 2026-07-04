import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import { getMyPreferences, replaceMyPreferences } from "./preference.controller.js";
import { replacePreferenceSchema } from "./preference.validation.js";

export const preferenceRouter = Router();

// 내 선호도 전체 조회
preferenceRouter.get("/me", authMiddleware, getMyPreferences);

// 내 선호도 전체 저장/수정
// 온보딩 또는 마이페이지에서 입력한 값을 기존 데이터와 교체한다.
preferenceRouter.put(
  "/me",
  authMiddleware,
  validateBody(replacePreferenceSchema),
  replaceMyPreferences
);