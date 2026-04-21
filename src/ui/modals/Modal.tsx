import { useEffect, useRef, type ReactNode } from 'react';
import { Parchment } from '@/ui/Parchment';

interface ModalProps {
  title: string;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  dismissible?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  title,
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
        background: 'rgba(26, 18, 10, 0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        padding: 16,
        // Modal can be mounted inside containers that set pointer-events: none
        // (e.g. the HUD overlay). Re-enable here so the backdrop and dialog
        // always receive clicks regardless of where they're rendered.
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose?.();
      }}
    >
      <Parchment
        padding={24}
        style={{ width: 'min(560px, 100%)', maxHeight: '80vh', overflow: 'auto' }}
      >
        <div ref={ref} tabIndex={-1} style={{ outline: 'none' }}>
          <h2 style={{ marginTop: 0 }}>{title}</h2>
          <div style={{ margin: '12px 0 20px', lineHeight: 1.5 }}>{children}</div>
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
