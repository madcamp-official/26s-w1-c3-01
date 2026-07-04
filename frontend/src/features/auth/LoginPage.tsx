import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.api";
import { authStore } from "../../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("mukpick.test.006@gmail.com");
  const [password, setPassword] = useState("password1234");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await authApi.login({ email, password });
      authStore.setAccessToken(data.accessToken);
      navigate("/recommendations/personal");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="api-page">
      <h1>로그인</h1>
      <form className="api-form" onSubmit={handleSubmit}>
        <label>
          이메일
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button type="submit" disabled={loading}>{loading ? "로그인 중..." : "로그인"}</button>
      </form>
      {message && <p className="api-message">{message}</p>}
      <Link to="/signup">회원가입으로 이동</Link>
    </section>
  );
}
