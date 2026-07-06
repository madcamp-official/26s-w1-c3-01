import { useEffect, useRef } from "react";

export function useModalA11y(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.setTimeout(() => {
      const target =
        dialogRef.current?.querySelector<HTMLElement>("input, select, textarea, button, [href], [tabindex]:not([tabindex='-1'])") ??
        dialogRef.current;
      target?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("modal-open");

    return () => {
      window.clearTimeout(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  return dialogRef;
}
