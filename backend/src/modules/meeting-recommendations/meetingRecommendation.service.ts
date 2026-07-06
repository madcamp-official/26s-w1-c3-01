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
    const selectedBase = applyParticipantSelection(base, config.participantUserIds);
    const results = rankMeetingMenus(selectedBase, config);
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

    if (meeting.status === "DECIDED" || meeting.status === "CLOSED") {
      throw {
        status: 409,
        code: ERROR_CODES.CONFLICT,
        message: "이미 메뉴가 확정된 모임입니다."
      };
    }

    const latestCandidate = await meetingRecommendationRepository.findLatestResultByMenuId(meetingId, menuId);
    if (!latestCandidate) {
      throw {
        status: 409,
        code: ERROR_CODES.CONFLICT,
        message: "최신 모임 추천 결과에 포함된 메뉴만 확정할 수 있습니다."
      };
    }

    const updated = await meetingRecommendationRepository.selectMenu(meetingId, menuId);
    if (!updated) throwNotFound("모임을 찾을 수 없습니다.");

    return updated;
  }
};

function applyParticipantSelection(base: any, participantUserIds?: number[]) {
  if (!participantUserIds || participantUserIds.length === 0) return base;

  const selectedIds = Array.from(new Set(participantUserIds.map(Number)));
  const availableIds = new Set(
    (base.participants ?? [])
      .map((participant: { user_id: number | null }) => participant.user_id)
      .filter((userId: number | null): userId is number => userId !== null)
      .map(Number)
  );
  const invalidIds = selectedIds.filter((userId) => !availableIds.has(userId));

  if (invalidIds.length > 0) {
    throw {
      status: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "추천 계산 대상은 해당 모임에 참여한 사용자만 선택할 수 있습니다."
    };
  }

  const selectedSet = new Set(selectedIds);
  const belongsToSelectedUser = (row: { user_id: number }) => selectedSet.has(Number(row.user_id));

  // 구성원 선택 칩에서 제외된 사용자의 선호도/알러지/기록은 추천 계산에서 빼고 저장 config에는 선택값을 남긴다.
  return {
    ...base,
    participants: base.participants.filter((participant: { user_id: number | null }) =>
      participant.user_id !== null && selectedSet.has(Number(participant.user_id))
    ),
    userMenuPreferences: base.userMenuPreferences.filter(belongsToSelectedUser),
    userCategoryPreferences: base.userCategoryPreferences.filter(belongsToSelectedUser),
    userTagPreferences: base.userTagPreferences.filter(belongsToSelectedUser),
    userAllergies: base.userAllergies.filter(belongsToSelectedUser),
    mealHistory: base.mealHistory.filter(belongsToSelectedUser)
  };
}

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
