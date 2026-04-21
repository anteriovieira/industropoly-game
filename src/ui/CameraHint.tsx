import { useEffect, useState } from 'react';

const STORAGE_KEY = 'industropoly:hint:camera:dismissed';
const AUTO_HIDE_MS = 8000;

// Small one-time hint explaining the map-style camera controls.
// Dismissed on click, auto-hides after a few seconds, and never re-shows once dismissed.
export function CameraHint() {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dismiss(), AUTO_HIDE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function dismiss(): void {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={dismiss}
      aria-label="Dispensar dica"
      style={{
        position: 'fixed',
        top: 'max(80px, 10vh)',
        right: 16,
        maxWidth: 260,
        padding: '10px 14px',
        background: 'rgba(243, 231, 193, 0.95)',
        border: '1px solid rgba(59, 43, 24, 0.45)',
        color: 'var(--ink)',
        borderRadius: 10,
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        textAlign: 'left',
        fontFamily: 'var(--font-body)',
        fontSize: '0.82rem',
        lineHeight: 1.35,
        cursor: 'pointer',
        zIndex: 30,
      }}
    >
      <strong style={{ display: 'block', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
        Dica de câmera
      </strong>
      <span>Arraste para mover o mapa · botão direito gira · scroll aproxima.</span>
      <span style={{ display: 'block', marginTop: 6, opacity: 0.7, fontSize: '0.72rem' }}>
        (toque para fechar)
      </span>
    </button>
  );
}
