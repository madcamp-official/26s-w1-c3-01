import type { CreateMeetingRequest } from "./meeting.dto.js";

export const meetingRepository = {
  async create(userId: number, input: CreateMeetingRequest) {
    return { meetingId: null, createdBy: userId, status: "OPEN", ...input };
  }
};
