import { create, type StoreApi } from 'zustand';
import { toast } from 'sonner';
import type { Action, GameState } from '@/engine/types';
import type { InitialPlayerInput } from '@/engine/init';
import { ActionLog, type LoggedAction } from './actionLog';

// Harmless server rejections to silence (e.g. non-active players' auto-dispatches
// are rejected by the "not your turn" check and we don't want a toast for each).
const IGNORED_ERROR_PATTERNS = ['not your turn', 'not a member', 'room is not in_game'];

export interface OnlineGameStore {
  state: GameState | null;
  lastSeq: number;
  initialize: (seed: number, players: InitialPlayerInput[]) => void;
  dispatch: (action: Action) => void;
  applyRemoteAction: (entry: LoggedAction) => void;
  reset: () => void;
}

export interface OnlineGameStoreDeps {
  append: (action: Action) => Promise<number>;
}

export function createOnlineGameStore(deps: OnlineGameStoreDeps): StoreApi<OnlineGameStore> {
  let log: ActionLog | null = null;

  return create<OnlineGameStore>((set) => ({
    state: null,
    lastSeq: 0,

    initialize(seed, players) {
      log = new ActionLog(seed, players);
      set({ state: log.state, lastSeq: 0 });
    },

    dispatch(action) {
      void deps.append(action).catch((err) => {
        console.error('append_action failed', action, err);
        const message =
          err instanceof Error ? err.message : typeof err === 'string' ? err : 'Ação rejeitada pelo servidor';
        if (IGNORED_ERROR_PATTERNS.some((p) => message.toLowerCase().includes(p))) return;
        toast.error(message);
      });
    },

    applyRemoteAction(entry) {
      if (!log) return;
      log.apply(entry);
      set({ state: log.state, lastSeq: log.lastSeq });
    },

    reset() {
      log = null;
      set({ state: null, lastSeq: 0 });
    },
  }));
}
