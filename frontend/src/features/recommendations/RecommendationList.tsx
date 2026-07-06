import { EmptyState } from "../../components/feedback/EmptyState";
import type { DisplayRecommendation } from "../../domain/appModel";

type RecommendationListProps = {
  compact?: boolean;
  items: DisplayRecommendation[];
  emptyMessage: string;
  actionLabel?: string;
  onAction?: (item: DisplayRecommendation) => void;
  selectedMenuId?: number;
  onSelect?: (item: DisplayRecommendation) => void;
};

export function RecommendationList({
  compact = false,
  items,
  emptyMessage,
  actionLabel,
  onAction,
  selectedMenuId,
  onSelect
}: RecommendationListProps) {
  if (!items.length) {
    return <EmptyState title="추천 결과가 없습니다" description={emptyMessage} compact={compact} />;
  }

  return (
    <div className={`recommendation-list ${compact ? "compact" : ""}`}>
      {items.map((item) => {
        const isSelected = typeof item.menuId === "number" && item.menuId === selectedMenuId;
        return (
          <article
            className={`recommendation-card ${isSelected ? "selected" : ""} ${onSelect ? "selectable" : ""}`}
            key={`${item.rank}-${item.menu}`}
            onClick={() => onSelect?.(item)}
          >
            <div className="rank-mark">{item.rank}</div>
            <div className="recommendation-body">
              <div className="recommendation-title">
                <strong>{item.menu}</strong>
                <span>{item.score}점</span>
              </div>
              <p>{item.reason}</p>
              <div className="tag-row">
                <span>{item.category}</span>
                {actionLabel && onAction ? (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onAction(item);
                    }}
                    disabled={!item.menuId}
                  >
                    {actionLabel}
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
