import { FormEvent, useState } from "react";
import { mealHistoryApi } from "../../api/mealHistory.api";

type MealHistoryFormProps = {
  onCreated?: () => void;
};

export function MealHistoryForm({ onCreated }: MealHistoryFormProps) {
  const [menuId, setMenuId] = useState(1);
  const [rating, setRating] = useState(5);
  const [memo, setMemo] = useState("프론트에서 저장한 식사 기록");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await mealHistoryApi.create({ menuId, rating, memo });
      setMessage("식사 기록이 저장되었습니다.");
      onCreated?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "식사 기록 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="api-form" onSubmit={handleSubmit}>
      <label>
        메뉴 ID
        <input type="number" value={menuId} onChange={(event) => setMenuId(Number(event.target.value))} />
      </label>
      <label>
        평점
        <input type="number" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} />
      </label>
      <label>
        메모
        <input value={memo} onChange={(event) => setMemo(event.target.value)} />
      </label>
      <button type="submit" disabled={loading}>{loading ? "저장 중..." : "식사 기록 저장"}</button>
      {message && <p className="api-message">{message}</p>}
    </form>
  );
}
