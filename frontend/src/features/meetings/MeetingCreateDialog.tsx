import { useState, type FormEvent } from "react";
import Plus from "lucide-react/dist/esm/icons/plus";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import X from "lucide-react/dist/esm/icons/x";
import type { MeetingPurpose, UserOption } from "../../domain/mapper";
import { useModalA11y } from "../../hooks/useModalA11y";

export type MeetingFormValue = {
  title: string;
  meetingTime: string;
  place: string;
  meetingPurposeId: number;
  participantUserIds: number[];
};

type MeetingCreateDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (meeting: MeetingFormValue) => Promise<void>;
  isSaving: boolean;
  meetingPurposes: MeetingPurpose[];
  users: UserOption[];
  currentUserName: string;
};

function defaultDateTimeLocal() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(12, 30, 0, 0);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function MeetingCreateDialog({
  open,
  onClose,
  onCreate,
  isSaving,
  meetingPurposes,
  users,
  currentUserName
}: MeetingCreateDialogProps) {
  const [title, setTitle] = useState("새 점심 모임");
  const [meetingTime, setMeetingTime] = useState(defaultDateTimeLocal());
  const [place, setPlace] = useState("대전 유성구");
  const [purposeId, setPurposeId] = useState("");
  const [participantUserIds, setParticipantUserIds] = useState<number[]>([]);
  const dialogRef = useModalA11y(open, onClose);

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
    void onCreate({
      title: title.trim() || "새 모임",
      meetingTime,
      place: place.trim() || "장소 미정",
      meetingPurposeId: selectedPurposeId,
      participantUserIds
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="meeting-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-dialog-title"
        tabIndex={-1}
        ref={dialogRef}
      >
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
