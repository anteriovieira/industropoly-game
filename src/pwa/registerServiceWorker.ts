import { Workbox } from 'workbox-window';

type Hooks = {
  onNeedRefresh?: (activate: () => void) => void;
  onOfflineReady?: () => void;
};

let wb: Workbox | null = null;

export function getWorkbox(): Workbox | null {
  return wb;
}

export function registerServiceWorker(hooks: Hooks = {}) {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  wb = new Workbox(swUrl, { scope: import.meta.env.BASE_URL });

  wb.addEventListener('waiting', () => {
    hooks.onNeedRefresh?.(() => {
      wb?.addEventListener('controlling', () => window.location.reload());
      wb?.messageSkipWaiting();
    });
  });

  wb.addEventListener('activated', (event) => {
    if (!event.isUpdate) hooks.onOfflineReady?.();
  });

  wb.register().catch((err) => {
    console.warn('[pwa] service worker registration failed', err);
  });
}
