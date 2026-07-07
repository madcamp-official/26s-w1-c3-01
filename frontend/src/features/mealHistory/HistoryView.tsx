import { useState, type FormEvent } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Star from "lucide-react/dist/esm/icons/star";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import X from "lucide-react/dist/esm/icons/x";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Page } from "../../components/layout/Page";
import { PageGrid } from "../../components/layout/PageGrid";
import type { DisplayHistory, RemoteMenu } from "../../domain/mapper";
import type { MealHistoryFormValue } from "./MealHistoryDialog";

type HistoryViewProps = {
  historiesData: DisplayHistory[];
  menus: RemoteMenu[];
  isSaving: boolean;
  onUpdateHistory: (historyId: number, value: MealHistoryFormValue & { eatenAt?: string }) => Promise<void>;
  onDeleteHistory: (historyId: number) => Promise<void>;
  onToggleInteraction: (history: DisplayHistory, interactionType: "like" | "dislike" | "bookmark") => Promise<void>;
};

type HistoryDraft = {
  menuId: string;
  rating: string;
  memo: string;
  eatenAt: string;
};

export function HistoryView({
  historiesData,
  menus,
  isSaving,
  onUpdateHistory,
  onDeleteHistory,
  onToggleInteraction
}: HistoryViewProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(() => historiesData[0]?.id ?? null);
  const [draft, setDraft] = useState<HistoryDraft>({ menuId: "", rating: "5", memo: "", eatenAt: "" });
  const selectedHistory = historiesData.find((history) => history.id === selectedHistoryId) ?? historiesData[0] ?? null;
  const calendarDays = buildCalendarDays(visibleMonth);
  const historiesByDate = groupHistoriesByDate(historiesData);
  const selectedDateKey = selectedHistory ? historyDateKey(selectedHistory) : "";
  const selectedDayHistories = selectedDateKey ? historiesByDate.get(selectedDateKey) ?? [] : [];

  const startEdit = (history: DisplayHistory) => {
    if (!history.id) return;
    setSelectedHistoryId(history.id);
    setEditingId(history.id);
    setDraft({
      menuId: String(history.menuId ?? menus[0]?.menuId ?? ""),
      rating: String(history.rating ?? 5),
      memo: history.memo?.startsWith("만족도 ") ? "" : history.memo ?? "",
      eatenAt: toDateTimeLocal(history.eatenAt)
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId || !draft.menuId) return;
    void onUpdateHistory(editingId, {
      menuId: Number(draft.menuId),
      rating: Number(draft.rating),
      memo: draft.memo,
      eatenAt: draft.eatenAt ? new Date(draft.eatenAt).toISOString() : undefined
    }).then(() => setEditingId(null));
  };

  return (
    <Page className="history-screen" title="식사 기록" description="선택한 메뉴는 이후 추천에서 반복을 줄이는 데 사용됩니다.">
      {historiesData.length ? (
        <PageGrid className="history-calendar-layout">
          <section className="history-calendar-panel" aria-label="식사 기록 캘린더">
            <div className="calendar-toolbar">
              <div>
                <h3>{formatMonthTitle(visibleMonth)}</h3>
                <span>{historiesData.length}개 기록</span>
              </div>
              <div className="calendar-actions">
                <button type="button" aria-label="이전 달" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}>
                  <ChevronLeft size={18} />
                </button>
                <button type="button" onClick={() => setVisibleMonth(startOfMonth(new Date()))}>오늘</button>
                <button type="button" aria-label="다음 달" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="history-calendar-grid">
              {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                <strong className="calendar-weekday" key={day}>{day}</strong>
              ))}
              {calendarDays.map((day) => {
                const key = dateKey(day);
                const dayHistories = historiesByDate.get(key) ?? [];
                const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                const isToday = key === dateKey(new Date());
                return (
                  <div className={`calendar-day ${isCurrentMonth ? "" : "muted"} ${isToday ? "today" : ""}`} key={key}>
                    <time dateTime={key}>{day.getDate()}</time>
                    <div className="calendar-event-list">
                      {dayHistories.map((history) => (
                        <button
                          type="button"
                          className={history.id === selectedHistory?.id ? "selected" : ""}
                          key={history.id ?? `${key}-${history.menu}`}
                          onClick={() => {
                            setSelectedHistoryId(history.id ?? null);
                            setEditingId(null);
                          }}
                        >
                          {history.menu}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="history-detail-panel">
            {selectedDayHistories.length ? (
              <>
                <div className="history-day-summary">
                  <span>{formatSelectedDate(selectedDayHistories[0])}</span>
                  <strong>{selectedDayHistories.length}개 메뉴</strong>
                </div>
                <div className="history-day-list">
                  {selectedDayHistories.map((history) => (
                    <HistoryDetailCard
                      key={history.id ?? `${historyDateKey(history)}-${history.menu}`}
                      history={history}
                      menus={menus}
                      isSaving={isSaving}
                      isEditing={editingId === history.id}
                      draft={draft}
                      setDraft={setDraft}
                      onStartEdit={startEdit}
                      onSubmit={handleSubmit}
                      onCancelEdit={() => setEditingId(null)}
                      onDeleteHistory={onDeleteHistory}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </aside>
        </PageGrid>
      ) : (
        <EmptyState title="식사 기록이 없습니다" description="식사 기록 API가 아직 빈 목록을 반환했습니다." />
      )}
    </Page>
  );
}

function HistoryDetailCard({
  history,
  menus,
  isSaving,
  isEditing,
  draft,
  setDraft,
  onStartEdit,
  onSubmit,
  onCancelEdit,
  onDeleteHistory
}: {
  history: DisplayHistory;
  menus: RemoteMenu[];
  isSaving: boolean;
  isEditing: boolean;
  draft: HistoryDraft;
  setDraft: (draft: HistoryDraft) => void;
  onStartEdit: (history: DisplayHistory) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onDeleteHistory: (historyId: number) => Promise<void>;
}) {
  return (
    <article className="history-detail-card">
      <div className="history-detail-head">
        <HistoryImage image={history.image} />
        <div>
          <span>{formatDetailDate(history.eatenAt)}</span>
          <h3>{history.menu}</h3>
          <p>{history.memo}</p>
        </div>
      </div>
      <div className="history-detail-rating" aria-label={`${history.menu} 만족도`}>
        <StarRating value={history.rating ?? 0} readOnly />
        <strong>{history.rating ?? "-"} / 5</strong>
      </div>
      <div className="history-actions detail-actions">
        <button type="button" aria-label="식사 기록 수정" onClick={() => onStartEdit(history)} disabled={!history.id || isSaving}>
          <Pencil size={15} />
        </button>
        <button
          type="button"
          aria-label="식사 기록 삭제"
          onClick={() => history.id && onDeleteHistory(history.id)}
          disabled={!history.id || isSaving}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {isEditing ? (
        <form className="history-edit-form" onSubmit={onSubmit}>
          <label className="text-field">
            <span>메뉴</span>
            <select value={draft.menuId} onChange={(event) => setDraft({ ...draft, menuId: event.target.value })}>
              {menus.map((menu) => (
                <option key={menu.menuId} value={String(menu.menuId)}>
                  {menu.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-field">
            <span>시간</span>
            <input
              type="datetime-local"
              value={draft.eatenAt}
              onChange={(event) => setDraft({ ...draft, eatenAt: event.target.value })}
            />
          </label>
          <div className="text-field rating-field">
            <span>만족도</span>
            <StarRating value={Number(draft.rating) || 0} onChange={(rating) => setDraft({ ...draft, rating: String(rating) })} />
          </div>
          <label className="text-field full">
            <span>메모</span>
            <input value={draft.memo} onChange={(event) => setDraft({ ...draft, memo: event.target.value })} />
          </label>
          <div className="history-edit-actions">
            <button className="secondary-button" type="button" onClick={onCancelEdit} disabled={isSaving}>
              <X size={15} />
              취소
            </button>
            <button className="primary-button" type="submit" disabled={isSaving || !draft.menuId}>
              <Check size={15} />
              수정 완료
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );
}

function StarRating({ value, onChange, readOnly = false }: { value: number; onChange?: (value: number) => void; readOnly?: boolean }) {
  return (
    <div className="star-rating" role={readOnly ? "img" : "radiogroup"} aria-label={`만족도 ${value || 0}점`}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          className={rating <= value ? "active" : ""}
          aria-label={`${rating}점`}
          aria-pressed={!readOnly && rating === value ? true : undefined}
          disabled={readOnly}
          onClick={() => onChange?.(rating)}
        >
          <Star size={22} />
        </button>
      ))}
    </div>
  );
}

function HistoryImage({ image }: { image?: string }) {
  const [hasError, setHasError] = useState(false);

  if (!image || hasError) {
    return <div className="history-thumb empty" aria-hidden="true" />;
  }

  return (
    <div className="history-thumb">
      <img src={image} alt="" loading="lazy" onError={() => setHasError(true)} />
    </div>
  );
}

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildCalendarDays(month: Date) {
  const firstDay = startOfMonth(month);
  const offset = (firstDay.getDay() + 6) % 7;
  const firstCell = new Date(firstDay);
  firstCell.setDate(firstDay.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell);
    date.setDate(firstCell.getDate() + index);
    return date;
  });
}

function groupHistoriesByDate(histories: DisplayHistory[]) {
  const grouped = new Map<string, DisplayHistory[]>();
  for (const history of histories) {
    const key = historyDateKey(history);
    grouped.set(key, [...(grouped.get(key) ?? []), history]);
  }
  return grouped;
}

function historyDateKey(history: DisplayHistory) {
  return history.eatenAt ? dateKey(new Date(history.eatenAt)) : history.date;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(date);
}

function formatDetailDate(value?: string) {
  if (!value) return "시간 미정";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "시간 미정";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatSelectedDate(history: DisplayHistory) {
  return formatDetailDate(history.eatenAt ?? history.date);
}
