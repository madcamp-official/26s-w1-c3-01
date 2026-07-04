import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import {
  getMenu,
  listAllergies,
  listMeetingPurposes,
  listMenuCategories,
  listMenus,
  listTags
} from "./masterData.controller.js";

export const masterDataRouter = Router();

masterDataRouter.get("/menus", authMiddleware, listMenus);
masterDataRouter.get("/menus/:menuId", authMiddleware, getMenu);
masterDataRouter.get("/menu-categories", authMiddleware, listMenuCategories);
masterDataRouter.get("/tags", authMiddleware, listTags);
masterDataRouter.get("/allergies", authMiddleware, listAllergies);
masterDataRouter.get("/meeting-purposes", authMiddleware, listMeetingPurposes);
