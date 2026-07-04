import { Router } from "express";
import { getMe, updateMe } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const userRouter = Router();

userRouter.get("/me", requireAuth, getMe);
userRouter.patch("/me", requireAuth, updateMe);
