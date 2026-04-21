import { create } from 'zustand';

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

interface PwaStore {
  installPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  needRefresh: boolean;
  activateUpdate: (() => void) | null;
  offlineReady: boolean;
  setInstallPrompt: (e: BeforeInstallPromptEvent | null) => void;
  setInstalled: (v: boolean) => void;
  setNeedRefresh: (activate: () => void) => void;
  clearNeedRefresh: () => void;
  setOfflineReady: (v: boolean) => void;
}

export const usePwaStore = create<PwaStore>((set) => ({
  installPrompt: null,
  isInstalled: false,
  needRefresh: false,
  activateUpdate: null,
  offlineReady: false,
  setInstallPrompt: (installPrompt) => set({ installPrompt }),
  setInstalled: (isInstalled) => set({ isInstalled }),
  setNeedRefresh: (activate) => set({ needRefresh: true, activateUpdate: activate }),
  clearNeedRefresh: () => set({ needRefresh: false, activateUpdate: null }),
  setOfflineReady: (offlineReady) => set({ offlineReady }),
}));
