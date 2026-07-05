import { Router } from "express";
import { guestSignup, login, logout, signup } from "./auth.controller.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import { guestSignupSchema, loginSchema, signupSchema } from "./auth.validation.js";

export const authRouter = Router();

authRouter.post("/signup", validateBody(signupSchema), signup);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/guest", validateBody(guestSignupSchema), guestSignup);
authRouter.post("/logout", authMiddleware, logout);
