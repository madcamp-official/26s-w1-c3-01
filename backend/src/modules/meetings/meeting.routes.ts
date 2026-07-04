import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { createMeeting, getMeeting, listMeetings, updateMeeting } from "./meeting.controller.js";

export const meetingRouter = Router();

meetingRouter.post("/", authMiddleware, createMeeting);
meetingRouter.get("/", authMiddleware, listMeetings);
meetingRouter.get("/:meetingId", authMiddleware, getMeeting);
meetingRouter.patch("/:meetingId", authMiddleware, updateMeeting);
