export function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <div className="spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
