import { logoAssets } from "../../assets";
import type { Tab } from "../../app/app.types";

type AppHeaderProps = {
  activeTab: Tab;
};

export function AppHeader({ activeTab }: AppHeaderProps) {
  if (activeTab === "home") {
    return (
      <header className="app-header home-app-header">
        <div className="brand-row">
          <span />
          <img src={logoAssets.appEn} alt="MUK PICK" className="home-app-logo" />
          <span />
        </div>
      </header>
    );
  }

  return (
    <header className="app-header">
      <img src={logoAssets.appEn} alt="MUK PICK" className="app-logo" />
    </header>
  );
}
