import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { mealHistoryRouter } from "./mealHistory.routes.js";
import { meetingRouter } from "./meeting.routes.js";
import { menuRouter } from "./menu.routes.js";
import { preferenceRouter } from "./preference.routes.js";
import { recommendationRouter } from "./recommendation.routes.js";
import { referenceRouter } from "./reference.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/menus", menuRouter);
apiRouter.use("/", referenceRouter);
apiRouter.use("/preferences", preferenceRouter);
apiRouter.use("/recommendations", recommendationRouter);
apiRouter.use("/meetings", meetingRouter);
apiRouter.use("/meal-history", mealHistoryRouter);
