import type { ReactNode } from "react";
import type { ApiStatus, Tab } from "../../app/app.types";
import { ApiFeedback } from "../feedback/ApiFeedback";
import { AppHeader } from "../navigation/AppHeader";
import { ResponsiveNav } from "./ResponsiveNav";

type AppLayoutProps = {
  visibleTab: Tab;
  isGuestSession: boolean;
  apiStatus: ApiStatus;
  apiError: string;
  toastMessage: string;
  onGoPreferences: () => void;
  onTabChange: (tab: Tab) => void;
  children: ReactNode;
  overlay?: ReactNode;
};

export function AppLayout({
  visibleTab,
  isGuestSession,
  apiStatus,
  apiError,
  toastMessage,
  onGoPreferences,
  onTabChange,
  children,
  overlay
}: AppLayoutProps) {
  return (
    <div className="app-shell min-h-dvh">
      <main className={`phone-frame bg-white app-frame tab-${visibleTab}`}>
        {!isGuestSession ? <AppHeader activeTab={visibleTab} onGoPreferences={onGoPreferences} /> : null}
        {visibleTab !== "home" ? <ApiFeedback status={apiStatus} error={apiError} compact /> : null}

        {children}

        {!isGuestSession ? <ResponsiveNav visibleTab={visibleTab} onTabChange={onTabChange} /> : null}
        {overlay}
        {toastMessage ? <div className="toast" role="status">{toastMessage}</div> : null}
      </main>
    </div>
  );
}
