import { useState, type FormEvent } from "react";

type JoinMeetingPanelProps = {
  currentUserName: string;
  isGuestSession: boolean;
  isLoading: boolean;
  onJoinMeeting: (meetingId: string, displayName: string) => Promise<void>;
};

export function JoinMeetingPanel({
  currentUserName,
  isGuestSession,
  isLoading,
  onJoinMeeting
}: JoinMeetingPanelProps) {
  const [meetingId, setMeetingId] = useState("");
  const [displayName, setDisplayName] = useState(currentUserName);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onJoinMeeting(meetingId, displayName || currentUserName);
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
