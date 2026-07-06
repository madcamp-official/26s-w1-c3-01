export const appRoutes = {
  start: "/",
  login: "/login",
  signup: "/signup",
  guest: "/guest",
  home: "/home",
  preferences: "/preferences",
  personalRecommendations: "/recommendations/personal",
  meetings: "/meetings",
  meetingDetail: (meetingId: number) => `/meetings/${meetingId}`,
  history: "/history",
  profile: "/profile"
} as const;
