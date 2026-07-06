import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import { createMenuInteraction } from "./menuInteraction.controller.js";
import { createMenuInteractionSchema } from "./menuInteraction.validation.js";

export const menuInteractionRouter = Router();

menuInteractionRouter.post(
  "/",
  authMiddleware,
  validateBody(createMenuInteractionSchema),
  createMenuInteraction
);
