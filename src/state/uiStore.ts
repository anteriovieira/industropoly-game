import { create } from 'zustand';

export type Phase = 'boot' | 'intro' | 'setup' | 'online-lobby' | 'online-room' | 'game' | 'summary';
export type ShadowQuality = 'low' | 'medium' | 'high';

interface UiStore {
  phase: Phase;
  setPhase: (phase: Phase) => void;
  gameSource: 'local' | 'online';
  setGameSource: (s: 'local' | 'online') => void;
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  hoveredTile: number | null;
  setHoveredTile: (tileId: number | null) => void;
  shadowQuality: ShadowQuality;
  setShadowQuality: (q: ShadowQuality) => void;
  journalOpen: boolean;
  setJournalOpen: (open: boolean) => void;
  storyOpen: boolean;
  setStoryOpen: (open: boolean) => void;
  acquisitionsOpen: boolean;
  setAcquisitionsOpen: (open: boolean) => void;
  acquisitionsFocusPlayerId: string | null;
  openAcquisitionsForPlayer: (playerId: string) => void;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  notice: string | null;
  setNotice: (notice: string | null) => void;
  cameraResetNonce: number;
  resetCamera: () => void;
  cameraFocusTileId: number | null;
  cameraFocusNonce: number;
  focusCameraOnTile: (tileId: number) => void;
  diceDragging: boolean;
  setDiceDragging: (dragging: boolean) => void;
  // Bumped whenever a dice roll starts — used by the 3D scene to trigger a
  // brief camera zoom-punch ("anticipation"). Not persisted.
  diceRollNonce: number;
  bumpDiceRoll: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  phase: 'boot',
  setPhase: (phase) => set({ phase }),
  gameSource: 'local',
  setGameSource: (gameSource) => set({ gameSource }),
  activeRoomId: null,
  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),
  hoveredTile: null,
  setHoveredTile: (hoveredTile) => set({ hoveredTile }),
  shadowQuality: 'medium',
  setShadowQuality: (shadowQuality) => set({ shadowQuality }),
  journalOpen: false,
  setJournalOpen: (journalOpen) => set({ journalOpen }),
  storyOpen: false,
  setStoryOpen: (storyOpen) => set({ storyOpen }),
  acquisitionsOpen: false,
  setAcquisitionsOpen: (acquisitionsOpen) =>
    set(acquisitionsOpen ? { acquisitionsOpen } : { acquisitionsOpen, acquisitionsFocusPlayerId: null }),
  acquisitionsFocusPlayerId: null,
  openAcquisitionsForPlayer: (playerId) =>
    set({ acquisitionsOpen: true, acquisitionsFocusPlayerId: playerId }),
  historyOpen: false,
  setHistoryOpen: (historyOpen) => set({ historyOpen }),
  notice: null,
  setNotice: (notice) => set({ notice }),
  cameraResetNonce: 0,
  resetCamera: () => set((s) => ({ cameraResetNonce: s.cameraResetNonce + 1 })),
  cameraFocusTileId: null,
  cameraFocusNonce: 0,
  focusCameraOnTile: (tileId) =>
    set((s) => ({ cameraFocusTileId: tileId, cameraFocusNonce: s.cameraFocusNonce + 1 })),
  diceDragging: false,
  setDiceDragging: (diceDragging) => set({ diceDragging }),
  diceRollNonce: 0,
  bumpDiceRoll: () => set((s) => ({ diceRollNonce: s.diceRollNonce + 1 })),
}));
