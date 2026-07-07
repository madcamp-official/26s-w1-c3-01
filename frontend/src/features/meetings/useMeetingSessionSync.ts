import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { ApiStatus, Flow, Tab } from "../../app/app.types";
import { errorMessage, isAuthSessionError } from "../../app/appUtils";
import { clearMasterDataCache } from "../../app/model/useMasterData";
import type { DisplayMeeting } from "../../domain/mapper";
import { appUiStateStorage, authSessionStorage, sessionStorageMeta } from "../../utils/storage";

type SyncSelectedMeetingDetailResult = {
  previousMeeting: DisplayMeeting;
  nextMeeting: DisplayMeeting;
} | null;

type UseMeetingSessionSyncValue = {
  isGuestSession: boolean;
  selectedMeetingId?: number;
  syncSelectedMeetingDetail: () => Promise<SyncSelectedMeetingDetailResult>;
  clearActiveMeetingState: () => void;
  resetRouteSyncReady: () => void;
  setFlow: Dispatch<SetStateAction<Flow>>;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
  setIsGuestSession: Dispatch<SetStateAction<boolean>>;
  setApiStatus: Dispatch<SetStateAction<ApiStatus>>;
  setApiError: Dispatch<SetStateAction<string>>;
  setAuthError: Dispatch<SetStateAction<string>>;
  showToast: (message: string) => void;
};

function isFinalizedMeeting(meeting: DisplayMeeting) {
  return meeting.status === "DECIDED" || meeting.status === "CLOSED";
}

export function useMeetingSessionSync({
  isGuestSession,
  selectedMeetingId,
  syncSelectedMeetingDetail,
  clearActiveMeetingState,
  resetRouteSyncReady,
  setFlow,
  setActiveTab,
  setIsGuestSession,
  setApiStatus,
  setApiError,
  setAuthError,
  showToast
}: UseMeetingSessionSyncValue) {
  const clearGuestFinalizedSession = useCallback(() => {
    clearMasterDataCache();
    authSessionStorage.clear();
    sessionStorageMeta.clear();
    appUiStateStorage.clear();
    resetRouteSyncReady();
    setFlow("start");
    setActiveTab("home");
    setIsGuestSession(false);
    clearActiveMeetingState();
    setApiStatus("idle");
    setApiError("");
    setAuthError("");
    showToast("모임 메뉴가 확정되어 게스트 세션을 종료했습니다.");
  }, [
    clearActiveMeetingState,
    resetRouteSyncReady,
    setActiveTab,
    setApiError,
    setApiStatus,
    setAuthError,
    setFlow,
    setIsGuestSession,
    showToast
  ]);

  const syncSelectedMeeting = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!selectedMeetingId) return;

      try {
        const syncedMeeting = await syncSelectedMeetingDetail();
        if (!syncedMeeting) return;

        const { previousMeeting, nextMeeting } = syncedMeeting;
        const wasOpen = !isFinalizedMeeting(previousMeeting);
        const isNowDone = isFinalizedMeeting(nextMeeting);

        if (isGuestSession && isNowDone) {
          clearGuestFinalizedSession();
          return;
        }

        if (wasOpen && isNowDone && !silent) {
          showToast("모임 메뉴 확정 결과가 반영되었습니다.");
        }
      } catch (error) {
        if (isGuestSession && isAuthSessionError(error)) {
          clearGuestFinalizedSession();
          return;
        }

        if (!silent) {
          const message = errorMessage(error);
          setApiStatus("error");
          setApiError(message);
          showToast(message);
        }
      }
    },
    [
      clearGuestFinalizedSession,
      isGuestSession,
      selectedMeetingId,
      setApiError,
      setApiStatus,
      showToast,
      syncSelectedMeetingDetail
    ]
  );

  return { syncSelectedMeeting };
}
