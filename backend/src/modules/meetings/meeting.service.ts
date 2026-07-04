import { meetingRepository } from "./meeting.repository.js";
import type { CreateMeetingRequest } from "./meeting.dto.js";

export const meetingService = {
  createMeeting(userId: number, input: CreateMeetingRequest) {
    return meetingRepository.create(userId, input);
  }
};
