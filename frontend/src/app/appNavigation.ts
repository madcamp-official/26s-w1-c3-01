import type { Flow, Tab } from "./app.types";

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

  if (path === "/login") return { flow: "login" };
  if (path === "/signup") return { flow: "signup-name" };
  if (path === "/guest") return { flow: "guest-categories" };
  if (path === "/" || path === "/home") return { tab: "home" };
  if (path === "/preferences") return { tab: "preferences" };
  if (path === "/recommendations/personal") return { tab: "personal", selectedPersonalMenuId };
  if (path === "/meetings") return { tab: "meeting" };
  if (path.startsWith("/meetings/")) {
    return {
      tab: "meeting",
      meetingId: readPositiveNumber(path.split("/")[2]),
      selectedMeetingMenuId
    };
  }
  if (path === "/history") return { tab: "history" };
  if (path === "/profile" || path === "/me") return { tab: "profile" };

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
    if (state.flow === "login") return "/login";
    if (state.flow.startsWith("signup")) return "/signup";
    if (state.flow.startsWith("guest")) return "/guest";
    return "/";
  }

  const tab = state.isGuestSession ? "meeting" : state.activeTab;
  if (tab === "home") return "/home";
  if (tab === "preferences") return "/preferences";
  if (tab === "personal") {
    const url = new URL("/recommendations/personal", window.location.origin);
    if (state.selectedPersonalMenuId) url.searchParams.set("selectedMenuId", String(state.selectedPersonalMenuId));
    return `${url.pathname}${url.search}`;
  }
  if (tab === "meeting") {
    if (!state.selectedMeetingId) return "/meetings";
    const url = new URL(`/meetings/${state.selectedMeetingId}`, window.location.origin);
    if (state.selectedMeetingMenuId) url.searchParams.set("recommendationMenuId", String(state.selectedMeetingMenuId));
    return `${url.pathname}${url.search}`;
  }
  if (tab === "history") return "/history";
  if (tab === "profile") return "/profile";

  return "/home";
}

function readPositiveNumber(value: string | null | undefined) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : undefined;
}
