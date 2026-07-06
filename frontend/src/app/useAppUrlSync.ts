import { useCallback, useEffect, useRef } from "react";
import type { DisplayRecommendation } from "../domain/mapper";
import { appUiStateStorage } from "../utils/storage";
import type { Flow, Tab } from "./app.types";
import { buildAppUrl, readAppRoute, type AppRouteState } from "./appNavigation";

type UseAppUrlSyncValue = {
  flow: Flow;
  activeTab: Tab;
  isGuestSession: boolean;
  selectedMeetingId?: number;
  selectedPersonalMenuId?: number;
  selectedMeetingMenuId?: number;
  personalRecommendations: DisplayRecommendation[];
  applyRouteState: (route: AppRouteState) => Promise<void>;
  setFlow: (flow: Flow) => void;
};

export function useAppUrlSync({
  flow,
  activeTab,
  isGuestSession,
  selectedMeetingId,
  selectedPersonalMenuId,
  selectedMeetingMenuId,
  personalRecommendations,
  applyRouteState,
  setFlow
}: UseAppUrlSyncValue) {
  const routeSyncReadyRef = useRef(false);
  const applyingPopStateRef = useRef(false);
  const lastSyncedUrlRef = useRef("");

  const markRouteSyncReady = useCallback(() => {
    routeSyncReadyRef.current = true;
  }, []);

  const resetRouteSyncReady = useCallback(() => {
    routeSyncReadyRef.current = false;
    lastSyncedUrlRef.current = "";
  }, []);

  useEffect(() => {
    if (flow === "app") {
      routeSyncReadyRef.current = true;
    }
  }, [flow]);

  useEffect(() => {
    if (flow !== "app") return;

    appUiStateStorage.patch({
      activeTab,
      selectedMeetingId,
      selectedPersonalMenuId,
      selectedMeetingMenuId,
      personalRecommendations: personalRecommendations.map((item) => ({
        menuId: item.menuId,
        menu: item.menu,
        score: item.score,
        reason: item.reason
      }))
    });
  }, [activeTab, flow, personalRecommendations, selectedMeetingId, selectedMeetingMenuId, selectedPersonalMenuId]);

  useEffect(() => {
    if (!routeSyncReadyRef.current || applyingPopStateRef.current) return;

    const nextUrl = buildAppUrl({
      flow,
      activeTab,
      isGuestSession,
      selectedMeetingId,
      selectedPersonalMenuId,
      selectedMeetingMenuId
    });

    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl === currentUrl || nextUrl === lastSyncedUrlRef.current) return;

    window.history.pushState({}, "", nextUrl);
    lastSyncedUrlRef.current = nextUrl;
  }, [activeTab, flow, isGuestSession, selectedMeetingId, selectedMeetingMenuId, selectedPersonalMenuId]);

  useEffect(() => {
    const handlePopState = () => {
      if (flow !== "app") {
        const route = readAppRoute();
        setFlow(route.flow ?? "start");
        return;
      }

      applyingPopStateRef.current = true;
      void applyRouteState(readAppRoute()).finally(() => {
        applyingPopStateRef.current = false;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [applyRouteState, flow, setFlow]);

  return { markRouteSyncReady, resetRouteSyncReady };
}
