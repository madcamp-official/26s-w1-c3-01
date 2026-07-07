import { useState, type FormEvent } from "react";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Check from "lucide-react/dist/esm/icons/check";
import Clock from "lucide-react/dist/esm/icons/clock";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import X from "lucide-react/dist/esm/icons/x";
import { Page } from "../../components/layout/Page";
import { PageHeader } from "../../components/layout/PageHeader";
import type { DisplayMeeting, DisplayMember, DisplayRecommendation, MeetingPurpose } from "../../domain/mapper";
import { RecommendationList } from "../recommendations/RecommendationList";
import type { MeetingFormValue } from "./MeetingCreateDialog";
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
  onUpdateMeeting: (meetingId: number, meeting: MeetingFormValue) => Promise<void>;
  isLoading: boolean;
  currentUserId: number | null;
  meetingPurposes: MeetingPurpose[];
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
  onUpdateMeeting,
  isLoading,
  currentUserId,
  meetingPurposes,
  isGuestSession
}: MeetingDetailProps) {
  const [editing, setEditing] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const isDecided = selectedMeeting.status === "DECIDED" || selectedMeeting.status === "CLOSED";
  const isCreator = typeof selectedMeeting.createdBy === "number" && selectedMeeting.createdBy === currentUserId;
  const canManage = isCreator && !isGuestSession;
  const roleLabel = isCreator ? "모임장" : isGuestSession ? "게스트 참여자" : "참여자";
  const includedUserIds = selectedMeeting.members
    .map((member) => member.userId)
    .filter((userId): userId is number => typeof userId === "number" && !excludedUserIds.includes(userId));
  const toggleMember = (member: DisplayMember) => {
    if (!canManage || isDecided || typeof member.userId !== "number") return;
    onExcludedUserIdsChange(
      excludedUserIds.includes(member.userId)
        ? excludedUserIds.filter((userId) => userId !== member.userId)
        : [...excludedUserIds, member.userId]
    );
  };

  return (
    <Page className={`meeting-detail-screen ${isGuestSession ? "guest-meeting-detail" : ""}`}>
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
      <PageHeader title={selectedMeeting.title} description="참여자 정보와 이 모임의 추천 결과를 확인합니다." />
      <section className="section-block meeting-detail-card">
        <div className="meeting-topline">
          <strong>{statusLabel(selectedMeeting.status)}</strong>
          <span>{isDecided ? "완료된 모임" : "진행 중"}</span>
        </div>
        <div className="meeting-role-row">
          <span className={isCreator ? "role-chip owner" : "role-chip"}>{roleLabel}</span>
          <small>{selectedMeeting.creatorNickname ? `모임장 ${selectedMeeting.creatorNickname}` : "권한 정보를 확인했습니다."}</small>
        </div>
        <div className="meeting-compact-meta">
          {selectedMeeting.id ? <MeetingIdRow meetingId={selectedMeeting.id} /> : null}
          <span><Clock size={15} />{selectedMeeting.time}</span>
          <span><MapPin size={15} />{selectedMeeting.place}</span>
        </div>
        <button
          className="meeting-detail-toggle"
          type="button"
          onClick={() => setDetailsExpanded((value) => !value)}
          aria-expanded={detailsExpanded}
        >
          {detailsExpanded ? "참여자 접기" : `참여자 ${selectedMeeting.members.length}명 보기`}
        </button>
        {canManage && !isDecided && selectedMeeting.id ? (
          <button className="secondary-button meeting-edit-button" type="button" onClick={() => setEditing((value) => !value)}>
            {editing ? <X size={15} /> : <Pencil size={15} />}
            {editing ? "수정 닫기" : "모임 정보 수정"}
          </button>
        ) : null}
        {editing && selectedMeeting.id ? (
          <MeetingEditPanel
            meeting={selectedMeeting}
            meetingPurposes={meetingPurposes}
            isSaving={isLoading}
            onCancel={() => setEditing(false)}
            onSubmit={(value) => onUpdateMeeting(selectedMeeting.id!, value).then(() => setEditing(false))}
          />
        ) : null}
        {detailsExpanded || editing ? (
          <>
            <div className="member-row selectable-members" aria-label="추천 계산에 포함할 구성원">
              {selectedMeeting.members.map((member) => (
                <button
                  type="button"
                  key={`${member.userId ?? "member"}-${member.name}`}
                  className={[
                    typeof member.userId === "number" && excludedUserIds.includes(member.userId) ? "excluded" : "",
                    typeof member.userId === "number" && member.userId === selectedMeeting.createdBy ? "creator" : "",
                    typeof member.userId === "number" && member.userId === currentUserId ? "self" : ""
                  ].filter(Boolean).join(" ")}
                  onClick={() => toggleMember(member)}
                  disabled={!canManage || isDecided || typeof member.userId !== "number"}
                  aria-pressed={typeof member.userId === "number" && !excludedUserIds.includes(member.userId)}
                >
                  <span>{member.name}</span>
                  {typeof member.userId === "number" && member.userId === selectedMeeting.createdBy ? <small>모임장</small> : null}
                  {typeof member.userId === "number" && member.userId === currentUserId ? <small>나</small> : null}
                </button>
              ))}
            </div>
            {!canManage ? (
              <p className="meeting-permission-note">참여자는 추천 결과를 확인할 수 있고, 추천 계산과 메뉴 확정은 모임장이 진행합니다.</p>
            ) : null}
            {!isDecided ? <p className="meeting-live-note">참여자 정보는 주기적으로 자동 갱신됩니다.</p> : null}
          </>
        ) : null}
      </section>
      <section className="section-block group-result">
        <div className="section-heading">
          <h3>이 모임의 추천 메뉴</h3>
          {selectedMeeting.id && !isDecided && canManage ? (
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
            variant="wide"
            items={meetingRecommendations}
            emptyMessage="아직 이 모임의 추천 결과가 없습니다."
            selectedMenuId={selectedRecommendation?.menuId}
            onSelect={isDecided || !canManage ? undefined : onSelectRecommendation}
          />
        </div>
        {meetingRecommendations.length && canManage ? (
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
        {meetingRecommendations.length && !canManage ? (
          <div className="guest-confirm-note">현재 권한은 {roleLabel}입니다. 메뉴 확정은 모임장이 진행합니다.</div>
        ) : null}
      </section>
    </Page>
  );
}

function MeetingEditPanel({
  meeting,
  meetingPurposes,
  isSaving,
  onCancel,
  onSubmit
}: {
  meeting: DisplayMeeting;
  meetingPurposes: MeetingPurpose[];
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (value: MeetingFormValue) => Promise<void>;
}) {
  const [title, setTitle] = useState(meeting.title);
  const [meetingTime, setMeetingTime] = useState(toDateTimeLocal(meeting.meetingTime));
  const [place, setPlace] = useState(meeting.place);
  const [purposeId, setPurposeId] = useState(String(meeting.meetingPurposeId ?? meetingPurposes[0]?.id ?? 1));
  const purposeOptions = meetingPurposes.length ? meetingPurposes : [{ id: Number(purposeId || 1), name: "식사" }];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit({
      title: title.trim() || "새 모임",
      meetingTime,
      place: place.trim() || "장소 미정",
      meetingPurposeId: Number(purposeId || purposeOptions[0]?.id || 1)
    });
  };

  return (
    <form className="meeting-edit-panel" onSubmit={handleSubmit}>
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
        <select value={purposeId} onChange={(event) => setPurposeId(event.target.value)}>
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
      <div className="meeting-edit-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={isSaving}>
          <X size={15} />
          취소
        </button>
        <button className="primary-button" type="submit" disabled={isSaving || !meetingTime}>
          <Check size={15} />
          저장
        </button>
      </div>
    </form>
  );
}

function toDateTimeLocal(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
