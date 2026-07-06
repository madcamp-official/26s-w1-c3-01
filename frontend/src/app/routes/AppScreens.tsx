import { lazy, Suspense } from "react";
import { ApiFeedback } from "../../components/feedback/ApiFeedback";
import { AppHeader } from "../../components/navigation/AppHeader";
import { BottomNav } from "../../components/navigation/BottomNav";
import type {
  DisplayHistory,
  DisplayMeeting,
  DisplayRecommendation,
  MeetingPurpose,
  PickData,
  PreferenceScoreMap,
  RemoteMenu,
  UserOption
} from "../../domain/mapper";
import type { MealHistoryFormValue } from "../../features/mealHistory/MealHistoryDialog";
import type { MeetingFormValue } from "../../features/meetings/MeetingCreateDialog";
import type { ApiStatus, Tab } from "../app.types";

const HomeView = lazy(() => import("../../features/home/HomeView").then((module) => ({ default: module.HomeView })));
const PreferencesView = lazy(() =>
  import("../../features/preferences/PreferencesView").then((module) => ({ default: module.PreferencesView }))
);
const PersonalView = lazy(() =>
  import("../../features/recommendations/PersonalView").then((module) => ({ default: module.PersonalView }))
);
const MeetingView = lazy(() =>
  import("../../features/meetings/MeetingView").then((module) => ({ default: module.MeetingView }))
);
const HistoryView = lazy(() =>
  import("../../features/mealHistory/HistoryView").then((module) => ({ default: module.HistoryView }))
);
const ProfileView = lazy(() => import("../../features/profile/ProfileView").then((module) => ({ default: module.ProfileView })));
const MeetingCreateDialog = lazy(() =>
  import("../../features/meetings/MeetingCreateDialog").then((module) => ({ default: module.MeetingCreateDialog }))
);

type AppScreensProps = {
  visibleTab: Tab;
  isGuestSession: boolean;
  apiStatus: ApiStatus;
  apiError: string;
  pickData: PickData;
  historyItems: DisplayHistory[];
  selectedCategories: string[];
  selectedTags: string[];
  selectedAllergies: string[];
  categoryScores: PreferenceScoreMap;
  tagScores: PreferenceScoreMap;
  recentDuplicateDays: number;
  newMenuIncluded: boolean;
  budgetMin: number | null;
  budgetMax: number | null;
  recommendationItems: DisplayRecommendation[];
  personalRecommendationReady: boolean;
  selectedPersonalRecommendation: DisplayRecommendation | null;
  meetingItems: DisplayMeeting[];
  selectedMeeting: DisplayMeeting | null;
  meetingRecommendations: DisplayRecommendation[];
  selectedMeetingRecommendation: DisplayRecommendation | null;
  excludedMeetingUserIds: number[];
  profileName: string;
  profileUserId: number | null;
  meetingPurposes: MeetingPurpose[];
  menuOptions: RemoteMenu[];
  meetingDialogOpen: boolean;
  meetingSaving: boolean;
  preferenceSaving: boolean;
  personalRecommendationLoading: boolean;
  meetingActionLoading: boolean;
  historySaving: boolean;
  userOptions: UserOption[];
  toastMessage: string;
  setActiveTab: (tab: Tab) => void;
  setSelectedCategories: (value: string[]) => void;
  setSelectedTags: (value: string[]) => void;
  setSelectedAllergies: (value: string[]) => void;
  setCategoryScores: (value: PreferenceScoreMap) => void;
  setTagScores: (value: PreferenceScoreMap) => void;
  setRecentDuplicateDays: (value: number) => void;
  setNewMenuIncluded: (value: boolean) => void;
  setBudgetMin: (value: number | null) => void;
  setBudgetMax: (value: number | null) => void;
  setSelectedPersonalRecommendation: (value: DisplayRecommendation | null) => void;
  setMeetingDialogOpen: (value: boolean) => void;
  setSelectedMeeting: (value: DisplayMeeting | null) => void;
  setSelectedMeetingRecommendation: (value: DisplayRecommendation | null) => void;
  setExcludedMeetingUserIds: (value: number[]) => void;
  handlePreferenceSave: () => Promise<void>;
  handleRecommendationRefresh: (value: {
    recentDuplicateDays: number;
    includeNewMenu: boolean;
    budgetMin: number | null;
    budgetMax: number | null;
  }) => Promise<void>;
  handleHistoryInteractionToggle: (
    item: DisplayHistory,
    interactionType: "like" | "dislike" | "bookmark"
  ) => Promise<void>;
  handleConfirmPersonalRecommendation: () => Promise<void>;
  handleOpenMeeting: (meeting: DisplayMeeting) => Promise<void>;
  handleCreateMeetingRecommendation: (meetingId: number, participantUserIds?: number[]) => Promise<void>;
  handleDecideMeetingMenu: (meetingId: number, item: DisplayRecommendation) => Promise<void>;
  handleJoinMeetingById: (meetingId: string, displayName: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleUpdateMeeting: (meetingId: number, meeting: MeetingFormValue) => Promise<void>;
  handleUpdateHistory: (historyId: number, value: MealHistoryFormValue & { eatenAt?: string }) => Promise<void>;
  handleDeleteHistory: (historyId: number) => Promise<void>;
  handleCreateMeeting: (meeting: MeetingFormValue) => Promise<void>;
};

export function AppScreens({
  visibleTab,
  isGuestSession,
  apiStatus,
  apiError,
  pickData,
  historyItems,
  selectedCategories,
  selectedTags,
  selectedAllergies,
  categoryScores,
  tagScores,
  recentDuplicateDays,
  newMenuIncluded,
  budgetMin,
  budgetMax,
  recommendationItems,
  personalRecommendationReady,
  selectedPersonalRecommendation,
  meetingItems,
  selectedMeeting,
  meetingRecommendations,
  selectedMeetingRecommendation,
  excludedMeetingUserIds,
  profileName,
  profileUserId,
  meetingPurposes,
  menuOptions,
  meetingDialogOpen,
  meetingSaving,
  preferenceSaving,
  personalRecommendationLoading,
  meetingActionLoading,
  historySaving,
  userOptions,
  toastMessage,
  setActiveTab,
  setSelectedCategories,
  setSelectedTags,
  setSelectedAllergies,
  setCategoryScores,
  setTagScores,
  setRecentDuplicateDays,
  setNewMenuIncluded,
  setBudgetMin,
  setBudgetMax,
  setSelectedPersonalRecommendation,
  setMeetingDialogOpen,
  setSelectedMeeting,
  setSelectedMeetingRecommendation,
  setExcludedMeetingUserIds,
  handlePreferenceSave,
  handleRecommendationRefresh,
  handleHistoryInteractionToggle,
  handleConfirmPersonalRecommendation,
  handleOpenMeeting,
  handleCreateMeetingRecommendation,
  handleDecideMeetingMenu,
  handleJoinMeetingById,
  handleLogout,
  handleUpdateMeeting,
  handleUpdateHistory,
  handleDeleteHistory,
  handleCreateMeeting
}: AppScreensProps) {
  return (
    <div className="app-shell min-h-dvh">
      <main className="phone-frame bg-white">
        {!isGuestSession ? <AppHeader activeTab={visibleTab} onGoPreferences={() => setActiveTab("preferences")} /> : null}
        {visibleTab !== "home" ? <ApiFeedback status={apiStatus} error={apiError} compact /> : null}

        <Suspense fallback={<div className="api-feedback compact" role="status">화면을 불러오고 있습니다.</div>}>
          {visibleTab === "home" ? (
            <HomeView
              pickData={pickData}
              historiesData={historyItems}
              apiStatus={apiStatus}
              apiError={apiError}
              onGoPersonal={() => setActiveTab("personal")}
              onGoMeeting={() => setActiveTab("meeting")}
              onGoHistory={() => setActiveTab("history")}
            />
          ) : null}

          {visibleTab === "preferences" ? (
            <PreferencesView
              selectedCategories={selectedCategories}
              selectedTags={selectedTags}
              selectedAllergies={selectedAllergies}
              categoryScores={categoryScores}
              tagScores={tagScores}
              recentDuplicateDays={recentDuplicateDays}
              pickData={pickData}
              isSaving={preferenceSaving}
              setSelectedCategories={setSelectedCategories}
              setSelectedTags={setSelectedTags}
              setSelectedAllergies={setSelectedAllergies}
              setCategoryScores={setCategoryScores}
              setTagScores={setTagScores}
              setRecentDuplicateDays={setRecentDuplicateDays}
              onSave={handlePreferenceSave}
            />
          ) : null}

          {visibleTab === "personal" ? (
            <PersonalView
              newMenuIncluded={newMenuIncluded}
              setNewMenuIncluded={setNewMenuIncluded}
              recentDuplicateDays={recentDuplicateDays}
              setRecentDuplicateDays={setRecentDuplicateDays}
              budgetMin={budgetMin}
              budgetMax={budgetMax}
              setBudgetMin={setBudgetMin}
              setBudgetMax={setBudgetMax}
              recommendationsData={recommendationItems}
              hasResults={personalRecommendationReady}
              isLoading={personalRecommendationLoading}
              onRefresh={handleRecommendationRefresh}
              selectedItem={selectedPersonalRecommendation}
              onSelectItem={setSelectedPersonalRecommendation}
              onConfirmSelection={handleConfirmPersonalRecommendation}
            />
          ) : null}

          {visibleTab === "meeting" ? (
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
              onUpdateMeeting={handleUpdateMeeting}
              isLoading={meetingActionLoading}
              currentUserName={profileName}
              currentUserId={profileUserId}
              meetingPurposes={meetingPurposes}
              isGuestSession={isGuestSession}
            />
          ) : null}

          {visibleTab === "history" ? (
            <HistoryView
              historiesData={historyItems}
              menus={menuOptions}
              isSaving={historySaving}
              onUpdateHistory={handleUpdateHistory}
              onDeleteHistory={handleDeleteHistory}
              onToggleInteraction={handleHistoryInteractionToggle}
            />
          ) : null}

          {visibleTab === "profile" ? (
            <ProfileView profileName={profileName} onGoPreferences={() => setActiveTab("preferences")} onLogout={handleLogout} />
          ) : null}
        </Suspense>

        {!isGuestSession ? <BottomNav visibleTab={visibleTab} onTabChange={setActiveTab} /> : null}

        {meetingDialogOpen ? (
          <Suspense fallback={null}>
            <MeetingCreateDialog
              open={meetingDialogOpen}
              onClose={() => setMeetingDialogOpen(false)}
              onCreate={handleCreateMeeting}
              isSaving={meetingSaving}
              meetingPurposes={meetingPurposes}
              users={userOptions}
              currentUserName={profileName}
            />
          </Suspense>
        ) : null}

        {toastMessage ? <div className="toast" role="status">{toastMessage}</div> : null}
      </main>
    </div>
  );
}
