import { Router } from "express";
import { login, logout, signup } from "./auth.controller.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import { loginSchema, signupSchema } from "./auth.validation.js";

export const authRouter = Router();

authRouter.post("/signup", validateBody(signupSchema), signup);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/logout", authMiddleware, logout);
