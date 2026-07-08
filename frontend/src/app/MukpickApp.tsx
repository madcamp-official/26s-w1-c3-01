import { useCallback, useEffect, useState } from "react";
import type { ApiStatus, Tab } from "./app.types";
import { LoadingOverlay, preloadLoadingGif } from "../components/feedback/LoadingOverlay";
import { AuthFlow } from "../features/auth/AuthFlow";
import { useAuthActions } from "../features/auth/useAuthActions";
import { useAuthFlowState } from "../features/auth/useAuthFlowState";
import { useAuthProfile } from "../features/auth/useAuthProfile";
import { useSessionRestore } from "../features/auth/useSessionRestore";
import { useMealHistoryActions } from "../features/mealHistory/useMealHistoryActions";
import { useMealHistories } from "../features/mealHistory/useMealHistories";
import { useMeetingActions } from "../features/meetings/useMeetingActions";
import { useMeetingSessionSync } from "../features/meetings/useMeetingSessionSync";
import { useMeetings } from "../features/meetings/useMeetings";
import { useSelectedMeetingPolling } from "../features/meetings/useSelectedMeetingPolling";
import { usePreferenceSaveAction } from "../features/preferences/usePreferenceSaveAction";
import { usePreferenceSettings } from "../features/preferences/usePreferenceSettings";
import { usePersonalRecommendationActions } from "../features/recommendations/usePersonalRecommendationActions";
import { usePersonalRecommendations } from "../features/recommendations/usePersonalRecommendations";
import { useInitialApiData } from "./model/useInitialApiData";
import { useAppReset } from "./model/useAppReset";
import { useMasterData } from "./model/useMasterData";
import { useRouteStateRestore } from "./model/useRouteStateRestore";
import { useToast } from "./model/useToast";
import { AppScreens } from "./routes/AppScreens";
import { useAppUrlSync } from "./useAppUrlSync";

export function MukpickApp() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const {
    restoreAttemptedRef,
    flow,
    setFlow,
    nickname,
    setNickname,
    signupCredentials,
    setSignupCredentials,
    loginCredentials,
    setLoginCredentials,
    guestDisplayName,
    setGuestDisplayName,
    guestMeetingId,
    setGuestMeetingId,
    authBusy,
    setAuthBusy,
    authError,
    setAuthError
  } = useAuthFlowState();
  const {
    selectedCategories,
    setSelectedCategories,
    selectedTags,
    setSelectedTags,
    selectedAllergies,
    setSelectedAllergies,
    categoryScores,
    setCategoryScores,
    tagScores,
    setTagScores,
    newMenuIncluded,
    setNewMenuIncluded,
    recentDuplicateDays,
    setRecentDuplicateDays,
    budgetMin,
    setBudgetMin,
    budgetMax,
    setBudgetMax,
    applyPreferences,
    applyUserPreferences,
    resetPreferenceSelections,
    buildCurrentPreferencePayload
  } = usePreferenceSettings();
  const {
    pickData,
    menuOptions,
    meetingPurposes,
    loadMasterDataOnly
  } = useMasterData();
  const {
    recommendationItems,
    personalRecommendationReady,
    selectedPersonalRecommendation,
    setSelectedPersonalRecommendation,
    personalRecommendationLoading,
    setPersonalRecommendationLoading,
    applyPersonalRecommendations,
    restorePersonalRecommendations,
    clearPersonalRecommendations
  } = usePersonalRecommendations();
  const {
    meetingItems,
    replaceMeetings,
    selectedMeeting,
    setSelectedMeeting,
    guestPreviewMeeting,
    meetingRecommendations,
    selectedMeetingRecommendation,
    setSelectedMeetingRecommendation,
    excludedMeetingUserIds,
    setExcludedMeetingUserIds,
    meetingDialogOpen,
    setMeetingDialogOpen,
    meetingSaving,
    setMeetingSaving,
    meetingActionLoading,
    setMeetingActionLoading,
    clearMeetingRecommendations,
    clearActiveMeetingState,
    resetMeetingState,
    applySelectedMeetingPayload,
    restoreMeetingDetail,
    openMeeting,
    previewGuestMeeting,
    syncSelectedMeetingDetail,
    applyMeetingRecommendationPayload,
    applyDecidedMeetingPayload
  } = useMeetings();
  const {
    historyItems,
    setHistoriesFromPayload,
    reloadHistories,
    mapHistoryFromPayload,
    upsertHistory,
    clearHistories,
    replaceHistories,
    removeHistoryById,
    updateHistoryInteractionState
  } = useMealHistories(menuOptions);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [apiError, setApiError] = useState("");
  const [preferenceSaving, setPreferenceSaving] = useState(false);
  const [historySaving, setHistorySaving] = useState(false);
  const { toastMessage, showToast, clearToast } = useToast();
  const {
    profileName,
    setProfileName,
    profileUserId,
    setProfileUserId,
    isGuestSession,
    setIsGuestSession,
    isOAuthOnboarding,
    setIsOAuthOnboarding,
    applyUserPayload,
    resetAuthProfile
  } = useAuthProfile();

  const { applyRouteState } = useRouteStateRestore({
    setActiveTab,
    clearActiveMeetingState,
    restoreMeetingDetail,
    restorePersonalRecommendations,
    setApiError
  });

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

  const { syncSelectedMeeting } = useMeetingSessionSync({
    isGuestSession,
    selectedMeetingId: selectedMeeting?.id,
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
  });

  const { loadInitialApiData } = useInitialApiData({
    loadMasterDataOnly,
    applyPreferences,
    applyUserPreferences,
    applyUserPayload,
    replaceMeetings,
    setHistoriesFromPayload,
    clearHistories,
    setApiStatus,
    setApiError
  });

  useSessionRestore({
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
  });

  const { handleLogout } = useAppReset({
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
  });

  const {
    handleLogin,
    handleCheckNickname,
    handleCreateEmailSignup,
    handleResendSignupEmail,
    handleOAuthStart,
    handleOAuthNicknameComplete,
    handleSignupComplete,
    handleGuestPreferenceComplete
  } = useAuthActions({
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
    setNickname,
    setProfileName,
    setIsGuestSession,
    setIsOAuthOnboarding,
    showToast
  });

  const { handlePreferenceSave } = usePreferenceSaveAction({
    pickData,
    buildCurrentPreferencePayload,
    setPreferenceSaving,
    setApiStatus,
    setApiError,
    setActiveTab,
    showToast
  });

  const {
    handleHistoryInteractionToggle,
    handleCreateHistory,
    handleUpdateHistory,
    handleDeleteHistory
  } = useMealHistoryActions({
    historyItems,
    mapHistoryFromPayload,
    upsertHistory,
    reloadHistories,
    removeHistoryById,
    replaceHistories,
    updateHistoryInteractionState,
    setHistorySaving,
    setApiStatus,
    setApiError,
    showToast
  });

  const { handleRecommendationRefresh, handleConfirmPersonalRecommendation } = usePersonalRecommendationActions({
    selectedPersonalRecommendation,
    applyPersonalRecommendations,
    setPersonalRecommendationLoading,
    setApiStatus,
    setApiError,
    setActiveTab,
    showToast,
    createHistory: handleCreateHistory
  });

  const {
    handleJoinMeetingById,
    handlePreviewGuestMeeting,
    handleOpenMeeting,
    handleCreateMeetingRecommendation,
    handleDecideMeetingMenu,
    handleCreateMeeting,
    handleUpdateMeeting
  } = useMeetingActions({
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
  });

  useSelectedMeetingPolling({
    flow,
    activeTab,
    selectedMeetingId: selectedMeeting?.id,
    syncSelectedMeeting
  });

  useEffect(() => {
    preloadLoadingGif();
  }, []);

  const globalLoading =
    authBusy ||
    apiStatus === "loading" ||
    apiStatus === "authenticating" ||
    meetingSaving ||
    preferenceSaving ||
    personalRecommendationLoading ||
    historySaving ||
    meetingActionLoading;
  const budgetLevel = budgetMin !== null && budgetMin === budgetMax ? budgetMin : null;
  const setBudgetLevel = (value: number | null) => {
    setBudgetMin(value);
    setBudgetMax(value);
  };
  const handleAuthFlowChange = useCallback(
    (nextFlow: typeof flow) => {
      if (flow === "start" && (nextFlow === "signup-name" || nextFlow === "guest-categories")) {
        resetPreferenceSelections();
      }
      setFlow(nextFlow);
    },
    [flow, resetPreferenceSelections, setFlow]
  );

  if (flow !== "app") {
    return (
      <>
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
          onFlowChange={handleAuthFlowChange}
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
          onResendSignupEmail={handleResendSignupEmail}
          onCompleteOAuthNickname={handleOAuthNicknameComplete}
          onCompleteSignup={handleSignupComplete}
          onCompleteGuestPreferences={handleGuestPreferenceComplete}
          onPreviewGuestMeeting={handlePreviewGuestMeeting}
          onJoinGuestMeeting={() => handleJoinMeetingById(guestMeetingId, guestDisplayName)}
        />
        <LoadingOverlay active={globalLoading} />
      </>
    );
  }

  const visibleTab = isGuestSession ? "meeting" : activeTab;

  return (
    <>
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
        budgetLevel={budgetLevel}
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
        preferenceSaving={preferenceSaving}
        personalRecommendationLoading={personalRecommendationLoading}
        personalSelectionSaving={historySaving}
        meetingActionLoading={meetingActionLoading || meetingSaving}
        historySaving={historySaving}
        toastMessage={toastMessage}
        setActiveTab={setActiveTab}
        setSelectedCategories={setSelectedCategories}
        setSelectedTags={setSelectedTags}
        setSelectedAllergies={setSelectedAllergies}
        setCategoryScores={setCategoryScores}
        setTagScores={setTagScores}
        setRecentDuplicateDays={setRecentDuplicateDays}
        setNewMenuIncluded={setNewMenuIncluded}
        setBudgetLevel={setBudgetLevel}
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
      <LoadingOverlay active={globalLoading} />
    </>
  );
}
