import { useEffect, useState } from "react";
import { mealHistoryApi } from "../../api/mealHistory.api";
import { MealHistoryForm } from "./MealHistoryForm";

export function MealHistoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const loadHistory = async () => {
    try {
      const data = await mealHistoryApi.listMine() as { items: any[] };
      setItems(data.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "식사 기록 조회에 실패했습니다.");
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  return (
    <section className="api-page">
      <h1>식사 기록</h1>
      <MealHistoryForm onCreated={loadHistory} />
      <button type="button" onClick={loadHistory}>새로고침</button>
      {message && <p className="api-message">{message}</p>}
      <div className="api-list">
        {items.map((item) => (
          <article key={item.history_id}>
            <h2>{item.menus?.name ?? `메뉴 ${item.menu_id}`}</h2>
            <p>평점: {item.rating ?? "없음"}</p>
            <p>{item.memo}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
