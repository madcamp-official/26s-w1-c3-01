import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import {
  addMeetingParticipant,
  createMeeting,
  getMeeting,
  joinMeeting,
  listMeetingParticipants,
  listMeetings,
  previewMeeting,
  updateMeeting
} from "./meeting.controller.js";
import { addMeetingParticipantSchema, createMeetingSchema, joinMeetingSchema, updateMeetingSchema } from "./meeting.validation.js";

export const meetingRouter = Router();

meetingRouter.post("/", authMiddleware, validateBody(createMeetingSchema), createMeeting);
meetingRouter.get("/", authMiddleware, listMeetings);
meetingRouter.get("/:meetingId/preview", authMiddleware, previewMeeting);
meetingRouter.get("/:meetingId", authMiddleware, getMeeting);
meetingRouter.patch("/:meetingId", authMiddleware, validateBody(updateMeetingSchema), updateMeeting);
meetingRouter.post("/:meetingId/join", authMiddleware, validateBody(joinMeetingSchema), joinMeeting);
meetingRouter.post("/:meetingId/participants", authMiddleware, validateBody(addMeetingParticipantSchema), addMeetingParticipant);
meetingRouter.get("/:meetingId/participants", authMiddleware, listMeetingParticipants);
