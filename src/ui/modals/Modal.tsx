import { useEffect, useRef, type ReactNode } from 'react';
import { Parchment } from '@/ui/Parchment';

interface ModalProps {
  title: string;
  /** Small-caps category tag shown above the title (e.g. "Têxteis · Lancashire"). */
  label?: string;
  /** Whose turn it is. Rendered as a chip so the modal always identifies the actor. */
  actor?: { name: string; color?: string } | null;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  dismissible?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  title,
  label,
  actor,
  onClose,
  onConfirm,
  confirmLabel = 'OK',
  dismissible = true,
  children,
  footer,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const onConfirmRef = useRef(onConfirm);
  onCloseRef.current = onClose;
  onConfirmRef.current = onConfirm;

  // Focus only on mount — re-running this effect on every render (e.g. when
  // inline callbacks change identity) scrolls the dialog's scrollable container
  // back to the top while the user is scrolling.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape' && dismissible) onCloseRef.current?.();
      if (e.key === 'Enter' && onConfirmRef.current) onConfirmRef.current();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissible]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        // Atmospheric backdrop: deep vignette + blur. Reads as "the lamp dims,
        // the manuscript opens" instead of a flat alpha wash.
        background:
          'radial-gradient(ellipse at center, rgba(15, 9, 4, 0.72) 0%, rgba(5, 3, 1, 0.9) 100%)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        padding: 16,
        // Modal can be mounted inside containers that set pointer-events: none
        // (e.g. the HUD overlay). Re-enable here so the backdrop and dialog
        // always receive clicks regardless of where they're rendered.
        pointerEvents: 'auto',
        animation: 'indModalBackdrop 180ms ease-out',
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose?.();
      }}
    >
      <Parchment
        padding={28}
        framed
        elevation="hero"
        style={{
          width: 'min(560px, 100%)',
          maxHeight: '80vh',
          overflow: 'auto',
          animation: 'indModalEnter 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div ref={ref} tabIndex={-1} style={{ outline: 'none' }}>
          {label && (
            <div
              className="ind-label"
              style={{ marginBottom: 6, color: 'var(--ink-muted)' }}
            >
              {label}
            </div>
          )}
          {actor && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
                padding: '3px 9px',
                borderRadius: 999,
                background: 'rgba(26,14,6,0.08)',
                border: '1px solid rgba(26,14,6,0.25)',
                fontSize: '0.75rem',
                color: 'var(--ink-soft)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 8,
                  background: actor.color ?? '#c9943a',
                  boxShadow: '0 0 0 1px rgba(26,14,6,0.4)',
                }}
              />
              <span>
                Vez de <strong style={{ color: 'var(--ink)' }}>{actor.name}</strong>
              </span>
            </div>
          )}
          <h2 style={{ marginTop: 0, marginBottom: 10 }}>{title}</h2>
          {/* Brass divider between title and body */}
          <div
            aria-hidden="true"
            style={{
              height: 2,
              marginBottom: 16,
              background:
                'linear-gradient(90deg, rgba(138, 100, 34, 0.8) 0%, rgba(232, 194, 106, 0.9) 50%, rgba(138, 100, 34, 0.8) 100%)',
              borderRadius: 2,
              boxShadow: '0 1px 0 rgba(250, 226, 160, 0.35)',
            }}
          />
          <div style={{ margin: '0 0 20px', lineHeight: 1.55, color: 'var(--ink)' }}>
            {children}
          </div>
          <div
            style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}
          >
            {footer ?? (
              <>
                {dismissible && onClose && (
                  <button className="ghost" onClick={onClose} aria-label="Fechar">
                    Fechar
                  </button>
                )}
                {onConfirm && (
                  <button className="primary" onClick={onConfirm}>
                    {confirmLabel}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </Parchment>
    </div>
  );
}
