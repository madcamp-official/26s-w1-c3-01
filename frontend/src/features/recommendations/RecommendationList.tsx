import { useState } from "react";
import { EmptyState } from "../../components/feedback/EmptyState";
import type { DisplayRecommendation } from "../../domain/mapper";

type RecommendationListProps = {
  compact?: boolean;
  variant?: "compact" | "wide" | "grid";
  items: DisplayRecommendation[];
  emptyMessage: string;
  actionLabel?: string;
  onAction?: (item: DisplayRecommendation) => void;
  selectedMenuId?: number;
  onSelect?: (item: DisplayRecommendation) => void;
};

export function RecommendationList({
  compact = false,
  variant,
  items,
  emptyMessage,
  actionLabel,
  onAction,
  selectedMenuId,
  onSelect
}: RecommendationListProps) {
  const listVariant = variant ?? (compact ? "compact" : "wide");

  if (!items.length) {
    return <EmptyState title="추천 결과가 없습니다" description={emptyMessage} compact={listVariant === "compact"} />;
  }

  return (
    <div className={`recommendation-list recommendation-list--${listVariant} ${listVariant === "compact" ? "compact" : ""}`}>
      {items.slice(0, 6).map((item) => {
        const isSelected = typeof item.menuId === "number" && item.menuId === selectedMenuId;
        const scoreBreakdown = getScoreBreakdown(item);
        return (
          <article
            className={`recommendation-card ${isSelected ? "selected" : ""} ${onSelect ? "selectable" : ""}`}
            key={`${item.rank}-${item.menu}`}
            onClick={() => onSelect?.(item)}
          >
            <RecommendationMedia item={item} />
            <div className="rank-mark">{item.rank}</div>
            <div className="recommendation-body">
              <div className="recommendation-title">
                <strong>{item.menu}</strong>
                <span>{item.score}점</span>
              </div>
              <p>{item.reason}</p>
              {scoreBreakdown.length ? (
                <div className="score-breakdown" aria-label={`${item.menu} 추천 점수 상세`}>
                  {scoreBreakdown.map((score) => (
                    <span key={score.label}>{score.label} {formatScore(score.value)}</span>
                  ))}
                </div>
              ) : null}
              {actionLabel && onAction ? (
                <div className="tag-row">
                  {item.category && item.category !== "API" ? <span>{item.category}</span> : null}
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onAction(item);
                    }}
                    disabled={!item.menuId}
                  >
                    {actionLabel}
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function RecommendationMedia({ item }: { item: DisplayRecommendation }) {
  const [hasError, setHasError] = useState(false);

  if (!item.image || hasError) {
    return <div className="recommendation-media empty" aria-hidden="true" />;
  }

  return (
    <div className="recommendation-media">
      <img src={item.image} alt="" loading="lazy" onError={() => setHasError(true)} />
    </div>
  );
}

function formatScore(value?: number) {
  return typeof value === "number" ? Math.round(value * 10) / 10 : "-";
}

function getScoreBreakdown(item: DisplayRecommendation) {
  const scores = item.scores;
  if (!scores) return [];

  const entries = [
    { label: "카테고리", value: scores.categoryScore },
    { label: "태그", value: scores.tagScore },
    { label: "메뉴", value: scores.menuPreferenceScore },
    { label: "예산", value: scores.budgetScore ?? scores.priceScore },
    { label: "패널티", value: scores.historyPenalty ?? scores.negativeFeedbackScore },
    { label: "참여자 평균", value: scores.groupPreferenceScore },
    { label: "최저 참여자", value: scores.minimumParticipantScore },
    { label: "모임 적합도", value: scores.purposeScore },
    { label: "평점", value: scores.ratingScore },
    { label: "인기", value: scores.popularityScore },
    { label: "새로움", value: scores.noveltyScore },
    { label: "반복", value: scores.repeatScore }
  ];

  return entries.filter((entry) => typeof entry.value === "number");
}
