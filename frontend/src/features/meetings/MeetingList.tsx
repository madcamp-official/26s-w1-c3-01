import { useMemo, useState } from "react";
import Clock from "lucide-react/dist/esm/icons/clock";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Plus from "lucide-react/dist/esm/icons/plus";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Page } from "../../components/layout/Page";
import { PageGrid } from "../../components/layout/PageGrid";
import { PageHeader } from "../../components/layout/PageHeader";
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
  currentUserId: number | null;
  isGuestSession: boolean;
};

type MeetingFilter = "all" | "open" | "done" | "mine";

export function MeetingList({
  meetingsData,
  onCreateMeeting,
  onOpenMeeting,
  onJoinMeeting,
  isLoading,
  currentUserName,
  currentUserId,
  isGuestSession
}: MeetingListProps) {
  const [filter, setFilter] = useState<MeetingFilter>("all");
  const filteredMeetings = useMemo(() => {
    return meetingsData.filter((meeting) => {
      if (filter === "open") return !isMeetingDone(meeting.status);
      if (filter === "done") return isMeetingDone(meeting.status);
      if (filter === "mine") return typeof currentUserId === "number" && meeting.createdBy === currentUserId;
      return true;
    });
  }, [currentUserId, filter, meetingsData]);

  return (
    <Page className="meeting-list-screen">
      <div className="meeting-list-heading">
        <PageHeader title="모임 추천" description="참여자 조건을 모아 모두가 수용하기 쉬운 메뉴를 찾습니다." />
        <button className="create-meeting" onClick={onCreateMeeting}>
          <Plus size={19} />
          새 모임 만들기
        </button>
      </div>

      <PageGrid className="meeting-list-layout">
        <aside className="meeting-join-aside">
          <JoinMeetingPanel
            currentUserName={currentUserName}
            isGuestSession={isGuestSession}
            isLoading={isLoading}
            onJoinMeeting={onJoinMeeting}
          />
        </aside>

        <main className="meeting-list-main">
          <div className="meeting-list-toolbar" role="tablist" aria-label="모임 필터">
            {[
              { id: "all", label: "전체" },
              { id: "open", label: "진행 중" },
              { id: "done", label: "완료" },
              { id: "mine", label: "내가 만든 모임" }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                className={filter === item.id ? "active" : ""}
                aria-selected={filter === item.id}
                onClick={() => setFilter(item.id as MeetingFilter)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filteredMeetings.length ? (
            <div className="meeting-list">
              {filteredMeetings.map((meeting) => (
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
          ) : meetingsData.length ? (
            <EmptyState title="조건에 맞는 모임이 없습니다" description="다른 필터를 선택하거나 새 모임을 만들어 보세요." />
          ) : (
            <EmptyState title="생성된 모임이 없습니다" description="모임 목록 API가 아직 빈 목록을 반환했습니다." />
          )}
        </main>
      </PageGrid>
    </Page>
  );
}
