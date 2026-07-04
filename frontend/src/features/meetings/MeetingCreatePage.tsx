import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { meetingsApi } from "../../api/meetings.api";

export function MeetingCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("점심 메뉴 정하기");
  const [meetingTime, setMeetingTime] = useState("2026-07-04T12:30:00+09:00");
  const [meetingPurposeId, setMeetingPurposeId] = useState(3);
  const [location, setLocation] = useState("카이스트 근처");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await meetingsApi.create({ title, meetingTime, meetingPurposeId, location }) as { meeting_id: number };
      navigate(`/meetings/${data.meeting_id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "모임 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="api-page">
      <h1>모임 만들기</h1>
      <form className="api-form" onSubmit={handleSubmit}>
        <label>
          제목
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          시간
          <input value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)} />
        </label>
        <label>
          목적 ID
          <input type="number" value={meetingPurposeId} onChange={(event) => setMeetingPurposeId(Number(event.target.value))} />
        </label>
        <label>
          장소
          <input value={location} onChange={(event) => setLocation(event.target.value)} />
        </label>
        <button type="submit" disabled={loading}>{loading ? "생성 중..." : "모임 생성"}</button>
      </form>
      {message && <p className="api-message">{message}</p>}
    </section>
  );
}
