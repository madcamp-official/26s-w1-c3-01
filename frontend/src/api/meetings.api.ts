import { apiRequest } from "./client";
import type { CreateMeetingRequest, UpdateMeetingRequest } from "../features/meetings/meeting.types";

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
  update(meetingId: number, body: UpdateMeetingRequest) {
    return apiRequest(`/meetings/${meetingId}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  },
  preview(meetingId: number) {
    return apiRequest(`/meetings/${meetingId}/preview`);
  },
  addParticipant(meetingId: number, userId: number, displayName?: string) {
    return apiRequest(`/meetings/${meetingId}/participants`, {
      method: "POST",
      body: JSON.stringify({ userId, displayName })
    });
  },
  join(meetingId: number, displayName: string) {
    return apiRequest(`/meetings/${meetingId}/join`, {
      method: "POST",
      body: JSON.stringify({ displayName })
    });
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
