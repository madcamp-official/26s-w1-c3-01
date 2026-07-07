import { useRef, useState } from "react";
import type { Flow } from "../../app/app.types";
import type { LoginCredentials, SignupCredentials } from "./AuthFlow";

export function useAuthFlowState() {
  const restoreAttemptedRef = useRef(false);
  const [flow, setFlow] = useState<Flow>("start");
  const [nickname, setNickname] = useState("");
  const [signupCredentials, setSignupCredentials] = useState<SignupCredentials>({
    email: "",
    password: "",
    passwordConfirm: ""
  });
  const [loginCredentials, setLoginCredentials] = useState<LoginCredentials>({ email: "", password: "" });
  const [guestDisplayName, setGuestDisplayName] = useState("");
  const [guestMeetingId, setGuestMeetingId] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  return {
    restoreAttemptedRef,
    flow,
    setFlow,
    nickname,
    setNickname,
    signupCredentials,
    setSignupCredentials,
    loginCredentials,
    setLoginCredentials,
    guestDisplayName,
    setGuestDisplayName,
    guestMeetingId,
    setGuestMeetingId,
    authBusy,
    setAuthBusy,
    authError,
    setAuthError
  };
}
