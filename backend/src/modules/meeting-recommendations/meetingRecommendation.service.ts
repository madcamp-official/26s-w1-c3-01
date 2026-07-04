import { ERROR_CODES } from "../../common/constants/errorCodes.js";
import {
  createMeetingRecommendationConfig,
  rankMeetingMenus
} from "./meetingRecommendation.algorithm.js";
import { meetingRecommendationRepository } from "./meetingRecommendation.repository.js";
import type { MeetingRecommendationRequest } from "./meetingRecommendation.dto.js";

export const meetingRecommendationService = {
  async create(userId: number, meetingId: number, input: MeetingRecommendationRequest) {
    validateId(meetingId, "모임 ID가 올바르지 않습니다.");

    const base = await meetingRecommendationRepository.loadMeetingRecommendationBase(meetingId);
    if (!base) throwNotFound("모임을 찾을 수 없습니다.");

    assertMeetingOwner(base.meeting, userId);

    const config = createMeetingRecommendationConfig(input);
    const results = rankMeetingMenus(base, config);
    const run = await meetingRecommendationRepository.saveRun(meetingId, config, results);

    return {
      meetingId,
      run,
      results
    };
  },

  async getLatest(userId: number, meetingId: number) {
    validateId(meetingId, "모임 ID가 올바르지 않습니다.");

    const meeting = await meetingRecommendationRepository.findMeetingById(meetingId);
    if (!meeting) throwNotFound("모임을 찾을 수 없습니다.");

    assertMeetingOwner(meeting, userId);

    const run = await meetingRecommendationRepository.findLatestRun(meetingId);
    if (!run) {
      return {
        meetingId,
        run: null,
        results: []
      };
    }

    return {
      meetingId,
      run,
      results: await meetingRecommendationRepository.findResultsByRunId(Number(run.run_id))
    };
  },

  async selectMenu(userId: number, meetingId: number, menuId: number) {
    validateId(meetingId, "모임 ID가 올바르지 않습니다.");
    validateId(menuId, "메뉴 ID가 올바르지 않습니다.");

    const meeting = await meetingRecommendationRepository.findMeetingById(meetingId);
    if (!meeting) throwNotFound("모임을 찾을 수 없습니다.");

    assertMeetingOwner(meeting, userId);

    const updated = await meetingRecommendationRepository.selectMenu(meetingId, menuId);
    if (!updated) throwNotFound("모임을 찾을 수 없습니다.");

    return updated;
  }
};

function assertMeetingOwner(meeting: { created_by: number }, userId: number) {
  if (Number(meeting.created_by) !== userId) {
    throw {
      status: 403,
      code: ERROR_CODES.FORBIDDEN,
      message: "모임 추천을 관리할 권한이 없습니다."
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