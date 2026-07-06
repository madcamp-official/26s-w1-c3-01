import { SlidersHorizontal } from "lucide-react";
import { logoAssets } from "../../assets";
import type { Tab } from "../../app/app.types";

type AppHeaderProps = {
  activeTab: Tab;
  onGoPreferences: () => void;
};

export function AppHeader({ activeTab, onGoPreferences }: AppHeaderProps) {
  if (activeTab === "home") {
    return (
      <header className="app-header home-app-header">
        <div className="brand-row">
          <span />
          <img src={logoAssets.appEn} alt="MUK PICK" className="home-app-logo" />
          <button className="bell-action" aria-label="선호도 빠른 설정" onClick={onGoPreferences}>
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="app-header">
      <img src={logoAssets.appEn} alt="MUK PICK" className="app-logo" />
      <button className="icon-action" aria-label="선호도 빠른 설정" onClick={onGoPreferences}>
        <SlidersHorizontal size={18} />
      </button>
    </header>
  );
}
