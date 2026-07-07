import { useCallback, type Dispatch, type SetStateAction } from "react";
import { authApi } from "../../api/auth.api";
import { appUiStateStorage, authSessionStorage, sessionStorageMeta } from "../../utils/storage";
import type { ApiStatus, Flow, Tab } from "../app.types";
import { clearMasterDataCache } from "./useMasterData";

type UseAppResetValue = {
  resetRouteSyncReady: () => void;
  resetAuthProfile: () => void;
  resetMeetingState: () => void;
  clearPersonalRecommendations: () => void;
  clearHistories: () => void;
  clearToast: () => void;
  setFlow: Dispatch<SetStateAction<Flow>>;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
  setApiStatus: Dispatch<SetStateAction<ApiStatus>>;
  setApiError: Dispatch<SetStateAction<string>>;
  setAuthError: Dispatch<SetStateAction<string>>;
};

export function useAppReset({
  resetRouteSyncReady,
  resetAuthProfile,
  resetMeetingState,
  clearPersonalRecommendations,
  clearHistories,
  clearToast,
  setFlow,
  setActiveTab,
  setApiStatus,
  setApiError,
  setAuthError
}: UseAppResetValue) {
  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Local session cleanup must run even when the server token is expired.
    }

    clearMasterDataCache();
    authSessionStorage.clear();
    sessionStorageMeta.clear();
    appUiStateStorage.clear();
    resetRouteSyncReady();
    setFlow("start");
    setActiveTab("home");
    resetAuthProfile();
    resetMeetingState();
    clearPersonalRecommendations();
    clearHistories();
    setApiStatus("idle");
    setApiError("");
    setAuthError("");
    clearToast();
  }, [
    clearHistories,
    clearPersonalRecommendations,
    clearToast,
    resetAuthProfile,
    resetMeetingState,
    resetRouteSyncReady,
    setActiveTab,
    setApiError,
    setApiStatus,
    setAuthError,
    setFlow
  ]);

  return { handleLogout };
}
