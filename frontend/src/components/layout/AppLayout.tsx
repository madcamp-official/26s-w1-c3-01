import { useState, type ReactNode } from "react";
import type { ApiStatus, Tab } from "../../app/app.types";
import { ApiFeedback } from "../feedback/ApiFeedback";
import { ResponsiveNav } from "./ResponsiveNav";

type AppLayoutProps = {
  visibleTab: Tab;
  isGuestSession: boolean;
  apiStatus: ApiStatus;
  apiError: string;
  toastMessage: string;
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
  onTabChange,
  children,
  overlay
}: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="app-shell min-h-dvh">
      <main className={`phone-frame bg-white app-frame tab-${visibleTab} ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {visibleTab !== "home" ? <ApiFeedback status={apiStatus} error={apiError} compact /> : null}

        {children}

        {!isGuestSession ? (
          <ResponsiveNav
            visibleTab={visibleTab}
            onTabChange={onTabChange}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
          />
        ) : null}
        {overlay}
        {toastMessage ? <div className="toast" role="status">{toastMessage}</div> : null}
      </main>
    </div>
  );
}
