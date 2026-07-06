import { useState, type FormEvent } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import X from "lucide-react/dist/esm/icons/x";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ScreenTitle } from "../../components/navigation/ScreenTitle";
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
  const [draft, setDraft] = useState<HistoryDraft>({ menuId: "", rating: "5", memo: "", eatenAt: "" });

  const startEdit = (history: DisplayHistory) => {
    if (!history.id) return;
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
    <section className="screen">
      <ScreenTitle title="식사 기록" description="선택한 메뉴는 이후 추천에서 반복을 줄이는 데 사용됩니다." />
      {historiesData.length ? (
        <div className="history-timeline">
          {historiesData.map((history, index) => {
            const historyKey = String(history.id ?? `${history.date}-${history.menu}-${index}`);
            const isEditing = Boolean(history.id && history.id === editingId);
            return (
              <article className={`history-row ${isEditing ? "editing" : ""}`} key={historyKey}>
                {!isEditing ? (
                  <>
                    <time>{history.date}</time>
                    <div>
                      <strong>{history.menu}</strong>
                      <span>{history.memo}</span>
                      <div className="history-feedback-actions" aria-label={`${history.menu} 피드백`}>
                        <button
                          type="button"
                          className={history.preference === "like" ? "selected" : ""}
                          onClick={() => onToggleInteraction(history, "like")}
                          disabled={!history.menuId || isSaving}
                        >
                          좋아요
                        </button>
                        <button
                          type="button"
                          className={history.preference === "dislike" ? "selected danger" : ""}
                          onClick={() => onToggleInteraction(history, "dislike")}
                          disabled={!history.menuId || isSaving}
                        >
                          싫어요
                        </button>
                        <button
                          type="button"
                          className={history.bookmarked ? "selected" : ""}
                          onClick={() => onToggleInteraction(history, "bookmark")}
                          disabled={!history.menuId || isSaving}
                        >
                          저장
                        </button>
                      </div>
                    </div>
                    <div className="history-actions">
                      <button type="button" aria-label="식사 기록 수정" onClick={() => startEdit(history)} disabled={!history.id || isSaving}>
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
                  </>
                ) : (
                  <form className="history-edit-form" onSubmit={handleSubmit}>
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
                    <label className="text-field">
                      <span>만족도</span>
                      <select value={draft.rating} onChange={(event) => setDraft({ ...draft, rating: event.target.value })}>
                        <option value="5">5점</option>
                        <option value="4">4점</option>
                        <option value="3">3점</option>
                        <option value="2">2점</option>
                        <option value="1">1점</option>
                      </select>
                    </label>
                    <label className="text-field full">
                      <span>메모</span>
                      <input value={draft.memo} onChange={(event) => setDraft({ ...draft, memo: event.target.value })} />
                    </label>
                    <div className="history-edit-actions">
                      <button className="secondary-button" type="button" onClick={() => setEditingId(null)} disabled={isSaving}>
                        <X size={15} />
                        취소
                      </button>
                      <button className="primary-button" type="submit" disabled={isSaving || !draft.menuId}>
                        <Check size={15} />
                        저장
                      </button>
                    </div>
                  </form>
                )}
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

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
