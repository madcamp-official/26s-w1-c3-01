import { useEffect } from "react";
import type { Flow, Tab } from "../../app/app.types";

type UseSelectedMeetingPollingValue = {
  flow: Flow;
  activeTab: Tab;
  selectedMeetingId?: number;
  syncSelectedMeeting: (options?: { silent?: boolean }) => Promise<void>;
};

export function useSelectedMeetingPolling({
  flow,
  activeTab,
  selectedMeetingId,
  syncSelectedMeeting
}: UseSelectedMeetingPollingValue) {
  useEffect(() => {
    if (flow !== "app" || activeTab !== "meeting" || !selectedMeetingId) return;

    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      void syncSelectedMeeting({ silent: true });
    };

    const intervalId = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [activeTab, flow, selectedMeetingId, syncSelectedMeeting]);
}
