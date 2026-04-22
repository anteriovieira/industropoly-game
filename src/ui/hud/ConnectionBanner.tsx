export function ConnectionBanner({ connected }: { connected: boolean }) {
  if (connected) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        background: '#a64a14', color: '#fff', padding: '6px 12px',
        textAlign: 'center', zIndex: 200,
      }}
    >
      Reconectando…
    </div>
  );
}
