import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Home,
  MapPin,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
  Users
} from "lucide-react";
import { logoAssets } from "./assets";
import { authApi } from "./api/auth.api";
import { masterDataApi } from "./api/masterData.api";
import { mealHistoryApi } from "./api/mealHistory.api";
import { meetingsApi } from "./api/meetings.api";
import { clearOAuthCallbackUrl, readOAuthCallback, startOAuthLogin, type OAuthProvider } from "./api/oauth.api";
import { preferencesApi } from "./api/preferences.api";
import { recommendationsApi } from "./api/recommendations.api";
import { usersApi } from "./api/users.api";
import type { PickItem } from "./data";
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
  type DisplayMember,
  type DisplayRecommendation,
  type MeetingPurpose,
  type PickData,
  type PreferenceScoreMap,
  type RecommendationRefreshValue,
  type RemoteMenu,
  type UserOption
} from "./domain/appModel";
import { sessionStorageMeta, tokenStorage } from "./utils/storage";

type Tab = "home" | "preferences" | "personal" | "meeting" | "history" | "profile";
type Flow =
  | "start"
  | "signup-name"
  | "signup-categories"
  | "signup-tags"
  | "signup-allergies"
  | "signup-recent-penalty"
  | "signup-complete"
  | "guest-display-name"
  | "guest-categories"
  | "guest-tags"
  | "guest-allergies"
  | "guest-join-meeting"
  | "app";
type ApiStatus = "idle" | "authenticating" | "loading" | "ready" | "error";
type MealHistoryFormValue = {
  menuId: number;
  rating: number;
  memo: string;
};
type MeetingFormValue = {
  title: string;
  meetingTime: string;
  place: string;
  meetingPurposeId: number;
  participantUserIds: number[];
};

const navItems: Array<{ id: "meeting" | "home" | "profile"; label: string; icon: typeof Home }> = [
  { id: "meeting", label: "모임", icon: Users },
  { id: "home", label: "홈", icon: Home },
  { id: "profile", label: "프로필", icon: UserRound }
];

const DEV_AUTH_PASSWORD = "Mukpick-dev-2026!";

function defaultDateTimeLocal() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(12, 30, 0, 0);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function slugifyNickname(value: string) {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "user";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "API 요청 중 오류가 발생했습니다.";
}

function persistAccessToken(response: { accessToken?: string }) {
  if (!response.accessToken) {
    throw new Error("인증 토큰을 받지 못했습니다. Supabase 이메일 인증 설정을 확인해주세요.");
  }
  tokenStorage.set(response.accessToken);
}

function hasPreferenceRows(preferences: any) {
  return Boolean(
    preferences?.categoryPreferences?.length ||
      preferences?.tagPreferences?.length ||
      preferences?.menuPreferences?.length ||
      preferences?.allergyIds?.length
  );
}

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

        {!isGuestSession ? (
          <nav className="bottom-nav" aria-label="하단 메뉴">
            {navItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={item.id === "home" ? !["meeting", "profile"].includes(visibleTab) : visibleTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </nav>
        ) : null}

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

function AuthFlow({
  flow,
  nickname,
  selectedCategories,
  selectedTags,
  selectedAllergies,
  categoryScores,
  tagScores,
  recentDuplicateDays,
  pickData,
  authBusy,
  authError,
  onFlowChange,
  onNicknameChange,
  onSelectedCategoriesChange,
  onSelectedTagsChange,
  onSelectedAllergiesChange,
  onCategoryScoresChange,
  onTagScoresChange,
  onRecentDuplicateDaysChange,
  guestDisplayName,
  guestMeetingId,
  guestPreviewMeeting,
  onGuestDisplayNameChange,
  onGuestMeetingIdChange,
  onOAuthStart,
  onCompleteSignup,
  onCompleteGuestPreferences,
  onPreviewGuestMeeting,
  onJoinGuestMeeting
}: {
  flow: Flow;
  nickname: string;
  guestDisplayName: string;
  guestMeetingId: string;
  guestPreviewMeeting: DisplayMeeting | null;
  selectedCategories: string[];
  selectedTags: string[];
  selectedAllergies: string[];
  categoryScores: PreferenceScoreMap;
  tagScores: PreferenceScoreMap;
  recentDuplicateDays: number;
  pickData: PickData;
  authBusy: boolean;
  authError: string;
  onFlowChange: (flow: Flow) => void;
  onNicknameChange: (value: string) => void;
  onSelectedCategoriesChange: (value: string[]) => void;
  onSelectedTagsChange: (value: string[]) => void;
  onSelectedAllergiesChange: (value: string[]) => void;
  onCategoryScoresChange: (value: PreferenceScoreMap) => void;
  onTagScoresChange: (value: PreferenceScoreMap) => void;
  onRecentDuplicateDaysChange: (value: number) => void;
  onGuestDisplayNameChange: (value: string) => void;
  onGuestMeetingIdChange: (value: string) => void;
  onOAuthStart: (provider: OAuthProvider) => void;
  onCompleteSignup: () => Promise<void>;
  onCompleteGuestPreferences: () => Promise<void>;
  onPreviewGuestMeeting: () => Promise<void>;
  onJoinGuestMeeting: () => Promise<void>;
}) {
  if (flow === "guest-display-name") {
    return (
      <DisplayNameStep
        displayName={guestDisplayName}
        meetingId={guestMeetingId}
        meeting={guestPreviewMeeting}
        onBack={() => onFlowChange("guest-join-meeting")}
        onChange={onGuestDisplayNameChange}
        onNext={onJoinGuestMeeting}
        isLoading={authBusy}
        errorMessage={authError}
      />
    );
  }

  if (flow === "guest-categories") {
    return (
      <OnboardingPickStep
        step="1/3"
        title="선호하는 카테고리를 설정해주세요"
        description="게스트 추천에 반영할 음식 계열을 골라주세요."
        items={pickData.categories}
        selected={selectedCategories}
        scores={categoryScores}
        onChange={onSelectedCategoriesChange}
        onScoreChange={onCategoryScoresChange}
        onBack={() => onFlowChange("start")}
        onNext={() => onFlowChange("guest-tags")}
      />
    );
  }

  if (flow === "guest-tags") {
    return (
      <OnboardingPickStep
        step="2/3"
        title="선호하는 조리방식을 설정해주세요"
        description="모임 추천에 반영할 취향을 골라주세요."
        items={pickData.tags}
        selected={selectedTags}
        scores={tagScores}
        onChange={onSelectedTagsChange}
        onScoreChange={onTagScoresChange}
        onBack={() => onFlowChange("guest-categories")}
        onNext={() => onFlowChange("guest-allergies")}
      />
    );
  }

  if (flow === "guest-allergies") {
    return (
      <OnboardingPickStep
        step="3/3"
        title="알러지 정보를 알려주세요"
        description="모임 추천에서 제외해야 할 항목을 선택해주세요."
        items={pickData.allergies}
        selected={selectedAllergies}
        onChange={onSelectedAllergiesChange}
        onBack={() => onFlowChange("guest-tags")}
        onNext={onCompleteGuestPreferences}
        nextLabel="완료"
        danger
      />
    );
  }

  if (flow === "guest-join-meeting") {
    return (
      <GuestJoinMeetingScreen
        meetingId={guestMeetingId}
        onMeetingIdChange={onGuestMeetingIdChange}
        onBack={() => onFlowChange("guest-allergies")}
        onNext={onPreviewGuestMeeting}
        isLoading={authBusy}
        errorMessage={authError}
      />
    );
  }

  if (flow === "signup-name") {
    return (
      <NicknameStep
        nickname={nickname}
        onBack={() => onFlowChange("start")}
        onChange={onNicknameChange}
        onNext={() => onFlowChange("signup-categories")}
      />
    );
  }

  if (flow === "signup-categories") {
    return (
      <OnboardingPickStep
        step="1/3"
        title="선호하는 카테고리를 설정해주세요"
        description="좋아하는 음식 계열을 골라주세요."
        items={pickData.categories}
        selected={selectedCategories}
        scores={categoryScores}
        onChange={onSelectedCategoriesChange}
        onScoreChange={onCategoryScoresChange}
        onBack={() => onFlowChange("signup-name")}
        onNext={() => onFlowChange("signup-tags")}
      />
    );
  }

  if (flow === "signup-tags") {
    return (
      <OnboardingPickStep
        step="2/3"
        title="선호하는 조리방식을 설정해주세요"
        description="자주 먹고 싶은 조리 방식을 골라주세요."
        items={pickData.tags}
        selected={selectedTags}
        scores={tagScores}
        onChange={onSelectedTagsChange}
        onScoreChange={onTagScoresChange}
        onBack={() => onFlowChange("signup-categories")}
        onNext={() => onFlowChange("signup-allergies")}
      />
    );
  }

  if (flow === "signup-allergies") {
    return (
      <OnboardingPickStep
        step="3/3"
        title="알러지 정보를 알려주세요"
        description="해당하는 항목을 선택해주세요."
        items={pickData.allergies}
        selected={selectedAllergies}
        onChange={onSelectedAllergiesChange}
        onBack={() => onFlowChange("signup-tags")}
        onNext={() => onFlowChange("signup-recent-penalty")}
        danger
      />
    );
  }

  if (flow === "signup-recent-penalty") {
    return (
      <RecentPenaltyStep
        days={recentDuplicateDays}
        onChange={onRecentDuplicateDaysChange}
        onBack={() => onFlowChange("signup-allergies")}
        onNext={() => onFlowChange("signup-complete")}
      />
    );
  }

  if (flow === "signup-complete") {
    return (
      <SignupCompleteScreen
        nickname={nickname}
        categories={pickData.categories.filter((item) => selectedCategories.includes(item.id)).map((item) => item.label)}
        tags={pickData.tags.filter((item) => selectedTags.includes(item.id)).map((item) => item.label)}
        allergies={pickData.allergies.filter((item) => selectedAllergies.includes(item.id)).map((item) => item.label)}
        onBack={() => onFlowChange("signup-recent-penalty")}
        onReset={() => onFlowChange("signup-categories")}
        onEnterApp={onCompleteSignup}
        isLoading={authBusy}
        errorMessage={authError}
      />
    );
  }

  return (
    <StartScreen
      onOAuthStart={onOAuthStart}
      onGuestStart={() => onFlowChange("guest-categories")}
      isLoading={authBusy}
      errorMessage={authError}
    />
  );
}

function AppHeader({ activeTab, onGoPreferences }: { activeTab: Tab; onGoPreferences: () => void }) {
  if (activeTab === "home") {
    return (
      <header className="app-header home-app-header">
        <div className="brand-row">
          <span />
          <img src={logoAssets.appEn} alt="MUK PICK" className="home-app-logo" />
          <button className="bell-action" aria-label="알림">
            <Bell size={24} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="app-header">
      <img src={logoAssets.appEn} alt="MUK PICK" className="app-logo" />
      <button className="icon-action" aria-label="선호도 빠른 설정" onClick={onGoPreferences}>
        <SlidersHorizontal size={18} />
      </button>
    </header>
  );
}

function AuthHeader({ step, onBack }: { step?: string; onBack?: () => void }) {
  return (
    <header className="auth-header">
      {onBack ? (
        <button className="ghost-icon-button" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
      ) : (
        <span />
      )}
      <img src={logoAssets.appEn} alt="MUK PICK" />
      <strong>{step}</strong>
    </header>
  );
}

function StartScreen({
  onOAuthStart,
  onGuestStart,
  isLoading,
  errorMessage
}: {
  onOAuthStart: (provider: OAuthProvider) => void;
  onGuestStart: () => void;
  isLoading: boolean;
  errorMessage: string;
}) {
  return (
    <main className="start-screen">
      <section className="start-card">
        <img src={logoAssets.startKo} alt="먹픽" className="start-logo" />
        <div className="start-copy">
          <p>오늘 뭐 먹지? 다 먹픽과 결정해요!</p>
        </div>
        <div className="social-panel">
          <div className="social-icon">
            <Sparkles size={18} />
          </div>
          <p>빠른 가입 없이 간편하게 시작하고<br />내가 고른 메뉴를 추천받아보세요.</p>
          <button className="social-button kakao" aria-label="카카오로 시작하기" onClick={() => onOAuthStart("kakao")} disabled={isLoading}>
            <span>K</span>
            카카오로 시작하기
          </button>
          <button className="social-button google" aria-label="Google로 시작하기" onClick={() => onOAuthStart("google")} disabled={isLoading}>
            <span>G</span>
            {isLoading ? "소셜 로그인 연결 중" : "Google로 시작하기"}
          </button>
          {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
        </div>
        <button className="guest-link" aria-label="게스트로 모임 참여하기" onClick={onGuestStart} disabled={isLoading}>
          게스트로 모임 참여하기 <ChevronRight size={14} />
        </button>
      </section>
    </main>
  );
}

function DisplayNameStep({
  displayName,
  meetingId,
  meeting,
  onBack,
  onChange,
  onNext,
  isLoading,
  errorMessage
}: {
  displayName: string;
  meetingId: string;
  meeting: DisplayMeeting | null;
  onBack: () => void;
  onChange: (value: string) => void;
  onNext: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (displayName.trim()) onNext();
  };

  return (
    <main className="auth-screen nickname-screen">
      <section className="auth-card nickname-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="nickname-logo" />
        <div className="guest-meeting-preview">
          <span>모임 ID {meetingId}</span>
          <strong>{meeting?.title ?? "초대받은 모임"}</strong>
          <small>{meeting ? `${meeting.time} · ${meeting.place}` : "모임 정보를 확인했습니다."}</small>
          <div className="member-row">
            {(meeting?.members.length ? meeting.members : [{ userId: null, name: "참여자 확인 중" }]).map((member, index) => (
              <span key={`${member.name}-${index}`}>{member.name}</span>
            ))}
          </div>
        </div>
        <form className="nickname-form" onSubmit={handleSubmit}>
          <label className="text-field">
            <div>
              <UserRound size={18} />
              <input
                value={displayName}
                onChange={(event) => onChange(event.target.value)}
                placeholder="모임에서 보일 이름"
                maxLength={50}
              />
            </div>
            <span>위 구성원과 겹치지 않는 내 표시 이름을 입력해주세요</span>
          </label>
          {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
          <button className="inline-next" type="submit" disabled={isLoading || !displayName.trim()} aria-label="표시 이름 다음">
            <ChevronRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}

function GuestJoinMeetingScreen({
  meetingId,
  onMeetingIdChange,
  onBack,
  onNext,
  isLoading,
  errorMessage
}: {
  meetingId: string;
  onMeetingIdChange: (value: string) => void;
  onBack: () => void;
  onNext: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onNext();
  };

  return (
    <main className="auth-screen nickname-screen">
      <section className="auth-card complete-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="complete-logo" />
        <div className="auth-copy">
          <h1>모임 ID 입력</h1>
          <p>초대받은 모임을 먼저 확인한 뒤 표시 이름을 입력합니다</p>
        </div>
        <form className="dialog-form guest-join-form" onSubmit={handleSubmit}>
          <label className="text-field">
            <span>모임 ID</span>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={meetingId}
              onChange={(event) => onMeetingIdChange(event.target.value)}
              placeholder="예: 12"
              required
            />
          </label>
          {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
          <button className="primary-button" type="submit" disabled={isLoading || !meetingId.trim()}>
            {isLoading ? "모임 확인 중" : "모임 확인하기"}
          </button>
        </form>
      </section>
    </main>
  );
}

function NicknameStep({
  nickname,
  onBack,
  onChange,
  onNext
}: {
  nickname: string;
  onBack: () => void;
  onChange: (value: string) => void;
  onNext: () => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nickname.trim()) {
      onNext();
    }
  };

  return (
    <main className="auth-screen nickname-screen">
      <section className="auth-card nickname-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="nickname-logo" />
        <form className="nickname-form" onSubmit={handleSubmit}>
          <label className="text-field">
            <div>
              <UserRound size={18} />
              <input value={nickname} onChange={(event) => onChange(event.target.value)} placeholder="nickname" />
            </div>
            <span>닉네임을 설정해주세요</span>
          </label>
          <button className="inline-next" type="submit" disabled={!nickname.trim()} aria-label="닉네임 다음">
            <ChevronRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}

function OnboardingPickStep({
  step,
  title,
  description,
  items,
  selected,
  scores,
  onChange,
  onScoreChange,
  onBack,
  onNext,
  nextLabel = "다음",
  danger = false
}: {
  step: string;
  title: string;
  description: string;
  items: PickItem[];
  selected: string[];
  scores?: PreferenceScoreMap;
  onChange: (value: string[]) => void;
  onScoreChange?: (value: PreferenceScoreMap) => void;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  danger?: boolean;
}) {
  return (
    <main className="auth-screen onboarding-screen">
      <section className="auth-card onboarding-card">
        <AuthHeader step={step} onBack={onBack} />
        <div className="auth-copy">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <PickerSection title="" items={items} selected={selected} onChange={onChange} danger={danger} compact />
        {!danger && scores && onScoreChange ? (
          <PreferenceScoreControls items={items} selected={selected} scores={scores} onChange={onScoreChange} compact />
        ) : null}
        <div className="step-actions">
          <button className="primary-button" onClick={onNext}>
            {nextLabel === "완료" ? "선택완료" : "선택완료"}
          </button>
          <button className="skip-link" onClick={onNext}>아직 결정하지 못했어요</button>
        </div>
      </section>
    </main>
  );
}

function RecentPenaltyStep({
  days,
  onChange,
  onBack,
  onNext
}: {
  days: number;
  onChange: (value: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const options = [1, 3, 7, 14];

  return (
    <main className="auth-screen nickname-screen">
      <section className="auth-card complete-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="complete-logo" />
        <div className="auth-copy">
          <h1>{days}일</h1>
          <p>중복 식사에 대한 패널티 기간을 설정해 주세요</p>
        </div>
        <div className="penalty-options" role="radiogroup" aria-label="중복 식사 패널티 기간">
          {options.map((option) => (
            <button
              key={option}
              className={`penalty-chip ${days === option ? "selected" : ""}`}
              onClick={() => onChange(option)}
              aria-pressed={days === option}
            >
              {option}일
            </button>
          ))}
        </div>
        <label className="text-field penalty-input">
          <span>직접 입력</span>
          <input
            type="number"
            min="0"
            max="30"
            value={days}
            onChange={(event) => onChange(Math.max(0, Math.min(30, Number(event.target.value) || 0)))}
          />
        </label>
        <button className="primary-button" onClick={onNext}>
          선택완료
        </button>
      </section>
    </main>
  );
}

function SignupCompleteScreen({
  nickname,
  categories,
  tags,
  allergies,
  onBack,
  onReset,
  onEnterApp,
  isLoading,
  errorMessage
}: {
  nickname: string;
  categories: string[];
  tags: string[];
  allergies: string[];
  onBack: () => void;
  onReset: () => void;
  onEnterApp: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
}) {
  return (
    <main className="auth-screen">
      <section className="auth-card complete-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="complete-logo" />
        <div className="auth-copy">
          <h1>{nickname || "밥"} 님</h1>
          <p>즐거운 식사에 대한 특별한 기준을 설정해 주세요</p>
        </div>
        <div className="preference-summary-list">
          <SummaryLine label="카테고리" values={categories} emptyText="선택 없음" />
          <SummaryLine label="태그" values={tags} emptyText="선택 없음" />
          <SummaryLine label="제한" values={allergies} emptyText="없음" />
        </div>
        {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
        <button className="secondary-button" onClick={onReset} disabled={isLoading}>
          선호도 다시 설정
        </button>
        <button className="primary-button" onClick={onEnterApp} disabled={isLoading}>
          {isLoading ? "API 저장 중" : "먹픽 시작하기"}
        </button>
      </section>
    </main>
  );
}

function SummaryLine({ label, values, emptyText }: { label: string; values: string[]; emptyText: string }) {
  return (
    <div className="summary-line">
      <strong>{label}</strong>
      <span>{values.length ? values.slice(0, 4).join(", ") : emptyText}</span>
    </div>
  );
}

function HomeView({
  pickData,
  historiesData,
  apiStatus,
  apiError,
  onGoPersonal,
  onGoMeeting,
  onGoHistory
}: {
  pickData: PickData;
  historiesData: DisplayHistory[];
  apiStatus: ApiStatus;
  apiError: string;
  onGoPersonal: () => void;
  onGoMeeting: () => void;
  onGoHistory: () => void;
}) {
  const recentMeals = historiesData.slice(0, 3);
  const personalImage = pickData.categories[1]?.image ?? fallbackPickData.categories[1].image;
  const collageImages = [
    pickData.categories[2]?.image ?? fallbackPickData.categories[2].image,
    pickData.tags[6]?.image ?? fallbackPickData.tags[6].image,
    pickData.categories[5]?.image ?? fallbackPickData.categories[5].image
  ];

  return (
    <section className="screen home-screen">
      {apiStatus === "loading" ? <div className="api-banner">백엔드 API에서 데이터를 불러오는 중입니다.</div> : null}
      {apiStatus === "error" && apiError ? <div className="api-banner error">{apiError}</div> : null}

      <div className="home-title">
        <h2>오늘은 뭘 먹어볼까요?</h2>
        <span>취향과 상황에 맞는 메뉴를 쉽고 빠르게 추천받아보세요!</span>
      </div>

      <div className="home-feature-grid">
        <button className="home-choice-card personal-choice" onClick={onGoPersonal}>
          <span className="choice-icon personal-icon"><UserRound size={26} /></span>
          <strong>개인 메뉴 추천</strong>
          <small>내 취향과 상황에 맞는 메뉴를 추천해드려요</small>
          <img src={personalImage} alt="" />
          <span className="round-arrow"><ArrowRight size={24} /></span>
        </button>
        <button className="home-choice-card meeting-choice" onClick={onGoMeeting}>
          <span className="choice-icon meeting-icon"><Users size={27} /></span>
          <strong>모임 생성</strong>
          <small>모임을 만들고 함께 메뉴를 정해보세요</small>
          <div className="choice-collage">
            {collageImages.map((image) => (
              <img src={image} alt="" key={image} />
            ))}
          </div>
          <span className="round-arrow green"><ArrowRight size={24} /></span>
        </button>
      </div>

      <section className="home-panel recent-panel">
        <div className="section-heading">
          <h3><Clock size={19} />최근 식사</h3>
          <button onClick={onGoHistory}>더보기 <ChevronRight size={15} /></button>
        </div>
        {recentMeals.length ? (
          <div className="recent-meal-list">
            {recentMeals.map((meal, index) => (
            <article key={meal.id ?? `${meal.date}-${meal.menu}-${index}`} className="recent-meal-card">
              <img src={meal.image} alt="" />
              <div>
                <strong>{meal.menu}</strong>
                <span>{meal.date} · {meal.memo}</span>
              </div>
            </article>
            ))}
          </div>
        ) : (
          <EmptyState title="최근 식사가 없습니다" description="식사 기록 API가 아직 빈 목록을 반환했습니다." compact />
        )}
      </section>
    </section>
  );
}

function PreferencesView({
  selectedCategories,
  selectedTags,
  selectedAllergies,
  categoryScores,
  tagScores,
  recentDuplicateDays,
  pickData,
  isSaving,
  setSelectedCategories,
  setSelectedTags,
  setSelectedAllergies,
  setCategoryScores,
  setTagScores,
  setRecentDuplicateDays,
  onSave
}: {
  selectedCategories: string[];
  selectedTags: string[];
  selectedAllergies: string[];
  categoryScores: PreferenceScoreMap;
  tagScores: PreferenceScoreMap;
  recentDuplicateDays: number;
  pickData: PickData;
  isSaving: boolean;
  setSelectedCategories: (value: string[]) => void;
  setSelectedTags: (value: string[]) => void;
  setSelectedAllergies: (value: string[]) => void;
  setCategoryScores: (value: PreferenceScoreMap) => void;
  setTagScores: (value: PreferenceScoreMap) => void;
  setRecentDuplicateDays: (value: number) => void;
  onSave: () => Promise<void>;
}) {
  const [step, setStep] = useState<"categories" | "tags" | "allergies" | "penalty" | "confirm">("categories");
  const options = [1, 3, 7, 14];

  const stepMeta = {
    categories: { title: "카테고리 설정", description: "좋아하는 음식 계열을 선택하고 점수를 조정하세요.", index: "1/5" },
    tags: { title: "태그 설정", description: "선호하는 조리 방식과 취향을 선택하세요.", index: "2/5" },
    allergies: { title: "제한 조건", description: "피해야 할 알러지나 재료를 선택하세요.", index: "3/5" },
    penalty: { title: "중복 식사 패널티", description: "최근 며칠 안에 먹은 메뉴를 덜 추천할지 정하세요.", index: "4/5" },
    confirm: { title: "저장 전 확인", description: "선택한 선호도를 확인하고 저장하세요.", index: "5/5" }
  }[step];

  return (
    <section className="screen">
      <div className="step-screen-heading">
        <strong>{stepMeta.index}</strong>
        <ScreenTitle title={stepMeta.title} description={stepMeta.description} />
      </div>
      {step === "categories" ? (
        <>
          <PickerSection title="" items={pickData.categories} selected={selectedCategories} onChange={setSelectedCategories} compact />
          <PreferenceScoreControls items={pickData.categories} selected={selectedCategories} scores={categoryScores} onChange={setCategoryScores} compact />
          <StepNav onNext={() => setStep("tags")} />
        </>
      ) : null}
      {step === "tags" ? (
        <>
          <PickerSection title="" items={pickData.tags} selected={selectedTags} onChange={setSelectedTags} compact />
          <PreferenceScoreControls items={pickData.tags} selected={selectedTags} scores={tagScores} onChange={setTagScores} compact />
          <StepNav onBack={() => setStep("categories")} onNext={() => setStep("allergies")} />
        </>
      ) : null}
      {step === "allergies" ? (
        <>
          <PickerSection title="" items={pickData.allergies} selected={selectedAllergies} onChange={setSelectedAllergies} danger compact />
          <StepNav onBack={() => setStep("tags")} onNext={() => setStep("penalty")} />
        </>
      ) : null}
      {step === "penalty" ? (
        <>
          <section className="section-block penalty-manage-panel">
            <div className="penalty-options" role="radiogroup" aria-label="중복 식사 패널티 기간">
              {options.map((option) => (
                <button
                  key={option}
                  className={`penalty-chip ${recentDuplicateDays === option ? "selected" : ""}`}
                  onClick={() => setRecentDuplicateDays(option)}
                  aria-pressed={recentDuplicateDays === option}
                >
                  {option}일
                </button>
              ))}
            </div>
            <label className="text-field penalty-input">
              <span>직접 입력</span>
              <input
                type="number"
                min="0"
                max="30"
                value={recentDuplicateDays}
                onChange={(event) => setRecentDuplicateDays(Math.max(0, Math.min(30, Number(event.target.value) || 0)))}
              />
            </label>
          </section>
          <StepNav onBack={() => setStep("allergies")} onNext={() => setStep("confirm")} />
        </>
      ) : null}
      {step === "confirm" ? (
        <>
          <div className="preference-summary-list">
            <SummaryLine label="카테고리" values={pickData.categories.filter((item) => selectedCategories.includes(item.id)).map((item) => item.label)} emptyText="선택 없음" />
            <SummaryLine label="태그" values={pickData.tags.filter((item) => selectedTags.includes(item.id)).map((item) => item.label)} emptyText="선택 없음" />
            <SummaryLine label="제한" values={pickData.allergies.filter((item) => selectedAllergies.includes(item.id)).map((item) => item.label)} emptyText="없음" />
            <SummaryLine label="중복" values={[`${recentDuplicateDays}일`]} emptyText="사용 안 함" />
          </div>
          <div className="step-bottom-actions">
            <button className="secondary-button" onClick={() => setStep("penalty")}>이전</button>
            <button className="primary-button" onClick={onSave} disabled={isSaving}>
              <Check size={18} />
              {isSaving ? "API 저장 중" : "선호도 저장"}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function StepNav({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  return (
    <div className="step-bottom-actions">
      {onBack ? <button className="secondary-button" onClick={onBack}>이전</button> : <span />}
      <button className="primary-button" onClick={onNext}>다음</button>
    </div>
  );
}

function PickerSection({
  title,
  items,
  selected,
  onChange,
  danger = false,
  compact = false
}: {
  title: string;
  items: PickItem[];
  selected: string[];
  onChange: (value: string[]) => void;
  danger?: boolean;
  compact?: boolean;
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  return (
    <section className={`picker-section ${compact ? "compact-picker" : ""} ${danger ? "danger-picker" : ""}`}>
      {title ? <h3>{title}</h3> : null}
      <div className="asset-grid">
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <button
              key={item.id}
              className={`asset-card ${isSelected ? "selected" : ""} ${danger ? "danger-card" : ""}`}
              onClick={() => toggle(item.id)}
              aria-pressed={isSelected}
            >
              <span className="check-dot">{isSelected && <Check size={14} />}</span>
              <img src={item.image} alt="" />
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PreferenceScoreControls({
  items,
  selected,
  scores,
  onChange,
  compact = false
}: {
  items: PickItem[];
  selected: string[];
  scores: PreferenceScoreMap;
  onChange: (value: PreferenceScoreMap) => void;
  compact?: boolean;
}) {
  const selectedItems = selected
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is PickItem => Boolean(item));

  if (!selectedItems.length) return null;

  const updateScore = (id: string, value: number) => {
    onChange({ ...scores, [id]: Math.max(-5, Math.min(5, value)) });
  };

  return (
    <section className={`score-section ${compact ? "compact-score-section" : ""}`} aria-label="선호 점수 조정">
      {selectedItems.map((item) => {
        const score = scores[item.id] ?? 5;
        return (
          <div className="score-row" key={item.id}>
            <div>
              <strong>{item.label}</strong>
              <span>{score > 0 ? `+${score}` : score}점</span>
            </div>
            <input
              type="range"
              min="-5"
              max="5"
              step="1"
              value={score}
              aria-label={`${item.label} 선호 점수`}
              onChange={(event) => updateScore(item.id, Number(event.target.value))}
            />
          </div>
        );
      })}
    </section>
  );
}

function PersonalView({
  newMenuIncluded,
  setNewMenuIncluded,
  recentDuplicateDays,
  setRecentDuplicateDays,
  recommendationsData,
  hasResults,
  isLoading,
  onRefresh,
  selectedItem,
  onSelectItem,
  onConfirmSelection
}: {
  newMenuIncluded: boolean;
  setNewMenuIncluded: (value: boolean) => void;
  recentDuplicateDays: number;
  setRecentDuplicateDays: (value: number) => void;
  recommendationsData: DisplayRecommendation[];
  hasResults: boolean;
  isLoading: boolean;
  onRefresh: (value: RecommendationRefreshValue) => Promise<void>;
  selectedItem: DisplayRecommendation | null;
  onSelectItem: (item: DisplayRecommendation) => void;
  onConfirmSelection: () => void;
}) {
  return (
    <section className="screen">
      <ScreenTitle title="개인 메뉴 추천" description="내 선호도, 알러지, 최근 식사 기록으로 랭킹을 만듭니다." />
      <div className="condition-panel">
        <label>
          <span>중복 식사 패널티</span>
          <select value={String(recentDuplicateDays)} onChange={(event) => setRecentDuplicateDays(Number(event.target.value))}>
            <option value="0">사용 안 함</option>
            <option value="1">1일</option>
            <option value="3">3일</option>
            <option value="7">7일</option>
            <option value="14">14일</option>
          </select>
        </label>
        <button
          className={`toggle-row ${newMenuIncluded ? "on" : ""}`}
          onClick={() => setNewMenuIncluded(!newMenuIncluded)}
          aria-pressed={newMenuIncluded}
        >
          <span>새로운 메뉴 포함</span>
          <span className="toggle-knob" />
        </button>
        <button
          className="secondary-button condition-refresh"
          onClick={() =>
            onRefresh({
              recentDuplicateDays,
              includeNewMenu: newMenuIncluded
            })
          }
          disabled={isLoading}
        >
          <Sparkles size={17} />
          {isLoading ? "추천 API 호출 중" : hasResults ? "다시 추천 받기" : "추천 받기"}
        </button>
      </div>
      {hasResults ? (
        <>
          <RecommendationList
            items={recommendationsData}
            emptyMessage="조건에 맞는 추천 결과가 없습니다."
            selectedMenuId={selectedItem?.menuId}
            onSelect={onSelectItem}
          />
          <div className="final-choice-bar">
            <div>
              <span>최종 선택</span>
              <strong>{selectedItem?.menu ?? "추천 메뉴를 하나 선택해 주세요"}</strong>
            </div>
            <button className="primary-button" onClick={onConfirmSelection} disabled={!selectedItem?.menuId || isLoading}>
              {isLoading ? "저장 중" : "선택 확정"}
            </button>
          </div>
        </>
      ) : (
        <EmptyState
          title="추천 조건을 확인해 주세요"
          description="중복 식사 패널티와 새 메뉴 포함 여부를 정한 뒤 추천 받기를 누르면 랭킹을 계산합니다."
        />
      )}
    </section>
  );
}

function MeetingView({
  meetingsData,
  selectedMeeting,
  meetingRecommendations,
  selectedRecommendation,
  excludedUserIds,
  onCreateMeeting,
  onOpenMeeting,
  onCloseMeeting,
  onCreateRecommendation,
  onDecideMenu,
  onSelectRecommendation,
  onExcludedUserIdsChange,
  onJoinMeeting,
  onLogout,
  isLoading,
  currentUserName,
  isGuestSession
}: {
  meetingsData: DisplayMeeting[];
  selectedMeeting: DisplayMeeting | null;
  meetingRecommendations: DisplayRecommendation[];
  selectedRecommendation: DisplayRecommendation | null;
  excludedUserIds: number[];
  onCreateMeeting: () => void;
  onOpenMeeting: (meeting: DisplayMeeting) => void;
  onCloseMeeting: () => void;
  onCreateRecommendation: (meetingId: number, participantUserIds?: number[]) => void;
  onDecideMenu: (meetingId: number, item: DisplayRecommendation) => void;
  onSelectRecommendation: (item: DisplayRecommendation) => void;
  onExcludedUserIdsChange: (userIds: number[]) => void;
  onJoinMeeting: (meetingId: string, displayName: string) => Promise<void>;
  onLogout: () => Promise<void>;
  isLoading: boolean;
  currentUserName: string;
  isGuestSession: boolean;
}) {
  if (selectedMeeting) {
    const isDecided = selectedMeeting.status === "DECIDED" || selectedMeeting.status === "CLOSED";
    const includedUserIds = selectedMeeting.members
      .map((member) => member.userId)
      .filter((userId): userId is number => typeof userId === "number" && !excludedUserIds.includes(userId));
    const toggleMember = (member: DisplayMember) => {
      if (isDecided || typeof member.userId !== "number") return;
      onExcludedUserIdsChange(
        excludedUserIds.includes(member.userId)
          ? excludedUserIds.filter((userId) => userId !== member.userId)
          : [...excludedUserIds, member.userId]
      );
    };
    return (
      <section className={`screen meeting-detail-screen ${isGuestSession ? "guest-meeting-detail" : ""}`}>
        {!isGuestSession ? (
          <button className="back-row-button" onClick={onCloseMeeting}>
            <ArrowLeft size={17} />
            모임 목록
          </button>
        ) : (
          <button className="back-row-button" onClick={onLogout}>
            <ArrowLeft size={17} />
            나가기
          </button>
        )}
        <ScreenTitle title={selectedMeeting.title} description="참여자 정보와 이 모임의 추천 결과를 확인합니다." />
        <section className="section-block meeting-detail-card">
          <div className="meeting-topline">
            <strong>{statusLabel(selectedMeeting.status)}</strong>
            <span>{isDecided ? "완료된 모임" : "진행 중"}</span>
          </div>
          {selectedMeeting.id ? <MeetingIdRow meetingId={selectedMeeting.id} /> : null}
          <div className="meeting-meta">
            <span><Clock size={15} />{selectedMeeting.time}</span>
            <span><MapPin size={15} />{selectedMeeting.place}</span>
          </div>
          <div className="member-row selectable-members" aria-label="추천 계산에 포함할 구성원">
            {selectedMeeting.members.map((member) => (
              <button
                type="button"
                key={`${member.userId ?? "member"}-${member.name}`}
                className={typeof member.userId === "number" && excludedUserIds.includes(member.userId) ? "excluded" : ""}
                onClick={() => toggleMember(member)}
                disabled={isDecided || typeof member.userId !== "number"}
                aria-pressed={typeof member.userId === "number" && !excludedUserIds.includes(member.userId)}
              >
                {member.name}
              </button>
            ))}
          </div>
        </section>
        <section className="section-block group-result">
          <div className="section-heading">
            <h3>이 모임의 추천 메뉴</h3>
            {selectedMeeting.id && !isDecided ? (
              <button
                onClick={() => onCreateRecommendation(selectedMeeting.id!, includedUserIds)}
                disabled={isLoading || includedUserIds.length === 0}
              >
                {meetingRecommendations.length ? "다시 계산" : "추천 계산"}
              </button>
            ) : null}
          </div>
          <div className="meeting-recommendation-scroll">
            <RecommendationList
              compact
              items={meetingRecommendations}
              emptyMessage="아직 이 모임의 추천 결과가 없습니다."
              selectedMenuId={selectedRecommendation?.menuId}
              onSelect={isDecided || isGuestSession ? undefined : onSelectRecommendation}
            />
          </div>
          {meetingRecommendations.length && !isGuestSession ? (
            <div className="final-choice-bar">
              <div>
                <span>최종 선택</span>
                <strong>{selectedRecommendation?.menu ?? "추천 메뉴를 하나 선택해 주세요"}</strong>
              </div>
              <button
                className="primary-button"
                onClick={() => selectedMeeting.id && selectedRecommendation && onDecideMenu(selectedMeeting.id, selectedRecommendation)}
                disabled={isDecided || !selectedRecommendation?.menuId || isLoading}
              >
                {isLoading ? "저장 중" : "선택 확정"}
              </button>
            </div>
          ) : null}
          {meetingRecommendations.length && isGuestSession ? (
            <div className="guest-confirm-note">게스트는 추천 결과 확인만 가능하며 메뉴 확정은 모임 생성자가 진행합니다.</div>
          ) : null}
        </section>
      </section>
    );
  }

  return (
    <section className="screen">
      <ScreenTitle title="모임 추천" description="참여자 조건을 모아 모두가 수용하기 쉬운 메뉴를 찾습니다." />
      <button className="create-meeting" onClick={onCreateMeeting}>
        <Plus size={19} />
        새 모임 만들기
      </button>
      <JoinMeetingPanel
        currentUserName={currentUserName}
        isGuestSession={isGuestSession}
        isLoading={isLoading}
        onJoinMeeting={onJoinMeeting}
      />
      {meetingsData.length ? (
        <div className="meeting-list">
          {meetingsData.map((meeting) => (
          <button
            className={`meeting-card meeting-card-button ${isMeetingDone(meeting.status) ? "done" : ""}`}
            key={meeting.id ?? meeting.title}
            onClick={() => onOpenMeeting(meeting)}
          >
            <div className="meeting-topline">
              <strong>{meeting.title}</strong>
              <span>{statusLabel(meeting.status)}</span>
            </div>
            {meeting.id ? <MeetingIdRow meetingId={meeting.id} compact /> : null}
            <div className="meeting-meta">
              <span>
                <Clock size={15} />
                {meeting.time}
              </span>
              <span>
                <MapPin size={15} />
                {meeting.place}
              </span>
            </div>
            <div className="member-row">
              {meeting.members.map((member) => (
                <span key={`${member.userId ?? "member"}-${member.name}`}>{member.name}</span>
              ))}
            </div>
          </button>
          ))}
        </div>
      ) : (
        <EmptyState title="생성된 모임이 없습니다" description="모임 목록 API가 아직 빈 목록을 반환했습니다." />
      )}
    </section>
  );
}

function MeetingIdRow({ meetingId, compact = false }: { meetingId: number; compact?: boolean }) {
  const copyMeetingId = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void navigator.clipboard?.writeText(String(meetingId));
  };

  return (
    <div className={`meeting-id-row ${compact ? "compact" : ""}`}>
      <span>모임 ID {meetingId}</span>
      <button type="button" onClick={copyMeetingId}>복사</button>
    </div>
  );
}

function JoinMeetingPanel({
  currentUserName,
  isGuestSession,
  isLoading,
  onJoinMeeting
}: {
  currentUserName: string;
  isGuestSession: boolean;
  isLoading: boolean;
  onJoinMeeting: (meetingId: string, displayName: string) => Promise<void>;
}) {
  const [meetingId, setMeetingId] = useState("");
  const [displayName, setDisplayName] = useState(currentUserName);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onJoinMeeting(meetingId, displayName || currentUserName);
  };

  return (
    <form className="join-meeting-panel" onSubmit={handleSubmit}>
      <div>
        <strong>모임 ID로 참여</strong>
        <span>{isGuestSession ? "게스트 표시 이름으로 참여합니다." : "초대받은 ID를 입력하면 목록에 추가됩니다."}</span>
      </div>
      <label className="text-field">
        <span>모임 ID</span>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={meetingId}
          onChange={(event) => setMeetingId(event.target.value)}
          placeholder="예: 12"
        />
      </label>
      <label className="text-field">
        <span>표시 이름</span>
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={50} />
      </label>
      <button className="secondary-button" type="submit" disabled={isLoading || !meetingId.trim() || !displayName.trim()}>
        참여하기
      </button>
    </form>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    CREATED: "생성됨",
    COLLECTING: "참여자 입력 중",
    RECOMMENDED: "추천 완료",
    DECIDED: "메뉴 확정",
    CLOSED: "종료"
  };
  return labels[status] ?? status;
}

function isMeetingDone(status: string) {
  return status === "DECIDED" || status === "CLOSED";
}

function MeetingCreateDialog({
  open,
  onClose,
  onCreate,
  isSaving,
  meetingPurposes,
  users,
  currentUserName
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (meeting: MeetingFormValue) => Promise<void>;
  isSaving: boolean;
  meetingPurposes: MeetingPurpose[];
  users: UserOption[];
  currentUserName: string;
}) {
  const [title, setTitle] = useState("새 점심 모임");
  const [meetingTime, setMeetingTime] = useState(defaultDateTimeLocal());
  const [place, setPlace] = useState("대전 유성구");
  const [purposeId, setPurposeId] = useState("");
  const [participantUserIds, setParticipantUserIds] = useState<number[]>([]);

  if (!open) {
    return null;
  }

  const purposeOptions = meetingPurposes.length ? meetingPurposes : [{ id: 1, name: "식사" }];
  const selectedPurposeId = Number(purposeId || purposeOptions[0]?.id || 1);
  const toggleParticipant = (userId: number) => {
    setParticipantUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreate({
      title: title.trim() || "새 모임",
      meetingTime,
      place: place.trim() || "장소 미정",
      meetingPurposeId: selectedPurposeId,
      participantUserIds
    });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="meeting-dialog" role="dialog" aria-modal="true" aria-labelledby="meeting-dialog-title">
        <div className="dialog-heading">
          <div>
            <p>MEETING</p>
            <h2 id="meeting-dialog-title">새 모임 만들기</h2>
          </div>
          <button className="ghost-icon-button" aria-label="모임 만들기 닫기" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="dialog-form" onSubmit={handleSubmit}>
          <label className="text-field">
            <span>모임 이름</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="text-field">
            <span>시간</span>
            <input type="datetime-local" value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)} required />
          </label>
          <label className="text-field">
            <span>모임 목적</span>
            <select value={String(selectedPurposeId)} onChange={(event) => setPurposeId(event.target.value)}>
              {purposeOptions.map((purpose) => (
                <option key={purpose.id} value={String(purpose.id)}>
                  {purpose.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-field">
            <span>장소</span>
            <input value={place} onChange={(event) => setPlace(event.target.value)} />
          </label>
          <section className="participant-picker" aria-label="참여자 선택">
            <div className="participant-picker-heading">
              <span>참여자</span>
              <small>나: {currentUserName}</small>
            </div>
            <div className="participant-options">
              {users.length ? (
                users.map((user) => (
                  <button
                    type="button"
                    key={user.userId}
                    className={`participant-option ${participantUserIds.includes(user.userId) ? "selected" : ""}`}
                    onClick={() => toggleParticipant(user.userId)}
                    aria-pressed={participantUserIds.includes(user.userId)}
                  >
                    <UserRound size={15} />
                    <span>{user.nickname}</span>
                  </button>
                ))
              ) : (
                <small className="participant-empty">사용자 목록 API에 표시할 계정이 없습니다.</small>
              )}
            </div>
          </section>
          <button className="primary-button" type="submit" disabled={isSaving}>
            <Plus size={18} />
            {isSaving ? "API 저장 중" : "모임 추가"}
          </button>
        </form>
      </section>
    </div>
  );
}

function MealHistoryDialog({
  open,
  menus,
  onClose,
  onCreate,
  isSaving
}: {
  open: boolean;
  menus: RemoteMenu[];
  onClose: () => void;
  onCreate: (value: MealHistoryFormValue) => void;
  isSaving: boolean;
}) {
  const [menuId, setMenuId] = useState("");
  const [rating, setRating] = useState("4");
  const [memo, setMemo] = useState("");

  if (!open) return null;

  const selectedMenuId = Number(menuId || menus[0]?.menuId || 0);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMenuId) return;
    onCreate({ menuId: selectedMenuId, rating: Number(rating), memo });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="meeting-dialog" role="dialog" aria-modal="true" aria-labelledby="history-dialog-title">
        <div className="dialog-heading">
          <div>
            <p>HISTORY</p>
            <h2 id="history-dialog-title">식사 기록 추가</h2>
          </div>
          <button className="ghost-icon-button" aria-label="식사 기록 닫기" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="dialog-form" onSubmit={handleSubmit}>
          <label className="text-field">
            <span>먹은 메뉴</span>
            <select value={String(selectedMenuId)} onChange={(event) => setMenuId(event.target.value)} required>
              {menus.map((menu) => (
                <option key={menu.menuId} value={String(menu.menuId)}>
                  {menu.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-field">
            <span>만족도</span>
            <select value={rating} onChange={(event) => setRating(event.target.value)}>
              <option value="5">5점</option>
              <option value="4">4점</option>
              <option value="3">3점</option>
              <option value="2">2점</option>
              <option value="1">1점</option>
            </select>
          </label>
          <label className="text-field">
            <span>메모</span>
            <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="예: 점심으로 먹음" />
          </label>
          <button className="primary-button" type="submit" disabled={isSaving || !menus.length}>
            <Plus size={18} />
            {isSaving ? "API 저장 중" : "기록 저장"}
          </button>
        </form>
      </section>
    </div>
  );
}

function HistoryView({
  historiesData
}: {
  historiesData: DisplayHistory[];
}) {
  return (
    <section className="screen">
      <ScreenTitle title="식사 기록" description="선택한 메뉴는 이후 추천에서 반복을 줄이는 데 사용됩니다." />
      {historiesData.length ? (
        <div className="history-timeline">
          {historiesData.map((history, index) => {
          const historyKey = String(history.id ?? `${history.date}-${history.menu}-${index}`);
          return (
            <article className="history-row" key={historyKey}>
              <time>{history.date}</time>
              <div>
                <strong>{history.menu}</strong>
                <span>{history.memo}</span>
              </div>
            </article>
          );
          })}
        </div>
      ) : (
        <EmptyState title="식사 기록이 없습니다" description="식사 기록 API가 아직 빈 목록을 반환했습니다." />
      )}
    </section>
  );
}

function ProfileView({
  profileName,
  onGoPreferences,
  onLogout
}: {
  profileName: string;
  onGoPreferences: () => void;
  onLogout: () => Promise<void>;
}) {
  return (
    <section className="screen">
      <ScreenTitle title="프로필" description="먹픽에서 사용할 기본 정보와 선호도를 관리합니다." />
      <section className="section-block profile-card">
        <div className="profile-avatar">
          <UserRound size={32} />
        </div>
        <strong>{profileName} 님</strong>
        <p>개인 추천과 모임 추천에 사용할 취향 정보가 저장되어 있습니다.</p>
        <button className="primary-button" onClick={onGoPreferences}>
          <SlidersHorizontal size={18} />
          선호도 관리
        </button>
        <button className="secondary-button danger-button" onClick={onLogout}>
          로그아웃
        </button>
      </section>
    </section>
  );
}

function RecommendationList({
  compact = false,
  items,
  emptyMessage,
  actionLabel,
  onAction,
  selectedMenuId,
  onSelect
}: {
  compact?: boolean;
  items: DisplayRecommendation[];
  emptyMessage: string;
  actionLabel?: string;
  onAction?: (item: DisplayRecommendation) => void;
  selectedMenuId?: number;
  onSelect?: (item: DisplayRecommendation) => void;
}) {
  if (!items.length) {
    return <EmptyState title="추천 결과가 없습니다" description={emptyMessage} compact={compact} />;
  }

  return (
    <div className={`recommendation-list ${compact ? "compact" : ""}`}>
      {items.map((item) => {
        const isSelected = typeof item.menuId === "number" && item.menuId === selectedMenuId;
        return (
        <article
          className={`recommendation-card ${isSelected ? "selected" : ""} ${onSelect ? "selectable" : ""}`}
          key={`${item.rank}-${item.menu}`}
          onClick={() => onSelect?.(item)}
        >
          <div className="rank-mark">{item.rank}</div>
          <div className="recommendation-body">
            <div className="recommendation-title">
              <strong>{item.menu}</strong>
              <span>{item.score}점</span>
            </div>
            <p>{item.reason}</p>
            <div className="tag-row">
              <span>{item.category}</span>
              {actionLabel && onAction ? (
                <button onClick={(event) => {
                  event.stopPropagation();
                  onAction(item);
                }} disabled={!item.menuId}>{actionLabel}</button>
              ) : null}
            </div>
          </div>
        </article>
        );
      })}
    </div>
  );
}

function EmptyState({
  title,
  description,
  compact = false
}: {
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div className={`empty-state ${compact ? "compact" : ""}`}>
      <ShieldAlert size={compact ? 16 : 22} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function ScreenTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="screen-title">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick
}: {
  item: { id: Tab; label: string; icon: typeof Home };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>
      <Icon size={19} />
      <span>{item.label}</span>
    </button>
  );
}
