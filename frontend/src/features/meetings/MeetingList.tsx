import Clock from "lucide-react/dist/esm/icons/clock";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Plus from "lucide-react/dist/esm/icons/plus";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ScreenTitle } from "../../components/navigation/ScreenTitle";
import type { DisplayMeeting } from "../../domain/mapper";
import { JoinMeetingPanel } from "./JoinMeetingPanel";
import { MeetingIdRow } from "./MeetingIdRow";
import { isMeetingDone, statusLabel } from "./meetingStatus";

type MeetingListProps = {
  meetingsData: DisplayMeeting[];
  onCreateMeeting: () => void;
  onOpenMeeting: (meeting: DisplayMeeting) => void;
  onJoinMeeting: (meetingId: string, displayName: string) => Promise<void>;
  isLoading: boolean;
  currentUserName: string;
  isGuestSession: boolean;
};

export function MeetingList({
  meetingsData,
  onCreateMeeting,
  onOpenMeeting,
  onJoinMeeting,
  isLoading,
  currentUserName,
  isGuestSession
}: MeetingListProps) {
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
