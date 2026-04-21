import { create } from 'zustand';

export type Phase = 'boot' | 'intro' | 'setup' | 'game' | 'summary';
export type ShadowQuality = 'low' | 'medium' | 'high';

interface UiStore {
  phase: Phase;
  setPhase: (phase: Phase) => void;
  hoveredTile: number | null;
  setHoveredTile: (tileId: number | null) => void;
  shadowQuality: ShadowQuality;
  setShadowQuality: (q: ShadowQuality) => void;
  journalOpen: boolean;
  setJournalOpen: (open: boolean) => void;
  notice: string | null;
  setNotice: (notice: string | null) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  phase: 'boot',
  setPhase: (phase) => set({ phase }),
  hoveredTile: null,
  setHoveredTile: (hoveredTile) => set({ hoveredTile }),
  shadowQuality: 'medium',
  setShadowQuality: (shadowQuality) => set({ shadowQuality }),
  journalOpen: false,
  setJournalOpen: (journalOpen) => set({ journalOpen }),
  notice: null,
  setNotice: (notice) => set({ notice }),
}));
