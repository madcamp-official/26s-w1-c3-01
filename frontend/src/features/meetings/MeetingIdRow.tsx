import type { MouseEvent } from "react";

type MeetingIdRowProps = {
  meetingId: number;
  compact?: boolean;
};

export function MeetingIdRow({ meetingId, compact = false }: MeetingIdRowProps) {
  const copyMeetingId = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void navigator.clipboard?.writeText(String(meetingId));
  };

  return (
    <div className={`meeting-id-row ${compact ? "compact" : ""}`}>
      <span>모임 ID {meetingId}</span>
      <button type="button" onClick={copyMeetingId}>복사</button>
    </div>
  );
}
