import type { GameState } from '@/engine/types';

const KEY = 'industropoly:savegame:v1';
const CURRENT_SCHEMA = 1;
const MAX_BYTES = 2 * 1024 * 1024;

export interface LoadResult {
  state: GameState | null;
  notice: string | null;
}

export function load(): LoadResult {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { state: null, notice: null };
    const parsed = JSON.parse(raw) as GameState;
    if (typeof parsed !== 'object' || parsed === null) throw new Error('corrupt');
    if (parsed.schemaVersion !== CURRENT_SCHEMA) {
      localStorage.removeItem(KEY);
      return { state: null, notice: 'Jogo salvo incompatível — começando um novo.' };
    }
    return { state: parsed, notice: null };
  } catch {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    return { state: null, notice: 'Jogo salvo corrompido — começando um novo.' };
  }
}

export function save(state: GameState): void {
  try {
    const payload = JSON.stringify(state);
    if (payload.length > MAX_BYTES) {
      // Trim non-essential fields (log, journal) to keep engine state round-tripable.
      const trimmed: GameState = { ...state, log: state.log.slice(-50), factsJournal: state.factsJournal };
      const trimmedJson = JSON.stringify(trimmed);
      if (trimmedJson.length > MAX_BYTES) {
        // eslint-disable-next-line no-console
        console.warn('Save exceeds 2 MB; omitting journal.');
        const minimal: GameState = { ...trimmed, factsJournal: [] };
        localStorage.setItem(KEY, JSON.stringify(minimal));
        return;
      }
      localStorage.setItem(KEY, trimmedJson);
      return;
    }
    localStorage.setItem(KEY, payload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to save game:', err);
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

let raf: number | null = null;
export function subscribeAutosave(getState: () => GameState | null): () => void {
  function schedule(): void {
    if (raf != null) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const s = getState();
      if (s) save(s);
    });
  }
  // The caller should call schedule() on every dispatch.
  return schedule;
}
