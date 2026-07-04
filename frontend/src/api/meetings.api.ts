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
  },
  getLatestRecommendation(meetingId: number) {
    return apiRequest(`/meetings/${meetingId}/recommendations/latest`);
  },
  selectMenu(meetingId: number, menuId: number) {
    return apiRequest(`/meetings/${meetingId}/selected-menu`, {
      method: "PATCH",
      body: JSON.stringify({ menuId })
    });
  }
};
