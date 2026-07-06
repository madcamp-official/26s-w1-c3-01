import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import {
  getCategoryPreferences,
  getUserPreference,
  replaceCategoryPreferences,
  updateUserPreference
} from "./userPreference.controller.js";
import {
  replaceCategoryPreferencesByNameSchema,
  updateUserPreferenceSchema
} from "./userPreference.validation.js";

export const userPreferenceRouter = Router();
export const userCategoryPreferenceRouter = Router();

userPreferenceRouter.get("/", authMiddleware, getUserPreference);
userPreferenceRouter.put(
  "/",
  authMiddleware,
  validateBody(updateUserPreferenceSchema),
  updateUserPreference
);

userCategoryPreferenceRouter.get("/", authMiddleware, getCategoryPreferences);
userCategoryPreferenceRouter.put(
  "/",
  authMiddleware,
  validateBody(replaceCategoryPreferencesByNameSchema),
  replaceCategoryPreferences
);
