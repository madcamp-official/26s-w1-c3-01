import type { ApiStatus } from "../../app/app.types";

type ApiFeedbackProps = {
  status: ApiStatus;
  error?: string;
  compact?: boolean;
};

export function ApiFeedback({ status, error, compact = false }: ApiFeedbackProps) {
  if (status === "loading" || status === "authenticating") {
    return (
      <div className={`api-feedback ${compact ? "compact" : ""}`} role="status" aria-live="polite">
        데이터를 동기화하고 있습니다.
      </div>
    );
  }

  if (status === "error" && error) {
    return (
      <div className={`api-feedback error ${compact ? "compact" : ""}`} role="alert">
        {error}
      </div>
    );
  }

  return null;
}
