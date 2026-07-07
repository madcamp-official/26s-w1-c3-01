import { useEffect } from "react";
import type { Flow } from "../../app/app.types";

type UseSelectedMeetingPollingValue = {
  flow: Flow;
  selectedMeetingId?: number;
  syncSelectedMeeting: (options?: { silent?: boolean }) => Promise<void>;
};

export function useSelectedMeetingPolling({
  flow,
  selectedMeetingId,
  syncSelectedMeeting
}: UseSelectedMeetingPollingValue) {
  useEffect(() => {
    if (flow !== "app" || !selectedMeetingId) return;

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
  }, [flow, selectedMeetingId, syncSelectedMeeting]);
}
