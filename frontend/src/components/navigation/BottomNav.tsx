import { Home, UserRound, Users } from "lucide-react";
import type { Tab } from "../../app/app.types";

const navItems: Array<{ id: "meeting" | "home" | "profile"; label: string; icon: typeof Home }> = [
  { id: "meeting", label: "모임", icon: Users },
  { id: "home", label: "홈", icon: Home },
  { id: "profile", label: "프로필", icon: UserRound }
];

type BottomNavProps = {
  visibleTab: Tab;
  onTabChange: (tab: "meeting" | "home" | "profile") => void;
};

export function BottomNav({ visibleTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      {navItems.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          active={item.id === "home" ? !["meeting", "profile"].includes(visibleTab) : visibleTab === item.id}
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
  item: { id: Tab; label: string; icon: typeof Home };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>
      <Icon size={19} />
      <span>{item.label}</span>
    </button>
  );
}
