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
  mySeatIndex: number | null;
  setMySeatIndex: (i: number | null) => void;
  hoveredTile: number | null;
  // Sticky hover (set via tap on touch devices) — survives pointer-out so the
  // tooltip stays open until the user taps elsewhere.
  hoveredTileSticky: boolean;
  // Cursor/touch position captured at the moment a sticky hover was opened.
  // Used by the tooltip to anchor itself when no pointermove follows.
  hoveredTilePointerPos: { x: number; y: number } | null;
  setHoveredTile: (
    tileId: number | null,
    opts?: { sticky?: boolean; pointerPos?: { x: number; y: number } | null },
  ) => void;
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
  // Set by Tokens.tsx while a player's token is hopping across tiles. The
  // landing-modal scheduler in GameScreen waits for this to clear before
  // dispatching RESOLVE_LANDING, so the modal never appears mid-animation.
  movingTokenPlayerId: string | null;
  setMovingTokenPlayerId: (id: string | null) => void;
  // Registered by OnlineGameContainer while mounted. Hud's quitGame calls this
  // in online mode so the container can close the room server-side, notify
  // guests via broadcast, and clean up local state.
  quitOnlineHandler: (() => Promise<void>) | null;
  setQuitOnlineHandler: (fn: (() => Promise<void>) | null) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  phase: 'boot',
  setPhase: (phase) => set({ phase }),
  gameSource: 'local',
  setGameSource: (gameSource) => set({ gameSource }),
  activeRoomId: null,
  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),
  mySeatIndex: null,
  setMySeatIndex: (mySeatIndex) => set({ mySeatIndex }),
  hoveredTile: null,
  hoveredTileSticky: false,
  hoveredTilePointerPos: null,
  setHoveredTile: (hoveredTile, opts) =>
    set({
      hoveredTile,
      hoveredTileSticky: hoveredTile == null ? false : opts?.sticky ?? false,
      hoveredTilePointerPos: opts?.pointerPos ?? null,
    }),
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
  movingTokenPlayerId: null,
  setMovingTokenPlayerId: (movingTokenPlayerId) => set({ movingTokenPlayerId }),
  quitOnlineHandler: null,
  setQuitOnlineHandler: (quitOnlineHandler) => set({ quitOnlineHandler }),
}));
