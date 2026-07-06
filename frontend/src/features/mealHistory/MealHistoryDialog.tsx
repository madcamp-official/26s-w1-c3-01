import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import type { RemoteMenu } from "../../domain/appModel";
import { useModalA11y } from "../../hooks/useModalA11y";

export type MealHistoryFormValue = {
  menuId: number;
  rating: number;
  memo: string;
};

type MealHistoryDialogProps = {
  open: boolean;
  menus: RemoteMenu[];
  onClose: () => void;
  onCreate: (value: MealHistoryFormValue) => void;
  isSaving: boolean;
};

export function MealHistoryDialog({
  open,
  menus,
  onClose,
  onCreate,
  isSaving
}: MealHistoryDialogProps) {
  const [menuId, setMenuId] = useState("");
  const [rating, setRating] = useState("4");
  const [memo, setMemo] = useState("");
  const dialogRef = useModalA11y(open, onClose);

  if (!open) return null;

  const selectedMenuId = Number(menuId || menus[0]?.menuId || 0);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMenuId) return;
    onCreate({ menuId: selectedMenuId, rating: Number(rating), memo });
  };

  return (
    <div className="modal-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="meeting-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-dialog-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="dialog-heading">
          <div>
            <p>HISTORY</p>
            <h2 id="history-dialog-title">식사 기록 추가</h2>
          </div>
          <button className="ghost-icon-button" aria-label="식사 기록 닫기" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="dialog-form" onSubmit={handleSubmit}>
          <label className="text-field">
            <span>먹은 메뉴</span>
            <select value={String(selectedMenuId)} onChange={(event) => setMenuId(event.target.value)} required>
              {menus.map((menu) => (
                <option key={menu.menuId} value={String(menu.menuId)}>
                  {menu.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-field">
            <span>만족도</span>
            <select value={rating} onChange={(event) => setRating(event.target.value)}>
              <option value="5">5점</option>
              <option value="4">4점</option>
              <option value="3">3점</option>
              <option value="2">2점</option>
              <option value="1">1점</option>
            </select>
          </label>
          <label className="text-field">
            <span>메모</span>
            <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="예: 점심으로 먹음" />
          </label>
          <button className="primary-button" type="submit" disabled={isSaving || !menus.length}>
            <Plus size={18} />
            {isSaving ? "API 저장 중" : "기록 저장"}
          </button>
        </form>
      </section>
    </div>
  );
}
