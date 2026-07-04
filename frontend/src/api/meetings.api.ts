import { apiRequest } from "./client";
import type { CreateMeetingRequest } from "../features/meetings/meeting.types";

export const meetingsApi = {
  list() {
    return apiRequest("/meetings");
  },
  create(body: CreateMeetingRequest) {
    return apiRequest("/meetings", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },
  get(meetingId: number) {
    return apiRequest(`/meetings/${meetingId}`);
  },
  createRecommendation(meetingId: number, body: unknown) {
    return apiRequest(`/meetings/${meetingId}/recommendations`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }
};
