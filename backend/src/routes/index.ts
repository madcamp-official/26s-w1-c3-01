import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { userRouter } from "../modules/users/user.routes.js";
import { masterDataRouter } from "../modules/master-data/masterData.routes.js";
import { preferenceRouter } from "../modules/preferences/preference.routes.js";
import { recommendationRouter } from "../modules/recommendations/recommendation.routes.js";
import { meetingRouter } from "../modules/meetings/meeting.routes.js";
import { meetingRecommendationRouter } from "../modules/meeting-recommendations/meetingRecommendation.routes.js";
import { mealHistoryRouter } from "../modules/meal-history/mealHistory.routes.js";
import { menuInteractionRouter } from "../modules/menu-interactions/menuInteraction.routes.js";
import {
  userCategoryPreferenceRouter,
  userPreferenceRouter
} from "../modules/user-preferences/userPreference.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/", masterDataRouter);
apiRouter.use("/preferences", preferenceRouter);
apiRouter.use("/recommendations", recommendationRouter);
apiRouter.use("/menu-interactions", menuInteractionRouter);
apiRouter.use("/user-preferences", userPreferenceRouter);
apiRouter.use("/user-category-preferences", userCategoryPreferenceRouter);
apiRouter.use("/meetings", meetingRouter);
apiRouter.use("/meetings", meetingRecommendationRouter);
apiRouter.use("/meal-history", mealHistoryRouter);
