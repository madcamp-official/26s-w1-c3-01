import { useCallback, useState } from "react";
import { readNumber, readString } from "../../domain/mapper";

export function useAuthProfile() {
  const [profileName, setProfileName] = useState("밥");
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [isGuestSession, setIsGuestSession] = useState(false);
  const [isOAuthOnboarding, setIsOAuthOnboarding] = useState(false);

  const applyUserPayload = useCallback((payload: unknown) => {
    const user = (payload as any)?.user ?? payload;
    setProfileName(readString(user, ["nickname", "name", "email"]) ?? "밥");
    setProfileUserId(readNumber(user, ["userId", "user_id", "id"]) ?? null);
  }, []);

  const resetAuthProfile = useCallback(() => {
    setProfileName("밥");
    setProfileUserId(null);
    setIsGuestSession(false);
    setIsOAuthOnboarding(false);
  }, []);

  return {
    profileName,
    setProfileName,
    profileUserId,
    setProfileUserId,
    isGuestSession,
    setIsGuestSession,
    isOAuthOnboarding,
    setIsOAuthOnboarding,
    applyUserPayload,
    resetAuthProfile
  };
}
