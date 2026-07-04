import { Router } from "express";
import {
  listAllergies,
  listMeetingPurposes,
  listMenuCategories,
  listTags
} from "../controllers/masterData.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const referenceRouter = Router();

referenceRouter.get("/menu-categories", requireAuth, listMenuCategories);
referenceRouter.get("/tags", requireAuth, listTags);
referenceRouter.get("/allergies", requireAuth, listAllergies);
referenceRouter.get("/meeting-purposes", requireAuth, listMeetingPurposes);
