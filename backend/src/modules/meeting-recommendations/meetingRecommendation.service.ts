import { rankMeetingMenus } from "./meetingRecommendation.algorithm.js";
import { meetingRecommendationRepository } from "./meetingRecommendation.repository.js";

type AuthProfile = {
  userId: number;
  userType: string | null;
};

export const meetingRecommendationService = {
  async create(meetingId: number, input: unknown) {
    const base = filterParticipants(await meetingRecommendationRepository.loadBase(meetingId), input);
    const results = rankMeetingMenus(base, input);
    const { runId } = await meetingRecommendationRepository.saveRun(meetingId, results, input);
    return { meetingId, runId, results };
  },

  async latest(meetingId: number) {
    return { meetingId, ...(await meetingRecommendationRepository.latest(meetingId)) };
  },

  async selectMenu(meetingId: number, menuId: number, profile: AuthProfile) {
    // 메뉴 확정은 모임 생성자만 수행하고, 확정 성공 시 게스트 계정을 정리합니다.
    if (profile.userType === "GUEST") {
      throw Object.assign(new Error("게스트는 모임 메뉴를 확정할 수 없습니다."), { status: 403, code: "FORBIDDEN" });
    }

    const targetMeeting = await meetingRecommendationRepository.findMeetingForSelection(meetingId);
    if (!targetMeeting) {
      throw Object.assign(new Error("존재하지 않는 모임입니다."), { status: 404, code: "NOT_FOUND" });
    }
    if (Number(targetMeeting.created_by) !== profile.userId) {
      throw Object.assign(new Error("모임 생성자만 메뉴를 확정할 수 있습니다."), { status: 403, code: "FORBIDDEN" });
    }
    if (targetMeeting.status === "DECIDED" || targetMeeting.status === "CLOSED") {
      throw Object.assign(new Error("이미 메뉴가 확정된 모임입니다."), { status: 409, code: "CONFLICT" });
    }

    const meeting = await meetingRecommendationRepository.selectMenu(meetingId, menuId);
    const guestUsers = await meetingRecommendationRepository.listGuestParticipants(meetingId);
    await Promise.all(guestUsers.map((guest) => meetingRecommendationRepository.deleteAuthUser(guest.authUserId)));
    return {
      meetingId: Number(meeting.meeting_id),
      selectedMenuId: Number(meeting.selected_menu_id),
      status: meeting.status,
      removedGuestCount: guestUsers.length
    };
  }
};

function filterParticipants(base: any, input: any = {}) {
  // 구성원 칩에서 제외된 사용자는 추천 계산 입력에서 제거합니다.
  const requestedIds = Array.isArray(input?.participantUserIds)
    ? input.participantUserIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0)
    : [];
  if (requestedIds.length === 0) return base;

  const allowedIds = new Set(base.participantUserIds.filter((id: number) => requestedIds.includes(id)));
  if (allowedIds.size === 0) return base;

  const byAllowedUser = (row: any) => allowedIds.has(Number(row.user_id));
  return {
    ...base,
    participantUserIds: base.participantUserIds.filter((id: number) => allowedIds.has(id)),
    categoryPreferences: base.categoryPreferences.filter(byAllowedUser),
    tagPreferences: base.tagPreferences.filter(byAllowedUser),
    menuPreferences: base.menuPreferences.filter(byAllowedUser),
    userAllergies: base.userAllergies.filter(byAllowedUser)
  };
}
