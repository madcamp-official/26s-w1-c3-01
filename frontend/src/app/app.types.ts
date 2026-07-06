export type Tab = "home" | "preferences" | "personal" | "meeting" | "history" | "profile";

export type Flow =
  | "start"
  | "login"
  | "signup-name"
  | "signup-email-sent"
  | "signup-categories"
  | "signup-tags"
  | "signup-allergies"
  | "signup-recent-penalty"
  | "signup-complete"
  | "guest-display-name"
  | "guest-categories"
  | "guest-tags"
  | "guest-allergies"
  | "guest-join-meeting"
  | "app";

export type ApiStatus = "idle" | "authenticating" | "loading" | "ready" | "error";
