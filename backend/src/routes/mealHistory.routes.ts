import { Router } from "express";
import {
  createMealHistory,
  deleteMealHistory,
  listMyMealHistory,
  updateMealHistory
} from "../controllers/mealHistory.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const mealHistoryRouter = Router();

mealHistoryRouter.use(requireAuth);
mealHistoryRouter.post("/", createMealHistory);
mealHistoryRouter.get("/me", listMyMealHistory);
mealHistoryRouter.patch("/:historyId", updateMealHistory);
mealHistoryRouter.delete("/:historyId", deleteMealHistory);
