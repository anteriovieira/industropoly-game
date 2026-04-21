import { create } from 'zustand';
import { audio } from '@/lib/audio';

const STORAGE_KEY = 'industropoly:audio:muted';

function initialMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

interface AudioStore {
  muted: boolean;
  toggleMuted: () => void;
  setMuted: (muted: boolean) => void;
}

export const useAudioStore = create<AudioStore>((set, get) => {
  const initial = typeof window !== 'undefined' ? initialMuted() : false;
  audio.setMuted(initial);
  return {
    muted: initial,
    toggleMuted: () => get().setMuted(!get().muted),
    setMuted: (muted) => {
      audio.setMuted(muted);
      try {
        localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
      } catch {
        // ignore storage failures
      }
      set({ muted });
    },
  };
});
