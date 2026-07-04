import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { getMyPreferences, replaceMyPreferences } from "./preference.controller.js";

export const preferenceRouter = Router();

preferenceRouter.get("/me", authMiddleware, getMyPreferences);
preferenceRouter.put("/me", authMiddleware, replaceMyPreferences);
