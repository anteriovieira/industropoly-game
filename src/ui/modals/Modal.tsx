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
  useEffect(() => {
    ref.current?.focus();
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape' && dismissible) onClose?.();
      if (e.key === 'Enter' && onConfirm) onConfirm();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissible, onClose, onConfirm]);

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
