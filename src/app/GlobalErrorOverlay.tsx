import { useEffect, useState } from 'react';

interface GlobalError {
  message: string;
  source: string;
  stack?: string;
}

// Catches anything `window.onerror` and `unhandledrejection` see — so async
// throws (font loading, fetch failures, WebGL context loss handlers, etc.)
// surface on screen even when no React ErrorBoundary catches them. Useful on
// tablets where the user has no console.
export function GlobalErrorOverlay() {
  const [errors, setErrors] = useState<GlobalError[]>([]);

  useEffect(() => {
    function onError(e: ErrorEvent): void {
      setErrors((prev) =>
        prev.concat({
          message: e.message || 'Unknown error',
          source: `${e.filename ?? '?'}:${e.lineno ?? '?'}:${e.colno ?? '?'}`,
          stack: e.error?.stack,
        }),
      );
    }
    function onRejection(e: PromiseRejectionEvent): void {
      const reason = e.reason;
      const message =
        reason instanceof Error
          ? `${reason.name}: ${reason.message}`
          : typeof reason === 'string'
            ? reason
            : JSON.stringify(reason);
      setErrors((prev) =>
        prev.concat({
          message,
          source: 'unhandledrejection',
          stack: reason instanceof Error ? reason.stack : undefined,
        }),
      );
    }
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  if (errors.length === 0) return null;
  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        maxHeight: '60vh',
        overflow: 'auto',
        background: 'rgba(26, 18, 10, 0.96)',
        color: '#f3e7c1',
        padding: 16,
        zIndex: 99999,
        fontFamily: 'monospace',
        fontSize: 12,
        borderBottom: '2px solid #f3a04a',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <strong style={{ color: '#f3a04a', fontSize: 14 }}>
          {errors.length} erro{errors.length > 1 ? 's' : ''} no app
        </strong>
        <button
          onClick={() => setErrors([])}
          style={{
            background: '#a0410d',
            color: '#fff',
            border: 'none',
            padding: '4px 10px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Fechar
        </button>
      </div>
      {errors.map((err, i) => (
        <div
          key={i}
          style={{
            marginBottom: 12,
            padding: 10,
            background: '#000',
            borderRadius: 4,
          }}
        >
          <div style={{ color: '#f3a04a', marginBottom: 4 }}>{err.message}</div>
          <div style={{ opacity: 0.7, fontSize: 11 }}>{err.source}</div>
          {err.stack && (
            <pre
              style={{
                margin: '6px 0 0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: 11,
                opacity: 0.85,
              }}
            >
              {err.stack}
            </pre>
          )}
        </div>
      ))}
      <div style={{ marginTop: 8, opacity: 0.6, fontSize: 11 }}>
        UA: {navigator.userAgent}
      </div>
    </div>
  );
}
