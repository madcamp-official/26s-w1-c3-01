import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { ScreenTitle } from "../../components/navigation/ScreenTitle";
import type { DisplayMeeting, DisplayMember, DisplayRecommendation } from "../../domain/appModel";
import { RecommendationList } from "../recommendations/RecommendationList";
import { MeetingIdRow } from "./MeetingIdRow";
import { statusLabel } from "./meetingStatus";

type MeetingDetailProps = {
  selectedMeeting: DisplayMeeting;
  meetingRecommendations: DisplayRecommendation[];
  selectedRecommendation: DisplayRecommendation | null;
  excludedUserIds: number[];
  onCloseMeeting: () => void;
  onCreateRecommendation: (meetingId: number, participantUserIds?: number[]) => void;
  onDecideMenu: (meetingId: number, item: DisplayRecommendation) => void;
  onSelectRecommendation: (item: DisplayRecommendation) => void;
  onExcludedUserIdsChange: (userIds: number[]) => void;
  onLogout: () => Promise<void>;
  isLoading: boolean;
  isGuestSession: boolean;
};

export function MeetingDetail({
  selectedMeeting,
  meetingRecommendations,
  selectedRecommendation,
  excludedUserIds,
  onCloseMeeting,
  onCreateRecommendation,
  onDecideMenu,
  onSelectRecommendation,
  onExcludedUserIdsChange,
  onLogout,
  isLoading,
  isGuestSession
}: MeetingDetailProps) {
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
