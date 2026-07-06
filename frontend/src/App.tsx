import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiStatus, Flow, Tab } from "./app/app.types";
import { DEV_AUTH_PASSWORD, errorMessage, hasPreferenceRows, persistAccessToken, slugifyNickname } from "./app/appUtils";
import { authApi } from "./api/auth.api";
import { masterDataApi } from "./api/masterData.api";
import { mealHistoryApi } from "./api/mealHistory.api";
import { meetingsApi } from "./api/meetings.api";
import { clearOAuthCallbackUrl, readOAuthCallback, startOAuthLogin, type OAuthProvider } from "./api/oauth.api";
import { preferencesApi } from "./api/preferences.api";
import { recommendationsApi } from "./api/recommendations.api";
import { usersApi } from "./api/users.api";
import { AppHeader } from "./components/navigation/AppHeader";
import { BottomNav } from "./components/navigation/BottomNav";
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
} from "./domain/appModel";
import { AuthFlow } from "./features/auth/AuthFlow";
import { HomeView } from "./features/home/HomeView";
import { HistoryView } from "./features/mealHistory/HistoryView";
import type { MealHistoryFormValue } from "./features/mealHistory/MealHistoryDialog";
import { MeetingCreateDialog, type MeetingFormValue } from "./features/meetings/MeetingCreateDialog";
import { MeetingView } from "./features/meetings/MeetingView";
import { PreferencesView } from "./features/preferences/PreferencesView";
import { PersonalView } from "./features/recommendations/PersonalView";
import { ProfileView } from "./features/user/ProfileView";
import { sessionStorageMeta, tokenStorage } from "./utils/storage";

export function App() {
  const restoreAttemptedRef = useRef(false);
  const [flow, setFlow] = useState<Flow>("start");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [nickname, setNickname] = useState("");
  const [guestDisplayName, setGuestDisplayName] = useState("");
  const [guestMeetingId, setGuestMeetingId] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["korean", "japanese"]);
  const [selectedTags, setSelectedTags] = useState<string[]>(["spicy", "soup"]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(["shrimp"]);
  const [categoryScores, setCategoryScores] = useState<PreferenceScoreMap>({ korean: 5, japanese: 4 });
  const [tagScores, setTagScores] = useState<PreferenceScoreMap>({ spicy: 5, soup: 4 });
  const [newMenuIncluded, setNewMenuIncluded] = useState(true);
  const [recentDuplicateDays, setRecentDuplicateDays] = useState(3);
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
  const [isGuestSession, setIsGuestSession] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 2200);
  }, []);

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
      setHistoryItems(historiesResult.status === "fulfilled" ? mapHistories(historiesResult.value, nextMenus) : []);
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

      if (userResult.status === "fulfilled") {
        const userPayload = userResult.value as any;
        const user = userPayload?.user ?? userPayload;
        setProfileName(readString(user, ["nickname", "name", "email"]) ?? "밥");
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
    async (accessToken: string) => {
      tokenStorage.set(accessToken);
      sessionStorageMeta.set({ isGuest: false });
      setApiStatus("authenticating");
      setAuthError("");
      setApiError("");

      try {
        const userPayload = await usersApi.getMe();
        const user = (userPayload as any)?.user ?? userPayload;
        const currentNickname = readString(user, ["nickname", "name", "email"]) ?? "";
        const preferences = await preferencesApi.getMine();
        const hasPreferences = hasPreferenceRows(preferences);

        setIsGuestSession(false);
        setProfileName(currentNickname || "밥");
        await loadApiData({ syncPreferences: hasPreferences });

        if (hasPreferences) {
          setFlow("app");
          setActiveTab("home");
          showToast("소셜 로그인으로 접속했습니다.");
        } else {
          setNickname("");
          setFlow("signup-name");
          setApiStatus("ready");
          showToast("닉네임과 선호도를 설정해주세요.");
        }
      } catch (error) {
        tokenStorage.clear();
        sessionStorageMeta.clear();
        setApiStatus("error");
        setAuthError(errorMessage(error));
      }
    },
    [loadApiData, showToast]
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
      void completeOAuthLogin(oauthCallback.accessToken);
      return;
    }

    // 새로고침 후에도 저장된 토큰과 세션 메타로 마지막 화면을 복원합니다.
    const token = tokenStorage.get();
    if (!token) return;

    const restoreSession = async () => {
      const meta = sessionStorageMeta.get();
      setApiStatus("authenticating");
      setAuthError("");
      setApiError("");
      try {
        const userPayload = await usersApi.getMe();
        const user = (userPayload as any)?.user ?? userPayload;
        const userType = readString(user, ["userType", "user_type"]) ?? "";
        const isGuest = meta?.isGuest ?? userType === "GUEST";
        const displayName = meta?.displayName ?? readString(user, ["nickname", "name", "email"]) ?? "밥";

        setIsGuestSession(isGuest);
        setProfileName(displayName);
        setFlow(isGuest && !meta?.meetingId ? "guest-join-meeting" : "app");
        setActiveTab(isGuest ? "meeting" : "home");

        await loadApiData();

        if (isGuest && meta?.meetingId) {
          const meeting = mapCreatedMeeting(await meetingsApi.get(meta.meetingId));
          setGuestMeetingId(String(meta.meetingId));
          setGuestDisplayName(displayName);
          setSelectedMeeting(meeting.id ? meeting : null);
          try {
            const latest = await meetingsApi.getLatestRecommendation(meta.meetingId);
            setMeetingRecommendations(mapRecommendations(latest));
          } catch {
            setMeetingRecommendations([]);
          }
        }

        setApiStatus("ready");
      } catch (error) {
        tokenStorage.clear();
        sessionStorageMeta.clear();
        setIsGuestSession(false);
        setSelectedMeeting(null);
        setFlow("start");
        setApiStatus("idle");
        setAuthError(errorMessage(error));
      }
    };

    void restoreSession();
  }, [completeOAuthLogin, loadApiData]);

  const authenticateOnboarding = async (nextNickname: string) => {
    const email = `mukpick-${slugifyNickname(nextNickname)}-${Date.now()}@example.com`;
    const signupResponse = await authApi.signup({
      email,
      password: DEV_AUTH_PASSWORD,
      nickname: nextNickname.trim() || "밥",
      userType: "USER"
    });
    if (signupResponse.accessToken) {
      persistAccessToken(signupResponse);
      return email;
    }
    const loginResponse = await authApi.login({ email, password: DEV_AUTH_PASSWORD });
    persistAccessToken(loginResponse);
    return email;
  };

  const handleOAuthStart = (provider: OAuthProvider) => {
    setAuthBusy(true);
    setAuthError("");
    setApiStatus("authenticating");
    try {
      startOAuthLogin(provider);
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setAuthError(message);
      setApiError(message);
      setAuthBusy(false);
    }
  };

  const handleSignupComplete = async () => {
    setAuthBusy(true);
    setAuthError("");
    setApiStatus("authenticating");
    try {
      if (tokenStorage.get()) {
        await usersApi.updateMe({
          nickname: nickname.trim() || "밥",
          userType: "PERSONAL"
        });
      } else {
        await authenticateOnboarding(nickname);
      }
      sessionStorageMeta.set({ isGuest: false });
      setProfileName(nickname.trim() || "밥");
      setIsGuestSession(false);
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
    includeNewMenu
  }: RecommendationRefreshValue) => {
    setApiStatus("loading");
    setApiError("");
    try {
      const response = await recommendationsApi.createPersonal({
        recentDuplicateDays,
        includeNewMenu,
        limit: 3
      });
      setRecommendationItems(mapRecommendations(response));
      setSelectedPersonalRecommendation(null);
      setPersonalRecommendationReady(true);
      setApiStatus("ready");
      showToast("추천 API를 다시 호출했습니다.");
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

  const handleConfirmPersonalRecommendation = async () => {
    if (!selectedPersonalRecommendation?.menuId) return;
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

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // 서버 토큰이 만료되었거나 이미 삭제된 경우에도 로컬 세션은 반드시 정리합니다.
    }
    // 로그아웃은 서버 응답과 관계없이 브라우저에 남은 세션 정보를 모두 제거합니다.
    tokenStorage.clear();
    sessionStorageMeta.clear();
    setFlow("start");
    setActiveTab("home");
    setIsGuestSession(false);
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

  if (flow !== "app") {
    return (
      <AuthFlow
        flow={flow}
        nickname={nickname}
        selectedCategories={selectedCategories}
        selectedTags={selectedTags}
        selectedAllergies={selectedAllergies}
        categoryScores={categoryScores}
        tagScores={tagScores}
        recentDuplicateDays={recentDuplicateDays}
        onFlowChange={setFlow}
        onNicknameChange={setNickname}
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
        onOAuthStart={handleOAuthStart}
        onCompleteSignup={handleSignupComplete}
        onCompleteGuestPreferences={handleGuestPreferenceComplete}
        onPreviewGuestMeeting={handlePreviewGuestMeeting}
        onJoinGuestMeeting={() => handleJoinMeetingById(guestMeetingId, guestDisplayName)}
      />
    );
  }

  const visibleTab = isGuestSession ? "meeting" : activeTab;

  return (
    <div className="app-shell">
      <main className="phone-frame">
        {!isGuestSession ? <AppHeader activeTab={visibleTab} onGoPreferences={() => setActiveTab("preferences")} /> : null}

        {visibleTab === "home" && (
          <HomeView
            pickData={pickData}
            historiesData={historyItems}
            apiStatus={apiStatus}
            apiError={apiError}
            onGoPersonal={() => setActiveTab("personal")}
            onGoMeeting={() => setActiveTab("meeting")}
            onGoHistory={() => setActiveTab("history")}
          />
        )}

        {visibleTab === "preferences" && (
          <PreferencesView
            selectedCategories={selectedCategories}
            selectedTags={selectedTags}
            selectedAllergies={selectedAllergies}
            categoryScores={categoryScores}
            tagScores={tagScores}
            recentDuplicateDays={recentDuplicateDays}
            pickData={pickData}
            isSaving={apiStatus === "loading"}
            setSelectedCategories={setSelectedCategories}
            setSelectedTags={setSelectedTags}
            setSelectedAllergies={setSelectedAllergies}
            setCategoryScores={setCategoryScores}
            setTagScores={setTagScores}
            setRecentDuplicateDays={setRecentDuplicateDays}
            onSave={handlePreferenceSave}
          />
        )}

        {visibleTab === "personal" && (
          <PersonalView
            newMenuIncluded={newMenuIncluded}
            setNewMenuIncluded={setNewMenuIncluded}
            recentDuplicateDays={recentDuplicateDays}
            setRecentDuplicateDays={setRecentDuplicateDays}
            recommendationsData={recommendationItems}
            hasResults={personalRecommendationReady}
            isLoading={apiStatus === "loading"}
            onRefresh={handleRecommendationRefresh}
            selectedItem={selectedPersonalRecommendation}
            onSelectItem={setSelectedPersonalRecommendation}
            onConfirmSelection={handleConfirmPersonalRecommendation}
          />
        )}

        {visibleTab === "meeting" && (
          <MeetingView
            meetingsData={meetingItems}
            selectedMeeting={selectedMeeting}
            meetingRecommendations={meetingRecommendations}
            selectedRecommendation={selectedMeetingRecommendation}
            excludedUserIds={excludedMeetingUserIds}
            onCreateMeeting={() => setMeetingDialogOpen(true)}
            onOpenMeeting={handleOpenMeeting}
            onCloseMeeting={() => setSelectedMeeting(null)}
            onCreateRecommendation={handleCreateMeetingRecommendation}
            onDecideMenu={handleDecideMeetingMenu}
            onSelectRecommendation={setSelectedMeetingRecommendation}
            onExcludedUserIdsChange={setExcludedMeetingUserIds}
            onJoinMeeting={handleJoinMeetingById}
            onLogout={handleLogout}
            isLoading={apiStatus === "loading"}
            currentUserName={profileName}
            isGuestSession={isGuestSession}
          />
        )}

        {visibleTab === "history" && (
          <HistoryView
            historiesData={historyItems}
          />
        )}

        {visibleTab === "profile" && (
          <ProfileView profileName={profileName} onGoPreferences={() => setActiveTab("preferences")} onLogout={handleLogout} />
        )}

        {!isGuestSession ? <BottomNav visibleTab={visibleTab} onTabChange={setActiveTab} /> : null}

        <MeetingCreateDialog
          open={meetingDialogOpen}
          onClose={() => setMeetingDialogOpen(false)}
          onCreate={handleCreateMeeting}
          isSaving={meetingSaving}
          meetingPurposes={meetingPurposes}
          users={userOptions}
          currentUserName={profileName}
        />

        {toastMessage ? <div className="toast" role="status">{toastMessage}</div> : null}
      </main>
    </div>
  );
}
