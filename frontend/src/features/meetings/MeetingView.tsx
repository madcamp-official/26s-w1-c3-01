import type { DisplayMeeting, DisplayRecommendation } from "../../domain/appModel";
import { MeetingDetail } from "./MeetingDetail";
import { MeetingList } from "./MeetingList";

type MeetingViewProps = {
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
};

export function MeetingView({
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
}: MeetingViewProps) {
  if (selectedMeeting) {
    return (
      <MeetingDetail
        selectedMeeting={selectedMeeting}
        meetingRecommendations={meetingRecommendations}
        selectedRecommendation={selectedRecommendation}
        excludedUserIds={excludedUserIds}
        onCloseMeeting={onCloseMeeting}
        onCreateRecommendation={onCreateRecommendation}
        onDecideMenu={onDecideMenu}
        onSelectRecommendation={onSelectRecommendation}
        onExcludedUserIdsChange={onExcludedUserIdsChange}
        onLogout={onLogout}
        isLoading={isLoading}
        isGuestSession={isGuestSession}
      />
    );
  }

  return (
    <MeetingList
      meetingsData={meetingsData}
      onCreateMeeting={onCreateMeeting}
      onOpenMeeting={onOpenMeeting}
      onJoinMeeting={onJoinMeeting}
      isLoading={isLoading}
      currentUserName={currentUserName}
      isGuestSession={isGuestSession}
    />
  );
}
