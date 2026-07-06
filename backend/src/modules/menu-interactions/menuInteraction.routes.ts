import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import {
  createMenuInteraction,
  listMyMenuInteractionStates,
  setMenuInteractionState
} from "./menuInteraction.controller.js";
import {
  createMenuInteractionSchema,
  setMenuInteractionSchema
} from "./menuInteraction.validation.js";

export const menuInteractionRouter = Router();

menuInteractionRouter.get(
  "/me",
  authMiddleware,
  listMyMenuInteractionStates
);

menuInteractionRouter.post(
  "/",
  authMiddleware,
  validateBody(createMenuInteractionSchema),
  createMenuInteraction
);

menuInteractionRouter.put(
  "/:menuId",
  authMiddleware,
  validateBody(setMenuInteractionSchema),
  setMenuInteractionState
);
