import type { DisplayMeeting, DisplayRecommendation, MeetingPurpose } from "../../domain/mapper";
import type { MeetingFormValue } from "./MeetingCreateDialog";
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
  onUpdateMeeting: (meetingId: number, meeting: MeetingFormValue) => Promise<void>;
  isLoading: boolean;
  currentUserName: string;
  currentUserId: number | null;
  meetingPurposes: MeetingPurpose[];
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
  onUpdateMeeting,
  isLoading,
  currentUserName,
  currentUserId,
  meetingPurposes,
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
        onUpdateMeeting={onUpdateMeeting}
        isLoading={isLoading}
        currentUserId={currentUserId}
        meetingPurposes={meetingPurposes}
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
