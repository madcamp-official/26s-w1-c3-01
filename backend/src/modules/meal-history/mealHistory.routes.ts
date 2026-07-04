import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { createMealHistory, deleteMealHistory, listMyMealHistory, updateMealHistory } from "./mealHistory.controller.js";

export const mealHistoryRouter = Router();

mealHistoryRouter.post("/", authMiddleware, createMealHistory);
mealHistoryRouter.get("/me", authMiddleware, listMyMealHistory);
mealHistoryRouter.patch("/:historyId", authMiddleware, updateMealHistory);
mealHistoryRouter.delete("/:historyId", authMiddleware, deleteMealHistory);
