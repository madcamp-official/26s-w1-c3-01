import { Router } from "express";
import { getMenu, listMenus } from "../controllers/masterData.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const menuRouter = Router();

menuRouter.get("/", requireAuth, listMenus);
menuRouter.get("/:menuId", requireAuth, getMenu);
