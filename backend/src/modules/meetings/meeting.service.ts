import { ERROR_CODES } from "../../common/constants/errorCodes.js";
import { userRepository } from "../users/user.repository.js";
import { meetingRepository } from "./meeting.repository.js";
import type {
  AddMeetingParticipantRequest,
  CreateMeetingRequest,
  MeetingListQuery,
  UpdateMeetingParticipantRequest,
  UpdateMeetingRequest
} from "./meeting.dto.js";

export const meetingService = {
  async createMeeting(userId: number, input: CreateMeetingRequest) {
    const meeting = await meetingRepository.create(userId, input);
    const profile = await userRepository.findById(userId);

    // 모임 생성자는 기본 참여자로 등록해서 추천 계산 시 바로 사용할 수 있게 합니다.
    await meetingRepository.createHostParticipant(
      Number(meeting.meeting_id),
      userId,
      profile?.nickname ?? "방장"
    );

    return meetingRepository.findById(Number(meeting.meeting_id));
  },

  listMeetings(userId: number, query: MeetingListQuery) {
    return meetingRepository.listByCreator(userId, query);
  },

  async getMeeting(userId: number, meetingId: number) {
    validateId(meetingId, "모임 ID가 올바르지 않습니다.");

    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) throwNotFound("모임을 찾을 수 없습니다.");

    assertMeetingOwner(meeting, userId);

    return {
      ...meeting,
      participants: await meetingRepository.listParticipants(meetingId)
    };
  },

  async updateMeeting(userId: number, meetingId: number, input: UpdateMeetingRequest) {
    validateId(meetingId, "모임 ID가 올바르지 않습니다.");

    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) throwNotFound("모임을 찾을 수 없습니다.");

    assertMeetingOwner(meeting, userId);

    const updated = await meetingRepository.update(meetingId, input);
    if (!updated) throwNotFound("모임을 찾을 수 없습니다.");

    return updated;
  },

  async deleteMeeting(userId: number, meetingId: number) {
    validateId(meetingId, "모임 ID가 올바르지 않습니다.");

    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) throwNotFound("모임을 찾을 수 없습니다.");

    assertMeetingOwner(meeting, userId);

    const deleted = await meetingRepository.delete(meetingId);
    if (!deleted) throwNotFound("모임을 찾을 수 없습니다.");

    return { deleted: true };
  },

  async listParticipants(userId: number, meetingId: number) {
    await assertCanManageMeeting(userId, meetingId);
    return { items: await meetingRepository.listParticipants(meetingId) };
  },

  async addParticipant(userId: number, meetingId: number, input: AddMeetingParticipantRequest) {
    await assertCanManageMeeting(userId, meetingId);
    return meetingRepository.addParticipant(meetingId, input);
  },

  async updateParticipant(
    userId: number,
    meetingId: number,
    participantId: number,
    input: UpdateMeetingParticipantRequest
  ) {
    await assertCanManageMeeting(userId, meetingId);
    validateId(participantId, "참여자 ID가 올바르지 않습니다.");

    const participant = await meetingRepository.updateParticipant(participantId, input);
    if (!participant || Number(participant.meeting_id) !== meetingId) {
      throwNotFound("참여자를 찾을 수 없습니다.");
    }

    return participant;
  }
};

async function assertCanManageMeeting(userId: number, meetingId: number) {
  validateId(meetingId, "모임 ID가 올바르지 않습니다.");

  const meeting = await meetingRepository.findById(meetingId);
  if (!meeting) throwNotFound("모임을 찾을 수 없습니다.");

  assertMeetingOwner(meeting, userId);
}

function assertMeetingOwner(meeting: { created_by: number }, userId: number) {
  if (Number(meeting.created_by) !== userId) {
    throw {
      status: 403,
      code: ERROR_CODES.FORBIDDEN,
      message: "모임을 관리할 권한이 없습니다."
    };
  }
}

function validateId(id: number, message: string) {
  if (!Number.isInteger(id) || id <= 0) {
    throw {
      status: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message
    };
  }
}

function throwNotFound(message: string): never {
  throw {
    status: 404,
    code: ERROR_CODES.NOT_FOUND,
    message
  };
}