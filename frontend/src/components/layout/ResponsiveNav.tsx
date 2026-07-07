import Clock from "lucide-react/dist/esm/icons/clock";
import Home from "lucide-react/dist/esm/icons/home";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import Users from "lucide-react/dist/esm/icons/users";
import type { Tab } from "../../app/app.types";

const navItems: Array<{ id: Tab; label: string; icon: typeof Home; mobile?: boolean }> = [
  { id: "home", label: "홈", icon: Home, mobile: true },
  { id: "personal", label: "개인 추천", icon: Sparkles },
  { id: "meeting", label: "모임 추천", icon: Users, mobile: true },
  { id: "history", label: "식사 기록", icon: Clock },
  { id: "preferences", label: "선호도 관리", icon: SlidersHorizontal },
  { id: "profile", label: "프로필", icon: UserRound, mobile: true }
];

type ResponsiveNavProps = {
  visibleTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export function ResponsiveNav({ visibleTab, onTabChange }: ResponsiveNavProps) {
  return (
    <nav className="bottom-nav" aria-label="앱 메뉴">
      <div className="desktop-nav-brand">
        <img src="/assets/brand/mukpick-wordmark.png" alt="MUK PICK" />
        <span>오늘의 메뉴 선택</span>
      </div>
      {navItems.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          active={item.id === "home" ? !["meeting", "profile", "personal", "history", "preferences"].includes(visibleTab) : visibleTab === item.id}
          onClick={() => onTabChange(item.id)}
        />
      ))}
    </nav>
  );
}

function NavButton({
  item,
  active,
  onClick
}: {
  item: { id: Tab; label: string; icon: typeof Home; mobile?: boolean };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button className={`nav-button nav-${item.id} ${active ? "active" : ""} ${item.mobile ? "mobile-nav-item" : "desktop-only-nav-item"}`} onClick={onClick}>
      <Icon size={19} />
      <span>{item.label}</span>
    </button>
  );
}
