import { create, type StoreApi } from 'zustand';
import { toast } from 'sonner';
import type { Action, GameOptions, GameState } from '@/engine/types';
import type { InitialPlayerInput } from '@/engine/init';
import { ActionLog, type LoggedAction } from './actionLog';

// Harmless server rejections to silence (e.g. non-active players' auto-dispatches
// are rejected by the "not your turn" check and we don't want a toast for each).
const IGNORED_ERROR_PATTERNS = ['not your turn', 'not a member', 'room is not in_game'];

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    // PostgrestError shape: { message, code, details, hint }
    const e = err as { message?: string; hint?: string; details?: string; code?: string };
    if (e.message) return e.hint ? `${e.message} (${e.hint})` : e.message;
    if (e.details) return e.details;
    if (e.code) return `erro ${e.code}`;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Ação rejeitada pelo servidor';
}

export interface OnlineGameStore {
  state: GameState | null;
  lastSeq: number;
  initialize: (seed: number, players: InitialPlayerInput[], options?: GameOptions) => void;
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

    initialize(seed, players, options) {
      log = new ActionLog(seed, players, options);
      set({ state: log.state, lastSeq: 0 });
    },

    dispatch(action) {
      void deps.append(action).catch((err) => {
        console.error('append_action failed', action, err);
        const message = extractErrorMessage(err);
        if (IGNORED_ERROR_PATTERNS.some((p) => message.toLowerCase().includes(p))) return;
        toast.error(`${action.type}: ${message}`);
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
