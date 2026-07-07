import { useCallback, type Dispatch, type SetStateAction } from "react";
import { mealHistoryApi } from "../../api/mealHistory.api";
import { meetingsApi } from "../../api/meetings.api";
import type { ApiStatus, Flow, Tab } from "../../app/app.types";
import { errorMessage } from "../../app/appUtils";
import type { DisplayHistory, DisplayMeeting, DisplayRecommendation } from "../../domain/mapper";
import { sessionStorageMeta } from "../../utils/storage";
import type { MeetingFormValue } from "./MeetingCreateDialog";

type UseMeetingActionsValue = {
  guestMeetingId: string;
  isGuestSession: boolean;
  selectedMeeting: DisplayMeeting | null;
  setGuestDisplayName: Dispatch<SetStateAction<string>>;
  setProfileName: Dispatch<SetStateAction<string>>;
  setFlow: Dispatch<SetStateAction<Flow>>;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
  setApiStatus: Dispatch<SetStateAction<ApiStatus>>;
  setApiError: Dispatch<SetStateAction<string>>;
  setAuthError: Dispatch<SetStateAction<string>>;
  setMeetingActionLoading: Dispatch<SetStateAction<boolean>>;
  setMeetingSaving: Dispatch<SetStateAction<boolean>>;
  setMeetingDialogOpen: Dispatch<SetStateAction<boolean>>;
  showToast: (message: string) => void;
  applySelectedMeetingPayload: (payload: unknown) => DisplayMeeting;
  clearMeetingRecommendations: () => void;
  previewGuestMeeting: (meetingId: number) => Promise<DisplayMeeting>;
  openMeeting: (meeting: DisplayMeeting) => Promise<void>;
  applyMeetingRecommendationPayload: (meetingId: number, payload: unknown) => DisplayRecommendation[];
  applyDecidedMeetingPayload: (meetingId: number, payload: unknown, selectedMenuId: number) => DisplayMeeting;
  mapHistoryFromPayload: (payload: unknown) => Promise<DisplayHistory | null>;
  upsertHistory: (history: DisplayHistory) => void;
};

export function useMeetingActions({
  guestMeetingId,
  isGuestSession,
  selectedMeeting,
  setGuestDisplayName,
  setProfileName,
  setFlow,
  setActiveTab,
  setApiStatus,
  setApiError,
  setAuthError,
  setMeetingActionLoading,
  setMeetingSaving,
  setMeetingDialogOpen,
  showToast,
  applySelectedMeetingPayload,
  clearMeetingRecommendations,
  previewGuestMeeting,
  openMeeting,
  applyMeetingRecommendationPayload,
  applyDecidedMeetingPayload,
  mapHistoryFromPayload,
  upsertHistory
}: UseMeetingActionsValue) {
  const handleJoinMeetingById = useCallback(
    async (meetingIdValue: string, displayNameValue: string) => {
      const meetingId = Number(meetingIdValue);
      if (!Number.isInteger(meetingId) || meetingId <= 0) {
        showToast("올바른 모임 ID를 입력해 주세요.");
        return;
      }
      const displayName = displayNameValue.trim();
      if (!displayName) {
        showToast("모임에서 보일 이름을 입력해 주세요.");
        return;
      }

      setMeetingActionLoading(true);
      setApiError("");
      try {
        const response = await meetingsApi.join(meetingId, displayName);
        applySelectedMeetingPayload(response);
        setProfileName(displayName);
        sessionStorageMeta.set({ isGuest: isGuestSession, meetingId, displayName });
        clearMeetingRecommendations();
        setFlow("app");
        setActiveTab("meeting");
        setApiStatus("ready");
        showToast("모임에 참여했습니다.");
      } catch (error) {
        const message = errorMessage(error);
        setApiStatus("error");
        setApiError(message);
        setAuthError(message);
        showToast(message);
      } finally {
        setMeetingActionLoading(false);
      }
    },
    [
      applySelectedMeetingPayload,
      clearMeetingRecommendations,
      isGuestSession,
      setActiveTab,
      setApiError,
      setApiStatus,
      setAuthError,
      setFlow,
      setMeetingActionLoading,
      setProfileName,
      showToast
    ]
  );

  const handlePreviewGuestMeeting = useCallback(async () => {
    const meetingId = Number(guestMeetingId);
    if (!Number.isInteger(meetingId) || meetingId <= 0) {
      showToast("올바른 모임 ID를 입력해 주세요.");
      return;
    }

    setApiStatus("loading");
    setApiError("");
    setAuthError("");
    try {
      await previewGuestMeeting(meetingId);
      setGuestDisplayName("");
      setFlow("guest-display-name");
      setApiStatus("ready");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setApiError(message);
      setAuthError(message);
      showToast(message);
    }
  }, [
    guestMeetingId,
    previewGuestMeeting,
    setApiError,
    setApiStatus,
    setAuthError,
    setFlow,
    setGuestDisplayName,
    showToast
  ]);

  const handleOpenMeeting = useCallback(
    async (meeting: DisplayMeeting) => {
      await openMeeting(meeting);
    },
    [openMeeting]
  );

  const handleCreateMeetingRecommendation = useCallback(
    async (meetingId: number, participantUserIds?: number[], budgetLevel?: number | null) => {
      setMeetingActionLoading(true);
      setApiError("");
      try {
        const response = await meetingsApi.createRecommendation(meetingId, {
          limit: 6,
          participantUserIds,
          ...(budgetLevel !== undefined ? { budgetMin: budgetLevel, budgetMax: budgetLevel } : {})
        });
        const nextRecommendations = applyMeetingRecommendationPayload(meetingId, response);
        setApiStatus("ready");
        showToast(nextRecommendations.length ? "모임 추천을 계산했습니다." : "조건에 맞는 추천 메뉴가 없습니다.");
      } catch (error) {
        const message = errorMessage(error);
        setApiStatus("error");
        setApiError(message);
        showToast(message);
      } finally {
        setMeetingActionLoading(false);
      }
    },
    [applyMeetingRecommendationPayload, setApiError, setApiStatus, setMeetingActionLoading, showToast]
  );

  const handleDecideMeetingMenu = useCallback(
    async (meetingId: number, item: DisplayRecommendation) => {
      if (!item.menuId) return;
      setMeetingActionLoading(true);
      setApiError("");
      try {
        const updated = await meetingsApi.selectMenu(meetingId, item.menuId);
        const historyCreated = await mealHistoryApi.create({
          menuId: item.menuId,
          rating: 5,
          memo: `${selectedMeeting?.title ?? "모임"}에서 선택`
        });
        const nextHistory = await mapHistoryFromPayload(historyCreated);
        applyDecidedMeetingPayload(meetingId, updated, item.menuId);
        if (nextHistory) upsertHistory(nextHistory);
        setApiStatus("ready");
        showToast("모임 메뉴를 확정하고 식사 기록에 저장했습니다.");
      } catch (error) {
        const message = errorMessage(error);
        setApiStatus("error");
        setApiError(message);
        showToast(message);
      } finally {
        setMeetingActionLoading(false);
      }
    },
    [
      applyDecidedMeetingPayload,
      mapHistoryFromPayload,
      selectedMeeting?.title,
      setApiError,
      setApiStatus,
      setMeetingActionLoading,
      showToast,
      upsertHistory
    ]
  );

  const handleCreateMeeting = useCallback(
    async (meeting: MeetingFormValue) => {
      setMeetingSaving(true);
      setApiError("");
      try {
        const created = await meetingsApi.create({
          title: meeting.title,
          meetingTime: new Date(meeting.meetingTime).toISOString(),
          meetingPurposeId: meeting.meetingPurposeId,
          location: meeting.place
        });
        applySelectedMeetingPayload(created);
        clearMeetingRecommendations();
        setMeetingDialogOpen(false);
        setApiStatus("ready");
        showToast("새 모임을 생성했습니다. 상세에서 추천을 계산해 주세요.");
      } catch (error) {
        const message = errorMessage(error);
        setApiStatus("error");
        setApiError(message);
        showToast(message);
      } finally {
        setMeetingSaving(false);
      }
    },
    [
      applySelectedMeetingPayload,
      clearMeetingRecommendations,
      setApiError,
      setApiStatus,
      setMeetingDialogOpen,
      setMeetingSaving,
      showToast
    ]
  );

  const handleUpdateMeeting = useCallback(
    async (meetingId: number, meeting: MeetingFormValue) => {
      setMeetingSaving(true);
      setApiError("");
      try {
        const updated = await meetingsApi.update(meetingId, {
          title: meeting.title,
          meetingTime: new Date(meeting.meetingTime).toISOString(),
          meetingPurposeId: meeting.meetingPurposeId,
          location: meeting.place
        });
        applySelectedMeetingPayload(updated);
        setApiStatus("ready");
        showToast("모임 정보를 수정했습니다.");
      } catch (error) {
        const message = errorMessage(error);
        setApiStatus("error");
        setApiError(message);
        showToast(message);
      } finally {
        setMeetingSaving(false);
      }
    },
    [applySelectedMeetingPayload, setApiError, setApiStatus, setMeetingSaving, showToast]
  );

  return {
    handleJoinMeetingById,
    handlePreviewGuestMeeting,
    handleOpenMeeting,
    handleCreateMeetingRecommendation,
    handleDecideMeetingMenu,
    handleCreateMeeting,
    handleUpdateMeeting
  };
}
