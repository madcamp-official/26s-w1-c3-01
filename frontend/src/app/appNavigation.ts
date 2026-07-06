import type { Flow, Tab } from "./app.types";
import { appRoutes } from "./routes/appRoutes";

export type AppRouteState = {
  flow?: Flow;
  tab?: Tab;
  meetingId?: number;
  selectedPersonalMenuId?: number;
  selectedMeetingMenuId?: number;
};

export function readAppRoute(url = window.location.href): AppRouteState {
  const parsed = new URL(url);
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  const selectedPersonalMenuId = readPositiveNumber(parsed.searchParams.get("selectedMenuId"));
  const selectedMeetingMenuId = readPositiveNumber(parsed.searchParams.get("recommendationMenuId"));

  if (path === appRoutes.login) return { flow: "login" };
  if (path === appRoutes.signup) return { flow: "signup-name" };
  if (path === appRoutes.guest) return { flow: "guest-categories" };
  if (path === appRoutes.start || path === appRoutes.home) return { tab: "home" };
  if (path === appRoutes.preferences) return { tab: "preferences" };
  if (path === appRoutes.personalRecommendations) return { tab: "personal", selectedPersonalMenuId };
  if (path === appRoutes.meetings) return { tab: "meeting" };
  if (path.startsWith(`${appRoutes.meetings}/`)) {
    return {
      tab: "meeting",
      meetingId: readPositiveNumber(path.split("/")[2]),
      selectedMeetingMenuId
    };
  }
  if (path === appRoutes.history) return { tab: "history" };
  if (path === appRoutes.profile || path === "/me") return { tab: "profile" };

  return {};
}

export function buildAppUrl(state: {
  flow: Flow;
  activeTab: Tab;
  isGuestSession: boolean;
  selectedMeetingId?: number;
  selectedPersonalMenuId?: number;
  selectedMeetingMenuId?: number;
}) {
  if (state.flow !== "app") {
    if (state.flow === "login") return appRoutes.login;
    if (state.flow.startsWith("signup")) return appRoutes.signup;
    if (state.flow.startsWith("guest")) return appRoutes.guest;
    return appRoutes.start;
  }

  const tab = state.isGuestSession ? "meeting" : state.activeTab;
  if (tab === "home") return appRoutes.home;
  if (tab === "preferences") return appRoutes.preferences;
  if (tab === "personal") {
    const url = new URL(appRoutes.personalRecommendations, window.location.origin);
    if (state.selectedPersonalMenuId) url.searchParams.set("selectedMenuId", String(state.selectedPersonalMenuId));
    return `${url.pathname}${url.search}`;
  }
  if (tab === "meeting") {
    if (!state.selectedMeetingId) return appRoutes.meetings;
    const url = new URL(appRoutes.meetingDetail(state.selectedMeetingId), window.location.origin);
    if (state.selectedMeetingMenuId) url.searchParams.set("recommendationMenuId", String(state.selectedMeetingMenuId));
    return `${url.pathname}${url.search}`;
  }
  if (tab === "history") return appRoutes.history;
  if (tab === "profile") return appRoutes.profile;

  return appRoutes.home;
}

function readPositiveNumber(value: string | null | undefined) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : undefined;
}
