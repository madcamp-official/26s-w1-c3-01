import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { masterDataApi } from "../../api/masterData.api";

export function MenuListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const loadMenus = async () => {
    try {
      const data = await masterDataApi.listMenus() as { items: any[] };
      setItems(data.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "메뉴 목록 조회에 실패했습니다.");
    }
  };

  useEffect(() => {
    void loadMenus();
  }, []);

  return (
    <section className="api-page">
      <h1>메뉴 목록</h1>
      <button type="button" onClick={loadMenus}>새로고침</button>
      {message && <p className="api-message">{message}</p>}
      <div className="api-list">
        {items.map((menu) => (
          <article key={menu.menuId}>
            <h2>{menu.name}</h2>
            <p>{menu.description}</p>
            <Link to={`/menus/${menu.menuId}`}>상세 보기</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
