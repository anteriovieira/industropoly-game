import { useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { useGameStore } from '@/state/gameStore';

// Bridges the engine's `state.log` (append-only string[]) to sonner toasts.
// Each new log entry fires one toast in the top-right corner.
export function GameToaster() {
  const log = useGameStore((s) => s.state?.log);
  const lastLenRef = useRef<number>(log?.length ?? 0);

  useEffect(() => {
    if (!log) {
      lastLenRef.current = 0;
      return;
    }
    const prev = lastLenRef.current;
    if (log.length > prev) {
      for (let i = prev; i < log.length; i++) {
        const msg = log[i];
        if (msg) toast(msg);
      }
    }
    lastLenRef.current = log.length;
  }, [log]);

  return (
    <Toaster
      position="top-right"
      duration={30000}
      visibleToasts={4}
      closeButton
      gap={8}
      icons={{ success: null, info: null, warning: null, error: null, loading: null }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'industropoly-toast',
          title: 'industropoly-toast-title',
          closeButton: 'industropoly-toast-close',
        },
      }}
    />
  );
}
