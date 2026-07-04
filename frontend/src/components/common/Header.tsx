import { Link } from "react-router-dom";
import { authStore } from "../../store/authStore";

export function Header() {
  const logout = () => {
    authStore.clear();
    window.location.href = "/login";
  };

  return (
    <header>
      <Link to="/">MUK PICK</Link>
      <nav>
        <Link to="/menus">메뉴</Link>
        <Link to="/preferences">선호도</Link>
        <Link to="/meetings">모임</Link>
        <Link to="/meal-history">식사 기록</Link>
        <Link to="/me">마이페이지</Link>
        <button type="button" onClick={logout}>로그아웃</button>
      </nav>
    </header>
  );
}
