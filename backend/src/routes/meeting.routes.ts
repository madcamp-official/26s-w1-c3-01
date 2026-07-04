import { Router } from "express";
import {
  addParticipant,
  createMeeting,
  getMeeting,
  listMeetings,
  listParticipants,
  updateMeeting,
  updateParticipant
} from "../controllers/meeting.controller.js";
import {
  createMeetingRecommendation,
  getLatestMeetingRecommendation,
  selectMeetingMenu
} from "../controllers/meetingRecommendation.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const meetingRouter = Router();

meetingRouter.use(requireAuth);
meetingRouter.post("/", createMeeting);
meetingRouter.get("/", listMeetings);
meetingRouter.get("/:meetingId", getMeeting);
meetingRouter.patch("/:meetingId", updateMeeting);
meetingRouter.post("/:meetingId/participants", addParticipant);
meetingRouter.get("/:meetingId/participants", listParticipants);
meetingRouter.patch("/:meetingId/participants/:participantId", updateParticipant);
meetingRouter.post("/:meetingId/recommendations", createMeetingRecommendation);
meetingRouter.get("/:meetingId/recommendations/latest", getLatestMeetingRecommendation);
meetingRouter.patch("/:meetingId/selected-menu", selectMeetingMenu);
