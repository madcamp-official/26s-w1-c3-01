type LoadingOverlayProps = {
  active: boolean;
  label?: string;
};

export const loadingImagePath = "/loading.webp";

export function LoadingOverlay({ active, label = "잠시만 기다려 주세요" }: LoadingOverlayProps) {
  if (!active) return null;

  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="loading-overlay-panel">
        <img src={loadingImagePath} alt="" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function preloadLoadingGif() {
  const image = new Image();
  image.src = loadingImagePath;
}
