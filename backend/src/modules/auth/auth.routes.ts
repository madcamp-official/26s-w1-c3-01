import { Router } from "express";
import { checkNickname, guestSignup, login, logout, refresh, signup, syncProfile } from "./auth.controller.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import { guestSignupSchema, loginSchema, refreshSchema, signupSchema } from "./auth.validation.js";

export const authRouter = Router();

authRouter.post("/signup", validateBody(signupSchema), signup);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/refresh", validateBody(refreshSchema), refresh);
authRouter.post("/profile", syncProfile);
authRouter.get("/nickname", checkNickname);
authRouter.post("/guest", validateBody(guestSignupSchema), guestSignup);
authRouter.post("/logout", authMiddleware, logout);
