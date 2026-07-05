import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.api";
import { authStore } from "../../store/authStore";

export function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password1234");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await authApi.signup({ email, password, nickname, userType: "PERSONAL" });
      const accessToken = data.accessToken ?? data.session?.accessToken;
      if (accessToken) {
        authStore.setAccessToken(accessToken);
      }
      navigate("/onboarding/preferences");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="api-page">
      <h1>회원가입</h1>
      <form className="api-form" onSubmit={handleSubmit}>
        <label>
          이메일
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label>
          닉네임
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
        </label>
        <button type="submit" disabled={loading}>{loading ? "가입 중..." : "회원가입"}</button>
      </form>
      {message && <p className="api-message">{message}</p>}
      <Link to="/login">로그인으로 이동</Link>
    </section>
  );
}
