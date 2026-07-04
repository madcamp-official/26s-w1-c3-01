import { Router } from "express";
import {
  getMyPreferences,
  replaceMyPreferences,
  updateMyAllergies,
  updateMyCategoryPreferences,
  updateMyMenuPreferences,
  updateMyTagPreferences
} from "../controllers/preference.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const preferenceRouter = Router();

preferenceRouter.use(requireAuth);
preferenceRouter.get("/me", getMyPreferences);
preferenceRouter.put("/me", replaceMyPreferences);
preferenceRouter.put("/me/menus", updateMyMenuPreferences);
preferenceRouter.put("/me/categories", updateMyCategoryPreferences);
preferenceRouter.put("/me/tags", updateMyTagPreferences);
preferenceRouter.put("/me/allergies", updateMyAllergies);
