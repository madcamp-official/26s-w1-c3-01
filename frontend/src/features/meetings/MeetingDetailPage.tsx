import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { meetingsApi } from "../../api/meetings.api";
import { MeetingRecommendationPanel } from "./MeetingRecommendationPanel";

export function MeetingDetailPage() {
  const { meetingId } = useParams();
  const numericMeetingId = Number(meetingId);
  const [meeting, setMeeting] = useState<any>(null);
  const [message, setMessage] = useState("");

  const loadMeeting = async () => {
    try {
      setMeeting(await meetingsApi.get(numericMeetingId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "모임 상세 조회에 실패했습니다.");
    }
  };

  useEffect(() => {
    void loadMeeting();
  }, [numericMeetingId]);

  return (
    <section className="api-page">
      <h1>모임 상세</h1>
      {message && <p className="api-message">{message}</p>}
      {meeting && (
        <article>
          <h2>{meeting.title ?? "이름 없는 모임"}</h2>
          <p>상태: {meeting.status}</p>
          <p>선택 메뉴 ID: {meeting.selected_menu_id ?? "아직 없음"}</p>
          <h3>참여자</h3>
          <ul>
            {(meeting.participants ?? []).map((participant: any) => (
              <li key={participant.participant_id}>
                {participant.display_name} · {participant.attendance_status}
              </li>
            ))}
          </ul>
        </article>
      )}
      <MeetingRecommendationPanel meetingId={numericMeetingId} onChanged={loadMeeting} />
    </section>
  );
}
