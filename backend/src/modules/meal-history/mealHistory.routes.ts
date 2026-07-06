import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import {
  createMealHistory,
  deleteMealHistory,
  getMealHistory,
  listMyMealHistory,
  updateMealHistory
} from "./mealHistory.controller.js";
import {
  createMealHistorySchema,
  updateMealHistorySchema
} from "./mealHistory.validation.js";

export const mealHistoryRouter = Router();

mealHistoryRouter.post("/", authMiddleware, validateBody(createMealHistorySchema), createMealHistory);
mealHistoryRouter.get("/me", authMiddleware, listMyMealHistory);
mealHistoryRouter.get("/:historyId", authMiddleware, getMealHistory);
mealHistoryRouter.patch("/:historyId", authMiddleware, validateBody(updateMealHistorySchema), updateMealHistory);
mealHistoryRouter.delete("/:historyId", authMiddleware, deleteMealHistory);