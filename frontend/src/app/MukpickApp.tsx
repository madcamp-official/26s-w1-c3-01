import { useCallback, useEffect, useRef, useState } from "react";
import { readAppRoute, type AppRouteState } from "./appNavigation";
import type { ApiStatus, Flow, Tab } from "./app.types";
import { errorMessage, hasPreferenceRows, isAuthSessionError, persistAccessToken } from "./appUtils";
import { authApi } from "../api/auth.api";
import { masterDataApi } from "../api/masterData.api";
import { mealHistoryApi } from "../api/mealHistory.api";
import { menuInteractionsApi, type MenuInteractionType } from "../api/menuInteractions.api";
import { meetingsApi } from "../api/meetings.api";
import { clearOAuthCallbackUrl, readOAuthCallback, startOAuthLogin, type OAuthProvider } from "../api/oauth.api";
import { preferencesApi } from "../api/preferences.api";
import { recommendationsApi } from "../api/recommendations.api";
import { userPreferencesApi } from "../api/userPreferences.api";
import { usersApi } from "../api/users.api";
import {
  buildPreferencePayload,
  fallbackPickData,
  mapCreatedMeeting,
  mapHistories,
  mapMeetingPurposes,
  mapMeetings,
  mapMenus,
  mapPickItems,
  mapRecommendations,
  mapUsers,
  readNumber,
  readString,
  scoreMapFromPreferenceRows,
  selectedAllergyIdsFromPreferences,
  selectedIdsFromPreferenceRows,
  type DisplayHistory,
  type DisplayMeeting,
  type DisplayRecommendation,
  type MeetingPurpose,
  type PickData,
  type PreferenceScoreMap,
  type RecommendationRefreshValue,
  type RemoteMenu,
  type UserOption
} from "../domain/mapper";
import { AuthFlow, type LoginCredentials, type SignupCredentials } from "../features/auth/AuthFlow";
import type { MealHistoryFormValue } from "../features/mealHistory/MealHistoryDialog";
import type { MeetingFormValue } from "../features/meetings/MeetingCreateDialog";
import { appUiStateStorage, authSessionStorage, sessionStorageMeta, tokenStorage } from "../utils/storage";
import { AppScreens } from "./routes/AppScreens";
import { useAppUrlSync } from "./useAppUrlSync";

export function MukpickApp() {
  const restoreAttemptedRef = useRef(false);
  const [flow, setFlow] = useState<Flow>("start");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [nickname, setNickname] = useState("");
  const [signupCredentials, setSignupCredentials] = useState<SignupCredentials>({
    email: "",
    password: "",
    passwordConfirm: ""
  });
  const [loginCredentials, setLoginCredentials] = useState<LoginCredentials>({ email: "", password: "" });
  const [guestDisplayName, setGuestDisplayName] = useState("");
  const [guestMeetingId, setGuestMeetingId] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["korean", "japanese"]);
  const [selectedTags, setSelectedTags] = useState<string[]>(["spicy", "soup"]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(["shrimp"]);
  const [categoryScores, setCategoryScores] = useState<PreferenceScoreMap>({ korean: 5, japanese: 4 });
  const [tagScores, setTagScores] = useState<PreferenceScoreMap>({ spicy: 5, soup: 4 });
  const [newMenuIncluded, setNewMenuIncluded] = useState(true);
  const [recentDuplicateDays, setRecentDuplicateDays] = useState(3);
  const [budgetMin, setBudgetMin] = useState<number | null>(null);
  const [budgetMax, setBudgetMax] = useState<number | null>(null);
  const [pickData, setPickData] = useState<PickData>(fallbackPickData);
  const [menuOptions, setMenuOptions] = useState<RemoteMenu[]>([]);
  const [meetingPurposes, setMeetingPurposes] = useState<MeetingPurpose[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [recommendationItems, setRecommendationItems] = useState<DisplayRecommendation[]>([]);
  const [personalRecommendationReady, setPersonalRecommendationReady] = useState(false);
  const [selectedPersonalRecommendation, setSelectedPersonalRecommendation] = useState<DisplayRecommendation | null>(null);
  const [meetingItems, setMeetingItems] = useState<DisplayMeeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<DisplayMeeting | null>(null);
  const [guestPreviewMeeting, setGuestPreviewMeeting] = useState<DisplayMeeting | null>(null);
  const [meetingRecommendations, setMeetingRecommendations] = useState<DisplayRecommendation[]>([]);
  const [selectedMeetingRecommendation, setSelectedMeetingRecommendation] = useState<DisplayRecommendation | null>(null);
  const [excludedMeetingUserIds, setExcludedMeetingUserIds] = useState<number[]>([]);
  const [historyItems, setHistoryItems] = useState<DisplayHistory[]>([]);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [apiError, setApiError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [meetingSaving, setMeetingSaving] = useState(false);
  const [profileName, setProfileName] = useState("밥");
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [isGuestSession, setIsGuestSession] = useState(false);
  const [isOAuthOnboarding, setIsOAuthOnboarding] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 2200);
  }, []);

  const restoreMeetingDetail = useCallback(async (meetingId: number, selectedMenuId?: number) => {
    const meeting = mapCreatedMeeting(await meetingsApi.get(meetingId));
    setSelectedMeeting(meeting.id ? meeting : null);
    setActiveTab("meeting");
    setMeetingRecommendations([]);
    setSelectedMeetingRecommendation(null);

    try {
      const latest = mapRecommendations(await meetingsApi.getLatestRecommendation(meetingId));
      setMeetingRecommendations(latest);
      setSelectedMeetingRecommendation(latest.find((item) => item.menuId === selectedMenuId) ?? null);
    } catch {
      setMeetingRecommendations([]);
    }
  }, []);

  const applyRouteState = useCallback(
    async (route: AppRouteState, options: { restoreStoredFallback?: boolean } = {}) => {
      const stored = appUiStateStorage.get();
      const nextTab = route.tab ?? (options.restoreStoredFallback ? stored.activeTab : undefined);
      const selectedMeetingId =
        route.meetingId ?? (options.restoreStoredFallback ? stored.selectedMeetingId : undefined);
      const selectedPersonalMenuId =
        route.selectedPersonalMenuId ?? (options.restoreStoredFallback ? stored.selectedPersonalMenuId : undefined);
      const selectedMeetingMenuId =
        route.selectedMeetingMenuId ?? (options.restoreStoredFallback ? stored.selectedMeetingMenuId : undefined);

      if (nextTab) setActiveTab(nextTab);

      if (nextTab !== "meeting" || !selectedMeetingId) {
        if (nextTab === "meeting") setSelectedMeeting(null);
      } else {
        try {
          await restoreMeetingDetail(selectedMeetingId, selectedMeetingMenuId);
        } catch (error) {
          setSelectedMeeting(null);
          setMeetingRecommendations([]);
          setSelectedMeetingRecommendation(null);
          setApiError(errorMessage(error));
        }
      }

      if (nextTab === "personal") {
        const storedRecommendations = (stored.personalRecommendations ?? []).map((item, index) => ({
          rank: index + 1,
          menuId: item.menuId,
          menu: item.menu,
          score: item.score ?? 0,
          category: "",
          reason: item.reason ?? ""
        }));
        if (storedRecommendations.length) {
          setRecommendationItems(storedRecommendations);
          setPersonalRecommendationReady(true);
          setSelectedPersonalRecommendation(
            storedRecommendations.find((item) => item.menuId === selectedPersonalMenuId) ?? null
          );
        }
      }
    },
    [restoreMeetingDetail]
  );

  const { markRouteSyncReady, resetRouteSyncReady } = useAppUrlSync({
    flow,
    activeTab,
    isGuestSession,
    selectedMeetingId: selectedMeeting?.id,
    selectedPersonalMenuId: selectedPersonalRecommendation?.menuId,
    selectedMeetingMenuId: selectedMeetingRecommendation?.menuId,
    personalRecommendations: recommendationItems,
    applyRouteState,
    setFlow
  });

  const clearGuestFinalizedSession = useCallback(() => {
    authSessionStorage.clear();
    sessionStorageMeta.clear();
    appUiStateStorage.clear();
    resetRouteSyncReady();
    setFlow("start");
    setActiveTab("home");
    setIsGuestSession(false);
    setSelectedMeeting(null);
    setGuestPreviewMeeting(null);
    setMeetingRecommendations([]);
    setSelectedMeetingRecommendation(null);
    setExcludedMeetingUserIds([]);
    setApiStatus("idle");
    setApiError("");
    setAuthError("");
    showToast("모임 메뉴가 확정되어 게스트 세션을 종료했습니다.");
  }, [showToast]);

  const syncSelectedMeeting = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!selectedMeeting?.id) return;

      try {
        const nextMeeting = mapCreatedMeeting(await meetingsApi.get(selectedMeeting.id));
        const wasOpen = selectedMeeting.status !== "DECIDED" && selectedMeeting.status !== "CLOSED";
        const isNowDone = nextMeeting.status === "DECIDED" || nextMeeting.status === "CLOSED";

        setSelectedMeeting(nextMeeting.id ? nextMeeting : null);
        setMeetingItems((current) =>
          current.map((meeting) => (meeting.id === nextMeeting.id ? { ...meeting, ...nextMeeting } : meeting))
        );

        try {
          const latest = mapRecommendations(await meetingsApi.getLatestRecommendation(selectedMeeting.id));
          setMeetingRecommendations(latest);
          setSelectedMeetingRecommendation((current) =>
            current?.menuId ? latest.find((item) => item.menuId === current.menuId) ?? current : current
          );
        } catch {
          if (nextMeeting.status === "CREATED") {
            setMeetingRecommendations([]);
            setSelectedMeetingRecommendation(null);
          }
        }

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
    [clearGuestFinalizedSession, isGuestSession, selectedMeeting, showToast]
  );

  const loadApiData = useCallback(
    async ({ syncPreferences = true }: { syncPreferences?: boolean } = {}) => {
      setApiStatus("loading");
      setApiError("");

      const results = await Promise.allSettled([
        masterDataApi.listMenus(),
        masterDataApi.listMenuCategories(),
        masterDataApi.listTags(),
        masterDataApi.listAllergies(),
        masterDataApi.listMeetingPurposes(),
        preferencesApi.getMine(),
        meetingsApi.list(),
        mealHistoryApi.listMine(),
        usersApi.getMe(),
        usersApi.list()
      ]);

      const [
        menusResult,
        categoriesResult,
        tagsResult,
        allergiesResult,
        purposesResult,
        preferencesResult,
        meetingsResult,
        historiesResult,
        userResult,
        usersResult
      ] = results;

      const nextMenus = menusResult.status === "fulfilled" ? mapMenus(menusResult.value) : [];
      const nextPickData: PickData = {
        categories:
          categoriesResult.status === "fulfilled"
            ? mapPickItems(categoriesResult.value, fallbackPickData.categories, "categories")
            : fallbackPickData.categories,
        tags:
          tagsResult.status === "fulfilled"
            ? mapPickItems(tagsResult.value, fallbackPickData.tags, "tags")
            : fallbackPickData.tags,
        allergies:
          allergiesResult.status === "fulfilled"
            ? mapPickItems(allergiesResult.value, fallbackPickData.allergies, "allergies")
            : fallbackPickData.allergies
      };
      const nextMeetingPurposes =
        purposesResult.status === "fulfilled" ? mapMeetingPurposes(purposesResult.value) : [];

      setPickData(nextPickData);
      setMenuOptions(nextMenus);
      setMeetingPurposes(nextMeetingPurposes);
      setMeetingItems(meetingsResult.status === "fulfilled" ? mapMeetings(meetingsResult.value) : []);
      const nextHistories = historiesResult.status === "fulfilled" ? mapHistories(historiesResult.value, nextMenus) : [];
      try {
        const menuIds = Array.from(
          new Set(nextHistories.map((history) => history.menuId).filter((menuId): menuId is number => Boolean(menuId)))
        );
        const interactionStates = await menuInteractionsApi.listMine(menuIds);
        const interactionStateMap = new Map(interactionStates.map((state) => [state.menuId, state]));

        setHistoryItems(
          nextHistories.map((history) => {
            const state = history.menuId ? interactionStateMap.get(history.menuId) : undefined;
            return {
              ...history,
              preference: state?.preference ?? null,
              bookmarked: state?.bookmarked ?? false
            };
          })
        );
      } catch {
        setHistoryItems(nextHistories);
      }
      setUserOptions(usersResult.status === "fulfilled" ? mapUsers(usersResult.value) : []);

      if (syncPreferences && preferencesResult.status === "fulfilled") {
        const preferences = preferencesResult.value as any;
        setSelectedCategories(
          selectedIdsFromPreferenceRows(preferences?.categoryPreferences, nextPickData.categories, [
            "categoryId",
            "category_id",
            "id"
          ])
        );
        setCategoryScores(
          scoreMapFromPreferenceRows(preferences?.categoryPreferences, nextPickData.categories, [
            "categoryId",
            "category_id",
            "id"
          ])
        );
        setSelectedTags(
          selectedIdsFromPreferenceRows(preferences?.tagPreferences, nextPickData.tags, ["tagId", "tag_id", "id"])
        );
        setTagScores(scoreMapFromPreferenceRows(preferences?.tagPreferences, nextPickData.tags, ["tagId", "tag_id", "id"]));
        setSelectedAllergies(selectedAllergyIdsFromPreferences(preferences?.allergyIds, nextPickData.allergies));
      }

      try {
        const userPreference = await userPreferencesApi.get();
        setBudgetMin(userPreference.budgetMin ?? null);
        setBudgetMax(userPreference.budgetMax ?? null);
      } catch {
        // 추천 설정 테이블이 아직 배포되지 않은 환경에서도 기본 기능은 유지한다.
      }

      if (userResult.status === "fulfilled") {
        const userPayload = userResult.value as any;
        const user = userPayload?.user ?? userPayload;
        setProfileName(readString(user, ["nickname", "name", "email"]) ?? "밥");
        setProfileUserId(readNumber(user, ["userId", "user_id", "id"]) ?? null);
      }

      const rejected = results.find((result) => result.status === "rejected");
      if (rejected?.status === "rejected") {
        const message = errorMessage(rejected.reason);
        setApiStatus("error");
        setApiError(message);
      } else {
        setApiStatus("ready");
      }

      const nextMeetings = meetingsResult.status === "fulfilled" ? mapMeetings(meetingsResult.value) : [];
      return { pickData: nextPickData, menus: nextMenus, meetingPurposes: nextMeetingPurposes, meetings: nextMeetings };
    },
    []
  );

  const completeOAuthLogin = useCallback(
    async (session: { accessToken: string; refreshToken?: string; expiresAt?: number }) => {
      persistAccessToken(session);
      sessionStorageMeta.set({ isGuest: false });
      setApiStatus("authenticating");
      setAuthError("");
      setApiError("");

      try {
        const userPayload = await usersApi.getMe();
        const user = (userPayload as any)?.user ?? userPayload;
        const currentNickname = readString(user, ["nickname", "name", "email"]) ?? "";
        setProfileUserId(readNumber(user, ["userId", "user_id", "id"]) ?? null);
        const preferences = await preferencesApi.getMine();
        const hasPreferences = hasPreferenceRows(preferences);

        setIsGuestSession(false);
        setProfileName(currentNickname || "밥");
        await loadApiData({ syncPreferences: hasPreferences });

        if (hasPreferences) {
          setIsOAuthOnboarding(false);
          setFlow("app");
          await applyRouteState(readAppRoute(), { restoreStoredFallback: true });
          showToast("소셜 로그인으로 접속했습니다.");
        } else {
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
      }
    },
    [applyRouteState, loadApiData, showToast]
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

    // 새로고침 후에도 저장된 토큰과 세션 메타로 마지막 화면을 복원합니다.
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

        await loadApiData();

        if (isGuest && meta?.meetingId) {
          setGuestMeetingId(String(meta.meetingId));
          setGuestDisplayName(displayName);
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
        setSelectedMeeting(null);
        setFlow("start");
        setApiStatus("idle");
        setAuthError(errorMessage(error));
      }
    };

    void restoreSession();
  }, [applyRouteState, completeOAuthLogin, loadApiData, restoreMeetingDetail]);

  const requestEmailSignup = async (nextNickname: string) => {
    return authApi.signup({
      email: signupCredentials.email.trim(),
      password: signupCredentials.password,
      nickname: nextNickname.trim() || "밥",
      userType: "USER"
    });
  };

  const handleLogin = async () => {
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
      await loadApiData({ syncPreferences: hasPreferences });

      if (hasPreferences) {
        setFlow("app");
        await applyRouteState(readAppRoute(), { restoreStoredFallback: true });
        showToast("로그인했습니다.");
      } else {
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
  };

  const handleCheckNickname = async (nextNickname: string) => {
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
  };

  const handleCreateEmailSignup = async () => {
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
        await loadApiData({ syncPreferences: false });
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
  };

  const handleOAuthStart = (provider: OAuthProvider) => {
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
  };

  const handleOAuthNicknameComplete = async () => {
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
  };

  const handleSignupComplete = async () => {
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
      const loaded = await loadApiData({ syncPreferences: false });
      await preferencesApi.replaceMine(
        buildPreferencePayload({
          selectedCategories,
          selectedTags,
          selectedAllergies,
          pickData: loaded.pickData,
          categoryScores,
          tagScores
        })
      );
      setFlow("app");
      setActiveTab("home");
      await loadApiData();
      showToast("가입 정보와 선호도를 API에 저장했습니다.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setAuthError(message);
      setApiError(message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGuestPreferenceComplete = async () => {
    setAuthBusy(true);
    setAuthError("");
    setApiStatus("authenticating");
    try {
      const guestResponse = await authApi.guest();
      persistAccessToken(guestResponse);
      sessionStorageMeta.set({ isGuest: true });
      setProfileName(guestResponse.nickname);
      setIsGuestSession(true);
      const loaded = await loadApiData({ syncPreferences: false });
      await preferencesApi.replaceMine(
        buildPreferencePayload({
          selectedCategories,
          selectedTags,
          selectedAllergies,
          pickData: loaded.pickData,
          categoryScores,
          tagScores
        })
      );
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
  };

  const handleJoinMeetingById = async (meetingIdValue: string, displayNameValue: string) => {
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

    setApiStatus("loading");
    setApiError("");
    try {
      const response = await meetingsApi.join(meetingId, displayName);
      await loadApiData();
      const joinedMeeting = mapCreatedMeeting((response as any)?.meeting ?? response);
      setProfileName(displayName);
      sessionStorageMeta.set({ isGuest: isGuestSession, meetingId, displayName });
      setSelectedMeeting(joinedMeeting.id ? joinedMeeting : null);
      setMeetingRecommendations([]);
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
    }
  };

  const handlePreviewGuestMeeting = async () => {
    const meetingId = Number(guestMeetingId);
    if (!Number.isInteger(meetingId) || meetingId <= 0) {
      showToast("올바른 모임 ID를 입력해 주세요.");
      return;
    }

    setApiStatus("loading");
    setApiError("");
    setAuthError("");
    try {
      const response = await meetingsApi.preview(meetingId);
      setGuestPreviewMeeting(mapCreatedMeeting(response));
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
  };

  const handlePreferenceSave = async () => {
    setApiStatus("loading");
    setApiError("");
    try {
      await preferencesApi.replaceMine(
        buildPreferencePayload({
          selectedCategories,
          selectedTags,
          selectedAllergies,
          pickData,
          categoryScores,
          tagScores
        })
      );
      await loadApiData();
      showToast("선호도가 API에 저장되었습니다.");
      setActiveTab("home");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setApiError(message);
      showToast(message);
    }
  };

  const handleRecommendationRefresh = async ({
    recentDuplicateDays,
    includeNewMenu,
    budgetMin,
    budgetMax
  }: RecommendationRefreshValue) => {
    setApiStatus("loading");
    setApiError("");
    try {
      try {
        await userPreferencesApi.update({
          budgetMin,
          budgetMax
        });
      } catch {
        // 배포된 백엔드에 예산 API가 아직 없더라도 추천 기능은 계속 사용할 수 있게 한다.
      }

      const response = await recommendationsApi.createPersonal({
        recentDuplicateDays,
        includeNewMenu,
        limit: 3
      });
      const nextRecommendations = mapRecommendations(response);
      setRecommendationItems(nextRecommendations);
      setSelectedPersonalRecommendation(null);
      setPersonalRecommendationReady(true);
      await Promise.allSettled(
        nextRecommendations
          .filter((item) => item.menuId)
          .map((item) => menuInteractionsApi.create(item.menuId!, "view"))
      );
      setApiStatus("ready");
      showToast("추천 API를 다시 호출했습니다.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setApiError(message);
      showToast(message);
    }
  };

  const recordMenuInteraction = async (
    item: DisplayRecommendation,
    interactionType: MenuInteractionType,
    successMessage?: string
  ) => {
    if (!item.menuId) return;

    try {
      await menuInteractionsApi.create(item.menuId, interactionType);
      if (successMessage) showToast(successMessage);
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setApiError(message);
      showToast(message);
    }
  };

  const handleHistoryInteractionToggle = async (
    item: DisplayHistory,
    interactionType: "like" | "dislike" | "bookmark"
  ) => {
    if (!item.menuId) return;

    const selected =
      interactionType === "bookmark"
        ? !item.bookmarked
        : item.preference !== interactionType;

    try {
      const nextState = await menuInteractionsApi.setState(item.menuId, interactionType, selected);
      setHistoryItems((current) =>
        current.map((history) =>
          history.menuId === item.menuId
            ? {
                ...history,
                preference: nextState.preference,
                bookmarked: nextState.bookmarked
              }
            : history
        )
      );
      showToast(selected ? "식사 기록 피드백을 저장했습니다." : "식사 기록 피드백을 취소했습니다.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setApiError(message);
      showToast(message);
    }
  };

  const handleCreateHistory = async ({ menuId, rating, memo }: MealHistoryFormValue) => {
    setApiStatus("loading");
    setApiError("");
    try {
      await mealHistoryApi.create({
        menuId,
        rating,
        memo: memo.trim() || undefined,
        eatenAt: new Date().toISOString()
      });
      await loadApiData();
      setApiStatus("ready");
      showToast("식사 기록을 저장했습니다.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setApiError(message);
      showToast(message);
    }
  };

  const handleUpdateHistory = async (
    historyId: number,
    { menuId, rating, memo, eatenAt }: MealHistoryFormValue & { eatenAt?: string }
  ) => {
    setApiStatus("loading");
    setApiError("");
    try {
      await mealHistoryApi.update(historyId, {
        menuId,
        rating,
        memo: memo.trim(),
        eatenAt
      });
      await loadApiData();
      setApiStatus("ready");
      showToast("식사 기록을 수정했습니다.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setApiError(message);
      showToast(message);
    }
  };

  const handleDeleteHistory = async (historyId: number) => {
    if (!window.confirm("이 식사 기록을 삭제할까요?")) return;
    setApiStatus("loading");
    setApiError("");
    try {
      await mealHistoryApi.remove(historyId);
      await loadApiData();
      setApiStatus("ready");
      showToast("식사 기록을 삭제했습니다.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setApiError(message);
      showToast(message);
    }
  };

  const handleConfirmPersonalRecommendation = async () => {
    if (!selectedPersonalRecommendation?.menuId) return;
    await recordMenuInteraction(selectedPersonalRecommendation, "pick");
    await handleCreateHistory({
      menuId: selectedPersonalRecommendation.menuId,
      rating: 5,
      memo: `${selectedPersonalRecommendation.menu} 추천 최종 선택`
    });
    setActiveTab("history");
  };

  const handleOpenMeeting = async (meeting: DisplayMeeting) => {
    setSelectedMeeting(meeting);
    setMeetingRecommendations([]);
    setSelectedMeetingRecommendation(null);
    setExcludedMeetingUserIds([]);
    if (!meeting.id) return;
    try {
      const latest = await meetingsApi.getLatestRecommendation(meeting.id);
      setMeetingRecommendations(mapRecommendations(latest));
    } catch {
      setMeetingRecommendations([]);
    }
  };

  const handleCreateMeetingRecommendation = async (meetingId: number, participantUserIds?: number[]) => {
    setApiStatus("loading");
    setApiError("");
    try {
      const response = await meetingsApi.createRecommendation(meetingId, { limit: 3, participantUserIds });
      const nextRecommendations = mapRecommendations(response);
      setMeetingRecommendations(nextRecommendations);
      setSelectedMeetingRecommendation(null);
      await loadApiData();
      setSelectedMeeting((current) =>
        current ? { ...current, status: nextRecommendations.length ? "RECOMMENDED" : current.status } : current
      );
      setApiStatus("ready");
      showToast(nextRecommendations.length ? "모임 추천을 계산했습니다." : "조건에 맞는 추천 메뉴가 없습니다.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setApiError(message);
      showToast(message);
    }
  };

  const handleDecideMeetingMenu = async (meetingId: number, item: DisplayRecommendation) => {
    if (!item.menuId) return;
    setApiStatus("loading");
    setApiError("");
    try {
      await meetingsApi.selectMenu(meetingId, item.menuId);
      await mealHistoryApi.create({
        menuId: item.menuId,
        rating: 5,
        memo: `${selectedMeeting?.title ?? "모임"}에서 선택`
      });
      await loadApiData();
      setSelectedMeeting((current) => current ? { ...current, status: "DECIDED" } : current);
      setApiStatus("ready");
      showToast("모임 메뉴를 확정하고 식사 기록에 저장했습니다.");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setApiError(message);
      showToast(message);
    }
  };

  const handleCreateMeeting = async (meeting: MeetingFormValue) => {
    setMeetingSaving(true);
    setApiStatus("loading");
    setApiError("");
    try {
      const created = await meetingsApi.create({
        title: meeting.title,
        meetingTime: new Date(meeting.meetingTime).toISOString(),
        meetingPurposeId: meeting.meetingPurposeId,
        location: meeting.place
      });
      const createdMeeting = mapCreatedMeeting(created);
      const meetingId = createdMeeting.id;
      if (meetingId) {
        await Promise.all(meeting.participantUserIds.map((userId) => meetingsApi.addParticipant(meetingId, userId)));
      }
      await loadApiData();
      setSelectedMeeting(createdMeeting);
      setMeetingRecommendations([]);
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
  };

  const handleUpdateMeeting = async (meetingId: number, meeting: MeetingFormValue) => {
    setMeetingSaving(true);
    setApiStatus("loading");
    setApiError("");
    try {
      const updated = await meetingsApi.update(meetingId, {
        title: meeting.title,
        meetingTime: new Date(meeting.meetingTime).toISOString(),
        meetingPurposeId: meeting.meetingPurposeId,
        location: meeting.place
      });
      const updatedMeeting = mapCreatedMeeting(updated);
      await loadApiData();
      setSelectedMeeting(updatedMeeting.id ? updatedMeeting : null);
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
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // 서버 토큰이 만료되었거나 이미 삭제된 경우에도 로컬 세션은 반드시 정리합니다.
    }
    // 로그아웃은 서버 응답과 관계없이 브라우저에 남은 세션 정보를 모두 제거합니다.
    authSessionStorage.clear();
    sessionStorageMeta.clear();
    appUiStateStorage.clear();
    resetRouteSyncReady();
    setFlow("start");
    setActiveTab("home");
    setIsGuestSession(false);
    setProfileUserId(null);
    setSelectedMeeting(null);
    setGuestPreviewMeeting(null);
    setMeetingRecommendations([]);
    setSelectedMeetingRecommendation(null);
    setExcludedMeetingUserIds([]);
    setRecommendationItems([]);
    setPersonalRecommendationReady(false);
    setHistoryItems([]);
    setMeetingItems([]);
    setUserOptions([]);
    setApiStatus("idle");
    setApiError("");
    setAuthError("");
    setToastMessage("");
  };

  useEffect(() => {
    if (flow !== "app" || !selectedMeeting?.id) return;

    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      void syncSelectedMeeting({ silent: true });
    };

    const intervalId = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [flow, selectedMeeting?.id, syncSelectedMeeting]);

  if (flow !== "app") {
    return (
      <AuthFlow
        flow={flow}
        nickname={nickname}
        signupCredentials={signupCredentials}
        loginCredentials={loginCredentials}
        selectedCategories={selectedCategories}
        selectedTags={selectedTags}
        selectedAllergies={selectedAllergies}
        categoryScores={categoryScores}
        tagScores={tagScores}
        recentDuplicateDays={recentDuplicateDays}
        onFlowChange={setFlow}
        onNicknameChange={setNickname}
        onSignupCredentialsChange={setSignupCredentials}
        onLoginCredentialsChange={setLoginCredentials}
        onSelectedCategoriesChange={setSelectedCategories}
        onSelectedTagsChange={setSelectedTags}
        onSelectedAllergiesChange={setSelectedAllergies}
        onCategoryScoresChange={setCategoryScores}
        onTagScoresChange={setTagScores}
        onRecentDuplicateDaysChange={setRecentDuplicateDays}
        guestDisplayName={guestDisplayName}
        guestMeetingId={guestMeetingId}
        guestPreviewMeeting={guestPreviewMeeting}
        onGuestDisplayNameChange={setGuestDisplayName}
        onGuestMeetingIdChange={setGuestMeetingId}
        pickData={pickData}
        authBusy={authBusy || apiStatus === "loading"}
        authError={authError}
        isOAuthOnboarding={isOAuthOnboarding}
        onOAuthStart={handleOAuthStart}
        onLogin={handleLogin}
        onCheckNickname={handleCheckNickname}
        onCreateEmailSignup={handleCreateEmailSignup}
        onCompleteOAuthNickname={handleOAuthNicknameComplete}
        onCompleteSignup={handleSignupComplete}
        onCompleteGuestPreferences={handleGuestPreferenceComplete}
        onPreviewGuestMeeting={handlePreviewGuestMeeting}
        onJoinGuestMeeting={() => handleJoinMeetingById(guestMeetingId, guestDisplayName)}
      />
    );
  }

  const visibleTab = isGuestSession ? "meeting" : activeTab;

  return (
    <AppScreens
      visibleTab={visibleTab}
      isGuestSession={isGuestSession}
      apiStatus={apiStatus}
      apiError={apiError}
      pickData={pickData}
      historyItems={historyItems}
      selectedCategories={selectedCategories}
      selectedTags={selectedTags}
      selectedAllergies={selectedAllergies}
      categoryScores={categoryScores}
      tagScores={tagScores}
      recentDuplicateDays={recentDuplicateDays}
      newMenuIncluded={newMenuIncluded}
      budgetMin={budgetMin}
      budgetMax={budgetMax}
      recommendationItems={recommendationItems}
      personalRecommendationReady={personalRecommendationReady}
      selectedPersonalRecommendation={selectedPersonalRecommendation}
      meetingItems={meetingItems}
      selectedMeeting={selectedMeeting}
      meetingRecommendations={meetingRecommendations}
      selectedMeetingRecommendation={selectedMeetingRecommendation}
      excludedMeetingUserIds={excludedMeetingUserIds}
      profileName={profileName}
      profileUserId={profileUserId}
      meetingPurposes={meetingPurposes}
      menuOptions={menuOptions}
      meetingDialogOpen={meetingDialogOpen}
      meetingSaving={meetingSaving}
      userOptions={userOptions}
      toastMessage={toastMessage}
      setActiveTab={setActiveTab}
      setSelectedCategories={setSelectedCategories}
      setSelectedTags={setSelectedTags}
      setSelectedAllergies={setSelectedAllergies}
      setCategoryScores={setCategoryScores}
      setTagScores={setTagScores}
      setRecentDuplicateDays={setRecentDuplicateDays}
      setNewMenuIncluded={setNewMenuIncluded}
      setBudgetMin={setBudgetMin}
      setBudgetMax={setBudgetMax}
      setSelectedPersonalRecommendation={setSelectedPersonalRecommendation}
      setMeetingDialogOpen={setMeetingDialogOpen}
      setSelectedMeeting={setSelectedMeeting}
      setSelectedMeetingRecommendation={setSelectedMeetingRecommendation}
      setExcludedMeetingUserIds={setExcludedMeetingUserIds}
      handlePreferenceSave={handlePreferenceSave}
      handleRecommendationRefresh={handleRecommendationRefresh}
      handleHistoryInteractionToggle={handleHistoryInteractionToggle}
      handleConfirmPersonalRecommendation={handleConfirmPersonalRecommendation}
      handleOpenMeeting={handleOpenMeeting}
      handleCreateMeetingRecommendation={handleCreateMeetingRecommendation}
      handleDecideMeetingMenu={handleDecideMeetingMenu}
      handleJoinMeetingById={handleJoinMeetingById}
      handleLogout={handleLogout}
      handleUpdateMeeting={handleUpdateMeeting}
      handleUpdateHistory={handleUpdateHistory}
      handleDeleteHistory={handleDeleteHistory}
      handleCreateMeeting={handleCreateMeeting}
    />
  );
}
