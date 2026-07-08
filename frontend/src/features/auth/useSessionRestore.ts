import { useCallback, useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { authApi } from "../../api/auth.api";
import { clearOAuthCallbackUrl, readOAuthCallback } from "../../api/oauth.api";
import { preferencesApi } from "../../api/preferences.api";
import { usersApi } from "../../api/users.api";
import { readNumber, readString } from "../../domain/mapper";
import { authSessionStorage, sessionStorageMeta, tokenStorage } from "../../utils/storage";
import { readAppRoute, type AppRouteState } from "../../app/appNavigation";
import type { ApiStatus, Flow, Tab } from "../../app/app.types";
import { errorMessage, hasPreferenceRows, persistAccessToken } from "../../app/appUtils";

type LoadInitialApiDataOptions = {
  syncPreferences?: boolean;
  userPayload?: unknown;
  preferencesPayload?: unknown;
};

type UseSessionRestoreValue = {
  restoreAttemptedRef: MutableRefObject<boolean>;
  markRouteSyncReady: () => void;
  applyRouteState: (route: AppRouteState, options?: { restoreStoredFallback?: boolean }) => Promise<void>;
  loadInitialApiData: (options?: LoadInitialApiDataOptions) => Promise<unknown>;
  loadMasterDataOnly: () => Promise<unknown>;
  restoreMeetingDetail: (meetingId: number, selectedMenuId?: number) => Promise<unknown>;
  clearActiveMeetingState: () => void;
  setFlow: Dispatch<SetStateAction<Flow>>;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
  setNickname: Dispatch<SetStateAction<string>>;
  setGuestMeetingId: Dispatch<SetStateAction<string>>;
  setGuestDisplayName: Dispatch<SetStateAction<string>>;
  setApiStatus: Dispatch<SetStateAction<ApiStatus>>;
  setApiError: Dispatch<SetStateAction<string>>;
  setAuthError: Dispatch<SetStateAction<string>>;
  setProfileName: Dispatch<SetStateAction<string>>;
  setProfileUserId: Dispatch<SetStateAction<number | null>>;
  setIsGuestSession: Dispatch<SetStateAction<boolean>>;
  setIsOAuthOnboarding: Dispatch<SetStateAction<boolean>>;
  showToast: (message: string) => void;
};

export function useSessionRestore({
  restoreAttemptedRef,
  markRouteSyncReady,
  applyRouteState,
  loadInitialApiData,
  loadMasterDataOnly,
  restoreMeetingDetail,
  clearActiveMeetingState,
  setFlow,
  setActiveTab,
  setNickname,
  setGuestMeetingId,
  setGuestDisplayName,
  setApiStatus,
  setApiError,
  setAuthError,
  setProfileName,
  setProfileUserId,
  setIsGuestSession,
  setIsOAuthOnboarding,
  showToast
}: UseSessionRestoreValue) {
  const completeOAuthLogin = useCallback(
    async (session: { accessToken: string; refreshToken?: string; expiresAt?: number }) => {
      persistAccessToken(session);
      sessionStorageMeta.set({ isGuest: false });
      setApiStatus("authenticating");
      setAuthError("");
      setApiError("");

      try {
        await authApi.syncProfile();
        const [userPayload, preferences] = await Promise.all([
          usersApi.getMe(),
          preferencesApi.getMine().catch(() => null)
        ]);
        const user = (userPayload as any)?.user ?? userPayload;
        const currentNickname = readString(user, ["nickname", "name", "email"]) ?? "";
        setProfileUserId(readNumber(user, ["userId", "user_id", "id"]) ?? null);
        const hasPreferences = hasPreferenceRows(preferences);

        setIsGuestSession(false);
        setProfileName(currentNickname || "밥");

        if (hasPreferences) {
          await loadInitialApiData({ syncPreferences: true, userPayload, preferencesPayload: preferences });
          setIsOAuthOnboarding(false);
          setFlow("app");
          await applyRouteState(readAppRoute(), { restoreStoredFallback: true });
          showToast("소셜 로그인으로 접속했습니다.");
        } else {
          await loadMasterDataOnly();
          setNickname("");
          setIsOAuthOnboarding(true);
          setFlow("oauth-nickname");
          setApiStatus("ready");
          showToast("닉네임과 선호도를 설정해주세요.");
        }
      } catch (error) {
        authSessionStorage.clear();
        sessionStorageMeta.clear();
        setApiStatus("error");
        setAuthError(errorMessage(error));
        setProfileName("밥");
        setProfileUserId(null);
        setIsGuestSession(false);
        setIsOAuthOnboarding(false);
        setFlow("start");
      }
    },
    [
      applyRouteState,
      loadInitialApiData,
      loadMasterDataOnly,
      setApiError,
      setApiStatus,
      setAuthError,
      setFlow,
      setIsGuestSession,
      setIsOAuthOnboarding,
      setNickname,
      setProfileName,
      setProfileUserId,
      showToast
    ]
  );

  useEffect(() => {
    if (restoreAttemptedRef.current) return;
    restoreAttemptedRef.current = true;

    const oauthCallback = readOAuthCallback();
    if (oauthCallback.type === "error") {
      clearOAuthCallbackUrl();
      setAuthError(oauthCallback.message);
      return;
    }

    if (oauthCallback.type === "session") {
      clearOAuthCallbackUrl();
      void completeOAuthLogin(oauthCallback);
      return;
    }

    const initialRoute = readAppRoute();
    if (!tokenStorage.get() && initialRoute.flow) {
      setFlow(initialRoute.flow);
    }

    const token = tokenStorage.get();
    if (!token) {
      markRouteSyncReady();
      return;
    }

    const restoreSession = async () => {
      const meta = sessionStorageMeta.get();
      setApiStatus("authenticating");
      setAuthError("");
      setApiError("");
      try {
        const userPayload = await usersApi.getMe();
        const user = (userPayload as any)?.user ?? userPayload;
        const userType = readString(user, ["userType", "user_type"]) ?? "";
        setProfileUserId(readNumber(user, ["userId", "user_id", "id"]) ?? null);
        const isGuest = meta?.isGuest ?? userType === "GUEST";
        const displayName = meta?.displayName ?? readString(user, ["nickname", "name", "email"]) ?? "밥";

        setIsGuestSession(isGuest);
        setProfileName(displayName);
        setFlow(isGuest && !meta?.meetingId ? "guest-join-meeting" : "app");

        await loadInitialApiData({ userPayload });

        if (isGuest && meta?.meetingId) {
          setGuestMeetingId(String(meta.meetingId));
          setGuestDisplayName(displayName);
          setActiveTab("meeting");
          await restoreMeetingDetail(meta.meetingId, readAppRoute().selectedMeetingMenuId);
        } else if (!isGuest) {
          await applyRouteState(readAppRoute(), { restoreStoredFallback: true });
        } else {
          setActiveTab("meeting");
        }

        setApiStatus("ready");
      } catch (error) {
        authSessionStorage.clear();
        sessionStorageMeta.clear();
        setIsGuestSession(false);
        setIsOAuthOnboarding(false);
        setProfileName("밥");
        setProfileUserId(null);
        clearActiveMeetingState();
        setFlow("start");
        setApiStatus("idle");
        setAuthError(errorMessage(error));
      }
    };

    void restoreSession();
  }, [
    applyRouteState,
    clearActiveMeetingState,
    completeOAuthLogin,
    loadInitialApiData,
    markRouteSyncReady,
    restoreAttemptedRef,
    restoreMeetingDetail,
    setActiveTab,
    setApiError,
    setApiStatus,
    setAuthError,
    setFlow,
    setGuestDisplayName,
    setGuestMeetingId,
    setIsGuestSession,
    setProfileName,
    setProfileUserId
  ]);
}
