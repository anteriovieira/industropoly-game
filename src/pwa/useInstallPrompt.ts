import { useEffect } from 'react';
import { usePwaStore, type BeforeInstallPromptEvent } from './pwaStore';

export function detectIsIOS(ua: string = navigator.userAgent): boolean {
  // iOS Safari never fires beforeinstallprompt; detect it so we can show guidance.
  // Also catches iPadOS (where UA no longer advertises "iPad" but does advertise Mac + touch).
  const isiPadOS =
    /Macintosh/.test(ua) &&
    typeof navigator !== 'undefined' &&
    (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints != null &&
    ((navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints ?? 0) > 1;
  return /iPhone|iPad|iPod/.test(ua) || isiPadOS;
}

export function detectIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia?.('(display-mode: standalone)');
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mq?.matches) || iosStandalone;
}

export interface InstallPromptApi {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

export function useInstallPrompt(): InstallPromptApi {
  const installPrompt = usePwaStore((s) => s.installPrompt);
  const isInstalled = usePwaStore((s) => s.isInstalled);
  const setInstallPrompt = usePwaStore((s) => s.setInstallPrompt);
  const setInstalled = usePwaStore((s) => s.setInstalled);

  useEffect(() => {
    setInstalled(detectIsStandalone());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setInstalled(true);
    };
    const mq = window.matchMedia('(display-mode: standalone)');
    const onDisplayChange = () => setInstalled(detectIsStandalone());

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    mq.addEventListener?.('change', onDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      mq.removeEventListener?.('change', onDisplayChange);
    };
  }, [setInstallPrompt, setInstalled]);

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!installPrompt) return 'unavailable';
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === 'accepted') setInstalled(true);
    return choice.outcome;
  };

  return {
    canInstall: Boolean(installPrompt) && !isInstalled,
    isInstalled,
    isIOS: detectIsIOS(),
    promptInstall,
  };
}
