import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { meetingsApi } from "../../api/meetings.api";
import type { MeetingSummary } from "./meeting.types";

export function MeetingListPage() {
  const [items, setItems] = useState<MeetingSummary[]>([]);
  const [message, setMessage] = useState("");

  const loadMeetings = async () => {
    try {
      const data = await meetingsApi.list() as { items: MeetingSummary[] };
      setItems(data.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "모임 목록 조회에 실패했습니다.");
    }
  };

  useEffect(() => {
    void loadMeetings();
  }, []);

  return (
    <section className="api-page">
      <h1>모임 목록</h1>
      <Link to="/meetings/new">모임 만들기</Link>
      <button type="button" onClick={loadMeetings}>새로고침</button>
      {message && <p className="api-message">{message}</p>}
      <div className="api-list">
        {items.map((meeting) => (
          <article key={meeting.meeting_id}>
            <h2>{meeting.title ?? "이름 없는 모임"}</h2>
            <p>{meeting.status} · {new Date(meeting.meeting_time).toLocaleString()}</p>
            <Link to={`/meetings/${meeting.meeting_id}`}>상세 보기</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
