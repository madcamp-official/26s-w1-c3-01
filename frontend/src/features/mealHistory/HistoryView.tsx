import { EmptyState } from "../../components/feedback/EmptyState";
import { ScreenTitle } from "../../components/navigation/ScreenTitle";
import type { DisplayHistory } from "../../domain/appModel";

type HistoryViewProps = {
  historiesData: DisplayHistory[];
};

export function HistoryView({ historiesData }: HistoryViewProps) {
  return (
    <section className="screen">
      <ScreenTitle title="식사 기록" description="선택한 메뉴는 이후 추천에서 반복을 줄이는 데 사용됩니다." />
      {historiesData.length ? (
        <div className="history-timeline">
          {historiesData.map((history, index) => {
            const historyKey = String(history.id ?? `${history.date}-${history.menu}-${index}`);
            return (
              <article className="history-row" key={historyKey}>
                <time>{history.date}</time>
                <div>
                  <strong>{history.menu}</strong>
                  <span>{history.memo}</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="식사 기록이 없습니다" description="식사 기록 API가 아직 빈 목록을 반환했습니다." />
      )}
    </section>
  );
}
