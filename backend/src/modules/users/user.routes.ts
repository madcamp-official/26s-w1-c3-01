import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import { getMe, updateMe } from "./user.controller.js";
import { updateUserSchema } from "./user.validation.js";

export const userRouter = Router();

// 내 프로필 조회
userRouter.get("/me", authMiddleware, getMe);

// 내 프로필 수정
userRouter.patch("/me", authMiddleware, validateBody(updateUserSchema), updateMe);