// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInstallPrompt, detectIsIOS } from '@/pwa/useInstallPrompt';
import { usePwaStore, type BeforeInstallPromptEvent } from '@/pwa/pwaStore';

function makePromptEvent(outcome: 'accepted' | 'dismissed'): BeforeInstallPromptEvent {
  const e = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
  e.prompt = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(e, 'userChoice', {
    value: Promise.resolve({ outcome, platform: 'web' }),
  });
  return e;
}

describe('useInstallPrompt', () => {
  beforeEach(() => {
    usePwaStore.setState({ installPrompt: null, isInstalled: false });
    // jsdom doesn't implement matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it('captures beforeinstallprompt and exposes canInstall === true', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);

    const evt = makePromptEvent('accepted');
    act(() => {
      window.dispatchEvent(evt);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('clears canInstall after user accepts the prompt', async () => {
    const evt = makePromptEvent('accepted');
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      window.dispatchEvent(evt);
    });
    expect(result.current.canInstall).toBe(true);

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(true);
  });

  it('clears canInstall when appinstalled fires', () => {
    const evt = makePromptEvent('accepted');
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      window.dispatchEvent(evt);
    });
    expect(result.current.canInstall).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(true);
  });

  it('promptInstall returns "unavailable" when no event was captured', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const outcome = await result.current.promptInstall();
    expect(outcome).toBe('unavailable');
  });

  it('detectIsIOS returns true for iPhone UA', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1';
    expect(detectIsIOS(ua)).toBe(true);
  });

  it('detectIsIOS returns false for a plain desktop Chrome UA', () => {
    const ua =
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
    expect(detectIsIOS(ua)).toBe(false);
  });
});
