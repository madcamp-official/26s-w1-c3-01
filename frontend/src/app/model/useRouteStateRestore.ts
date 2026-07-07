import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { AppRouteState } from "../appNavigation";
import type { Tab } from "../app.types";
import { errorMessage } from "../appUtils";
import type { StoredRecommendation } from "../../utils/storage";
import { appUiStateStorage } from "../../utils/storage";

type UseRouteStateRestoreValue = {
  setActiveTab: Dispatch<SetStateAction<Tab>>;
  clearActiveMeetingState: () => void;
  restoreMeetingDetail: (meetingId: number, selectedMenuId?: number) => Promise<unknown>;
  restorePersonalRecommendations: (
    storedRecommendations: StoredRecommendation[] | undefined,
    selectedMenuId?: number
  ) => unknown;
  setApiError: Dispatch<SetStateAction<string>>;
};

export function useRouteStateRestore({
  setActiveTab,
  clearActiveMeetingState,
  restoreMeetingDetail,
  restorePersonalRecommendations,
  setApiError
}: UseRouteStateRestoreValue) {
  const applyRouteState = useCallback(
    async (route: AppRouteState, options: { restoreStoredFallback?: boolean } = {}) => {
      const stored = appUiStateStorage.get();
      const nextTab = route.tab ?? (options.restoreStoredFallback ? stored.activeTab : undefined);
      const selectedMeetingId =
        route.meetingId ?? (options.restoreStoredFallback ? stored.selectedMeetingId : undefined);
      const selectedPersonalMenuId =
        route.selectedPersonalMenuId ?? (options.restoreStoredFallback ? stored.selectedPersonalMenuId : undefined);
      const selectedMeetingMenuId =
        route.selectedMeetingMenuId ?? (options.restoreStoredFallback ? stored.selectedMeetingMenuId : undefined);

      if (nextTab) setActiveTab(nextTab);

      if (nextTab !== "meeting" || !selectedMeetingId) {
        if (nextTab === "meeting") clearActiveMeetingState();
      } else {
        try {
          setActiveTab("meeting");
          await restoreMeetingDetail(selectedMeetingId, selectedMeetingMenuId);
        } catch (error) {
          clearActiveMeetingState();
          setApiError(errorMessage(error));
        }
      }

      if (nextTab === "personal") {
        restorePersonalRecommendations(stored.personalRecommendations, selectedPersonalMenuId);
      }
    },
    [clearActiveMeetingState, restoreMeetingDetail, restorePersonalRecommendations, setActiveTab, setApiError]
  );

  return { applyRouteState };
}
