import { useState } from "react";
import { recommendationsApi } from "../../api/recommendations.api";
import type { RecommendationResult } from "./recommendation.types";

export function PersonalRecommendationPage() {
  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const createRecommendation = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await recommendationsApi.createPersonal({
        meetingPurposeId: 3,
        excludeRecentDays: 14,
        limit: 5,
        includeNewMenu: true
      }) as { results: RecommendationResult[] };
      setResults(data.results);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "개인 추천 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="api-page">
      <h1>개인 메뉴 추천</h1>
      <button type="button" onClick={createRecommendation} disabled={loading}>
        {loading ? "추천 중..." : "개인 추천 생성"}
      </button>
      {message && <p className="api-message">{message}</p>}
      <div className="api-list">
        {results.map((result) => (
          <article key={result.menuId}>
            <h2>{result.rankNo}. {result.menuName}</h2>
            <p>점수: {result.totalScore}</p>
            <p>{result.reason}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
