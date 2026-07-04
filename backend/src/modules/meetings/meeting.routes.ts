import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import {
  addMeetingParticipant,
  createMeeting,
  deleteMeeting,
  getMeeting,
  listMeetingParticipants,
  listMeetings,
  updateMeeting,
  updateMeetingParticipant
} from "./meeting.controller.js";
import {
  addMeetingParticipantSchema,
  createMeetingSchema,
  updateMeetingParticipantSchema,
  updateMeetingSchema
} from "./meeting.validation.js";

export const meetingRouter = Router();

meetingRouter.post("/", authMiddleware, validateBody(createMeetingSchema), createMeeting);
meetingRouter.get("/", authMiddleware, listMeetings);

meetingRouter.get("/:meetingId", authMiddleware, getMeeting);
meetingRouter.patch("/:meetingId", authMiddleware, validateBody(updateMeetingSchema), updateMeeting);
meetingRouter.delete("/:meetingId", authMiddleware, deleteMeeting);

meetingRouter.get("/:meetingId/participants", authMiddleware, listMeetingParticipants);
meetingRouter.post(
  "/:meetingId/participants",
  authMiddleware,
  validateBody(addMeetingParticipantSchema),
  addMeetingParticipant
);
meetingRouter.patch(
  "/:meetingId/participants/:participantId",
  authMiddleware,
  validateBody(updateMeetingParticipantSchema),
  updateMeetingParticipant
);