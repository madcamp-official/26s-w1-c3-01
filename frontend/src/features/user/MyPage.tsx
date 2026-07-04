import { useEffect, useState } from "react";
import { usersApi } from "../../api/users.api";
import { ProfileEditForm } from "./ProfileEditForm";

export function MyPage() {
  const [profile, setProfile] = useState<unknown>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfile(await usersApi.getMe());
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "프로필 조회에 실패했습니다.");
      }
    };

    void loadProfile();
  }, []);

  return (
    <section className="api-page">
      <h1>마이페이지</h1>
      <ProfileEditForm />
      {message && <p className="api-message">{message}</p>}
      {profile !== null && <pre>{JSON.stringify(profile, null, 2)}</pre>}
    </section>
  );
}
