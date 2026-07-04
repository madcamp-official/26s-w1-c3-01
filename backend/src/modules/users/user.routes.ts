import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { getMe, updateMe } from "./user.controller.js";

export const userRouter = Router();

userRouter.get("/me", authMiddleware, getMe);
userRouter.patch("/me", authMiddleware, updateMe);
