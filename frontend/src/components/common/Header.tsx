import { Link } from "react-router-dom";

export function Header() {
  return (
    <header>
      <Link to="/">MUK PICK</Link>
      <nav>
        <Link to="/menus">메뉴</Link>
        <Link to="/preferences">선호도</Link>
        <Link to="/meetings">모임</Link>
        <Link to="/meal-history">식사 기록</Link>
        <Link to="/me">마이페이지</Link>
      </nav>
    </header>
  );
}
