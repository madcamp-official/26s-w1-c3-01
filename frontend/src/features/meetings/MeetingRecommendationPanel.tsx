import { useState } from "react";
import { meetingsApi } from "../../api/meetings.api";
import type { MeetingRecommendationResult } from "./meeting.types";

type MeetingRecommendationPanelProps = {
  meetingId: number;
  onChanged?: () => void;
};

export function MeetingRecommendationPanel({ meetingId, onChanged }: MeetingRecommendationPanelProps) {
  const [results, setResults] = useState<MeetingRecommendationResult[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const createRecommendation = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await meetingsApi.createRecommendation(meetingId, {
        resultLimit: 3,
        recentDuplicateDays: 3
      }) as { results: MeetingRecommendationResult[] };
      setResults(data.results);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "모임 추천 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadLatest = async () => {
    try {
      const data = await meetingsApi.getLatestRecommendation(meetingId) as { results: MeetingRecommendationResult[] };
      setResults(data.results);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "최신 추천 조회에 실패했습니다.");
    }
  };

  const selectMenu = async (menuId: number) => {
    try {
      await meetingsApi.selectMenu(meetingId, menuId);
      setMessage("모임 메뉴가 확정되었습니다.");
      onChanged?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "메뉴 확정에 실패했습니다.");
    }
  };

  return (
    <section>
      <h2>모임 추천</h2>
      <div className="api-actions">
        <button type="button" onClick={createRecommendation} disabled={loading}>
          {loading ? "추천 중..." : "추천 생성"}
        </button>
        <button type="button" onClick={loadLatest}>최신 추천 조회</button>
      </div>
      {message && <p className="api-message">{message}</p>}
      <div className="api-list">
        {results.map((result) => (
          <article key={result.menuId}>
            <h3>{result.rankNo}. {result.menuName}</h3>
            <p>점수: {result.totalScore}</p>
            <p>{result.reason}</p>
            <button type="button" onClick={() => selectMenu(result.menuId)}>이 메뉴로 확정</button>
          </article>
        ))}
      </div>
    </section>
  );
}
