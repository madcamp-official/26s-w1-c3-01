import { FormEvent, useEffect, useState } from "react";
import { preferencesApi } from "../../api/preferences.api";

export function PreferenceForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<unknown>(null);

  const loadPreferences = async () => {
    try {
      setCurrent(await preferencesApi.getMine());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "선호도 조회에 실패했습니다.");
    }
  };

  useEffect(() => {
    void loadPreferences();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 백엔드 연결 확인용 기본 선호도입니다. 실제 UI에서는 입력값으로 바꾸면 됩니다.
      await preferencesApi.replaceMine({
        menuPreferences: [
          { menuId: 1, preferenceScore: 5 },
          { menuId: 5, preferenceScore: -3 }
        ],
        categoryPreferences: [{ categoryId: 1, preferenceScore: 4 }],
        tagPreferences: [{ tagId: 2, preferenceScore: 3 }],
        allergyIds: [10]
      });
      setMessage("선호도가 저장되었습니다.");
      await loadPreferences();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "선호도 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="api-form" onSubmit={handleSubmit}>
      <p>버튼을 누르면 테스트 선호도가 백엔드에 저장됩니다.</p>
      <button type="submit" disabled={loading}>{loading ? "저장 중..." : "선호도 저장"}</button>
      {message && <p className="api-message">{message}</p>}
      {current !== null && <pre>{JSON.stringify(current, null, 2)}</pre>}
    </form>
  );
}
