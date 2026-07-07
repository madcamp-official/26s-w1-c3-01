import { useCallback, useEffect, useRef, useState } from "react";

const TOAST_DURATION_MS = 2200;

export function useToast() {
  const timeoutRef = useRef<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const clearToast = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToastMessage("");
  }, []);

  const showToast = useCallback((message: string) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setToastMessage(message);
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setToastMessage("");
    }, TOAST_DURATION_MS);
  }, []);

  useEffect(() => clearToast, [clearToast]);

  return {
    toastMessage,
    showToast,
    clearToast
  };
}
