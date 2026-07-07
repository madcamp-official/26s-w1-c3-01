import { useCallback, type Dispatch, type SetStateAction } from "react";
import { authApi } from "../../api/auth.api";
import { startOAuthLogin, type OAuthProvider } from "../../api/oauth.api";
import { preferencesApi } from "../../api/preferences.api";
import { usersApi } from "../../api/users.api";
import { readAppRoute, type AppRouteState } from "../../app/appNavigation";
import type { ApiStatus, Flow, Tab } from "../../app/app.types";
import { errorMessage, hasPreferenceRows, persistAccessToken } from "../../app/appUtils";
import type { PickData } from "../../domain/mapper";
import { sessionStorageMeta, tokenStorage } from "../../utils/storage";
import type { ReplacePreferenceRequest } from "../preferences/preference.types";
import type { LoginCredentials, SignupCredentials } from "./AuthFlow";

type LoadInitialApiDataOptions = {
  syncPreferences?: boolean;
  userPayload?: unknown;
  preferencesPayload?: unknown;
};

type MasterDataResult = {
  pickData: PickData;
};

type UseAuthActionsValue = {
  nickname: string;
  signupCredentials: SignupCredentials;
  loginCredentials: LoginCredentials;
  profileName: string;
  loadInitialApiData: (options?: LoadInitialApiDataOptions) => Promise<unknown>;
  loadMasterDataOnly: () => Promise<MasterDataResult>;
  applyRouteState: (route: AppRouteState, options?: { restoreStoredFallback?: boolean }) => Promise<void>;
  buildCurrentPreferencePayload: (pickData: PickData) => ReplacePreferenceRequest;
  setAuthBusy: Dispatch<SetStateAction<boolean>>;
  setAuthError: Dispatch<SetStateAction<string>>;
  setApiStatus: Dispatch<SetStateAction<ApiStatus>>;
  setApiError: Dispatch<SetStateAction<string>>;
  setFlow: Dispatch<SetStateAction<Flow>>;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
  setProfileName: Dispatch<SetStateAction<string>>;
  setIsGuestSession: Dispatch<SetStateAction<boolean>>;
  setIsOAuthOnboarding: Dispatch<SetStateAction<boolean>>;
  showToast: (message: string) => void;
};

export function useAuthActions({
  nickname,
  signupCredentials,
  loginCredentials,
  profileName,
  loadInitialApiData,
  loadMasterDataOnly,
  applyRouteState,
  buildCurrentPreferencePayload,
  setAuthBusy,
  setAuthError,
  setApiStatus,
  setApiError,
  setFlow,
  setActiveTab,
  setProfileName,
  setIsGuestSession,
  setIsOAuthOnboarding,
  showToast
}: UseAuthActionsValue) {
  const requestEmailSignup = useCallback(
    async (nextNickname: string) => {
      return authApi.signup({
        email: signupCredentials.email.trim(),
        password: signupCredentials.password,
        nickname: nextNickname.trim() || "밥",
        userType: "USER"
      });
    },
    [signupCredentials.email, signupCredentials.password]
  );

  const handleCheckNickname = useCallback(
    async (nextNickname: string) => {
      setAuthError("");
      try {
        const result = await authApi.checkNickname(nextNickname);
        if (!result.available) {
          setApiStatus("error");
          setAuthError("이미 사용 중인 닉네임입니다.");
          return false;
        }
        return true;
      } catch (error) {
        setApiStatus("error");
        setAuthError(errorMessage(error));
        return false;
      }
    },
    [setApiStatus, setAuthError]
  );

  const handleLogin = useCallback(async () => {
    setAuthBusy(true);
    setAuthError("");
    setApiStatus("authenticating");
    try {
      const loginResponse = await authApi.login({
        email: loginCredentials.email.trim(),
        password: loginCredentials.password
      });
      persistAccessToken(loginResponse);
      sessionStorageMeta.set({ isGuest: false });
      setIsGuestSession(false);
      setIsOAuthOnboarding(false);
      const preferences = await preferencesApi.getMine().catch(() => null);
      const hasPreferences = hasPreferenceRows(preferences);

      if (hasPreferences) {
        await loadInitialApiData({ syncPreferences: true, preferencesPayload: preferences });
        setFlow("app");
        await applyRouteState(readAppRoute(), { restoreStoredFallback: true });
        showToast("로그인했습니다.");
      } else {
        await loadMasterDataOnly();
        setFlow("signup-categories");
        setApiStatus("ready");
        showToast("이메일 인증이 완료되었습니다. 선호도를 설정해주세요.");
      }
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setAuthError(message);
      setApiError(message);
    } finally {
      setAuthBusy(false);
    }
  }, [
    applyRouteState,
    loadInitialApiData,
    loadMasterDataOnly,
    loginCredentials.email,
    loginCredentials.password,
    setApiError,
    setApiStatus,
    setAuthBusy,
    setAuthError,
    setFlow,
    setIsGuestSession,
    setIsOAuthOnboarding,
    showToast
  ]);

  const handleCreateEmailSignup = useCallback(async () => {
    setAuthBusy(true);
    setAuthError("");
    setApiStatus("authenticating");
    try {
      if (!signupCredentials.email.trim() || signupCredentials.password.length < 6) {
        throw new Error("이메일과 6자 이상 비밀번호를 입력해주세요.");
      }
      if (signupCredentials.password !== signupCredentials.passwordConfirm) {
        throw new Error("비밀번호 확인이 일치하지 않습니다.");
      }
      if (!(await handleCheckNickname(nickname))) return;

      const signupResponse = await requestEmailSignup(nickname);
      setProfileName(nickname.trim() || "밥");
      setIsGuestSession(false);
      sessionStorageMeta.set({ isGuest: false });

      if (signupResponse.accessToken) {
        persistAccessToken(signupResponse);
        setIsOAuthOnboarding(false);
        await loadMasterDataOnly();
        setFlow("signup-categories");
        setApiStatus("ready");
        showToast("선호도 설정을 계속해주세요.");
        return;
      }

      setFlow("signup-email-sent");
      setIsOAuthOnboarding(false);
      setApiStatus("ready");
      showToast("인증 메일을 보냈습니다. 이메일 인증 후 로그인해주세요.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setAuthError(message);
      setApiError(message);
    } finally {
      setAuthBusy(false);
    }
  }, [
    handleCheckNickname,
    loadMasterDataOnly,
    nickname,
    requestEmailSignup,
    setApiError,
    setApiStatus,
    setAuthBusy,
    setAuthError,
    setFlow,
    setIsGuestSession,
    setIsOAuthOnboarding,
    setProfileName,
    showToast,
    signupCredentials.email,
    signupCredentials.password,
    signupCredentials.passwordConfirm
  ]);

  const handleOAuthStart = useCallback(
    (provider: OAuthProvider) => {
      setAuthBusy(true);
      setAuthError("");
      setApiStatus("authenticating");
      void startOAuthLogin(provider).catch((error) => {
        const message = errorMessage(error);
        setApiStatus("error");
        setAuthError(message);
        setApiError(message);
        setAuthBusy(false);
      });
    },
    [setApiError, setApiStatus, setAuthBusy, setAuthError]
  );

  const handleOAuthNicknameComplete = useCallback(async () => {
    setAuthBusy(true);
    setAuthError("");
    setApiStatus("authenticating");
    try {
      const normalizedNickname = nickname.trim();
      if (!tokenStorage.get()) {
        throw new Error("소셜 로그인 세션을 찾지 못했습니다. 다시 로그인해주세요.");
      }
      if (!normalizedNickname) {
        throw new Error("닉네임을 입력해주세요.");
      }
      if (!(await handleCheckNickname(normalizedNickname))) return;

      await usersApi.updateMe({
        nickname: normalizedNickname,
        userType: "PERSONAL"
      });
      setProfileName(normalizedNickname);
      setIsGuestSession(false);
      setIsOAuthOnboarding(true);
      sessionStorageMeta.set({ isGuest: false });
      setFlow("signup-categories");
      setApiStatus("ready");
      showToast("닉네임을 저장했습니다. 선호도를 설정해주세요.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setAuthError(message);
      setApiError(message);
    } finally {
      setAuthBusy(false);
    }
  }, [
    handleCheckNickname,
    nickname,
    setApiError,
    setApiStatus,
    setAuthBusy,
    setAuthError,
    setFlow,
    setIsGuestSession,
    setIsOAuthOnboarding,
    setProfileName,
    showToast
  ]);

  const handleSignupComplete = useCallback(async () => {
    setAuthBusy(true);
    setAuthError("");
    setApiStatus("authenticating");
    try {
      const normalizedNickname = nickname.trim() || profileName || "밥";
      if (tokenStorage.get()) {
        if (normalizedNickname !== profileName) {
          if (!(await handleCheckNickname(normalizedNickname))) return;
          await usersApi.updateMe({
            nickname: normalizedNickname,
            userType: "PERSONAL"
          });
        }
      } else {
        throw new Error("이메일 인증 후 로그인하면 선호도 저장을 계속할 수 있습니다.");
      }
      sessionStorageMeta.set({ isGuest: false });
      setProfileName(normalizedNickname);
      setIsGuestSession(false);
      setIsOAuthOnboarding(false);
      const loaded = await loadMasterDataOnly();
      await preferencesApi.replaceMine(buildCurrentPreferencePayload(loaded.pickData));
      setFlow("app");
      setActiveTab("home");
      setApiStatus("ready");
      void loadInitialApiData({ syncPreferences: false });
      showToast("가입 정보와 선호도를 API에 저장했습니다.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setAuthError(message);
      setApiError(message);
    } finally {
      setAuthBusy(false);
    }
  }, [
    buildCurrentPreferencePayload,
    handleCheckNickname,
    loadInitialApiData,
    loadMasterDataOnly,
    nickname,
    profileName,
    setActiveTab,
    setApiError,
    setApiStatus,
    setAuthBusy,
    setAuthError,
    setFlow,
    setIsGuestSession,
    setIsOAuthOnboarding,
    setProfileName,
    showToast
  ]);

  const handleGuestPreferenceComplete = useCallback(async () => {
    setAuthBusy(true);
    setAuthError("");
    setApiStatus("authenticating");
    try {
      const guestResponse = await authApi.guest();
      persistAccessToken(guestResponse);
      sessionStorageMeta.set({ isGuest: true });
      setProfileName(guestResponse.nickname);
      setIsGuestSession(true);
      const loaded = await loadMasterDataOnly();
      await preferencesApi.replaceMine(buildCurrentPreferencePayload(loaded.pickData));
      setFlow("guest-join-meeting");
      setApiStatus("ready");
      showToast("게스트 선호도를 저장했습니다.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setAuthError(message);
      setApiError(message);
    } finally {
      setAuthBusy(false);
    }
  }, [
    buildCurrentPreferencePayload,
    loadMasterDataOnly,
    setApiError,
    setApiStatus,
    setAuthBusy,
    setAuthError,
    setFlow,
    setIsGuestSession,
    setProfileName,
    showToast
  ]);

  return {
    handleLogin,
    handleCheckNickname,
    handleCreateEmailSignup,
    handleOAuthStart,
    handleOAuthNicknameComplete,
    handleSignupComplete,
    handleGuestPreferenceComplete
  };
}
