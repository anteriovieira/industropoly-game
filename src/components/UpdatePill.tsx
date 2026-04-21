import { usePwaStore } from '@/pwa/pwaStore';

export function UpdatePill() {
  const needRefresh = usePwaStore((s) => s.needRefresh);
  const activateUpdate = usePwaStore((s) => s.activateUpdate);
  const clearNeedRefresh = usePwaStore((s) => s.clearNeedRefresh);

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        background: '#0F3B3A',
        color: '#F5E9D3',
        padding: '8px 12px 8px 14px',
        borderRadius: 999,
        border: '1px solid #E2B049',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: '0.88rem',
        boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
        zIndex: 150,
      }}
    >
      <span>Nova versão disponível</span>
      <button
        type="button"
        onClick={() => activateUpdate?.()}
        style={{
          background: '#E2B049',
          color: '#0F3B3A',
          border: 'none',
          padding: '4px 10px',
          borderRadius: 999,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Recarregar
      </button>
      <button
        type="button"
        onClick={clearNeedRefresh}
        aria-label="Dispensar"
        style={{
          background: 'transparent',
          color: '#F5E9D3',
          border: 'none',
          padding: '2px 6px',
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
