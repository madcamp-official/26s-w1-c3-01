import { meetingRepository } from "./meeting.repository.js";
import type { AddMeetingParticipantRequest, CreateMeetingRequest, JoinMeetingRequest, UpdateMeetingRequest } from "./meeting.dto.js";

export const meetingService = {
  createMeeting(userId: number, input: CreateMeetingRequest) {
    return meetingRepository.create(userId, input);
  },

  listMeetings(userId: number) {
    return meetingRepository.listForUser(userId);
  },

  getMeeting(meetingId: number, userId: number) {
    return meetingRepository.findByIdForUser(meetingId, userId);
  },

  updateMeeting(meetingId: number, userId: number, input: UpdateMeetingRequest) {
    return meetingRepository.update(meetingId, userId, input);
  },

  previewMeeting(meetingId: number) {
    return meetingRepository.previewById(meetingId);
  },

  addParticipant(meetingId: number, input: AddMeetingParticipantRequest) {
    return meetingRepository.addParticipant(meetingId, input);
  },

  joinMeeting(meetingId: number, userId: number, input: JoinMeetingRequest) {
    return meetingRepository.joinById(meetingId, userId, input.displayName);
  },

  listParticipants(meetingId: number) {
    return meetingRepository.listParticipants(meetingId);
  }
};
