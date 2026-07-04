import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { masterDataApi } from "../../api/masterData.api";

export function MenuDetailPage() {
  const { menuId } = useParams();
  const [menu, setMenu] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setMenu(await masterDataApi.getMenu(Number(menuId)));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "메뉴 상세 조회에 실패했습니다.");
      }
    };

    void loadMenu();
  }, [menuId]);

  return (
    <section className="api-page">
      <h1>메뉴 상세</h1>
      {message && <p className="api-message">{message}</p>}
      {menu && <pre>{JSON.stringify(menu, null, 2)}</pre>}
    </section>
  );
}
