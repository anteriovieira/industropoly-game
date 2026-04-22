import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Action, GameOptions, GameState } from '@/engine/types';
import { reducer } from '@/engine/reducer';
import { createInitialState, type InitialPlayerInput } from '@/engine/init';

interface GameStore {
  state: GameState | null;
  dispatch: (action: Action) => void;
  newGame: (players: InitialPlayerInput[], seed?: number, options?: GameOptions) => void;
  loadState: (state: GameState) => void;
  clear: () => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    state: null,
    dispatch: (action) => {
      const prev = get().state;
      if (!prev) return;
      const next = reducer(prev, action);
      if (next !== prev) set({ state: next });
    },
    newGame: (players, seed = Math.floor(Math.random() * 0xffffffff), options) => {
      set({ state: createInitialState(players, seed, options) });
    },
    loadState: (state) => set({ state }),
    clear: () => set({ state: null }),
  })),
);
