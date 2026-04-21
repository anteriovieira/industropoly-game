import type { GameState } from '@/engine/types';

const KEY = 'industropoly:savegame:v2';
const CURRENT_SCHEMA = 2;
const LEGACY_KEYS = ['industropoly:savegame:v1'];
const MAX_BYTES = 2 * 1024 * 1024;

export interface LoadResult {
  state: GameState | null;
  notice: string | null;
}

// Pure, unit-testable loader: given a raw JSON string (or null), return the
// migration decision. Useful for tests that don't want to touch localStorage.
export function parseSave(raw: string | null): LoadResult {
  if (!raw) return { state: null, notice: null };
  try {
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (typeof parsed !== 'object' || parsed === null) throw new Error('corrupt');
    if (parsed.schemaVersion !== CURRENT_SCHEMA) {
      return { state: null, notice: 'Formato de save atualizado — começando um novo jogo.' };
    }
    // Hydrate fields added after the schemaVersion was minted (additive, no
    // schema bump). Saves predating add-board-center-story lack these.
    const hydrated = parsed as GameState & { currentStoryId?: unknown; lastResolvedTileId?: unknown };
    if (hydrated.currentStoryId === undefined) hydrated.currentStoryId = null;
    if (hydrated.lastResolvedTileId === undefined) hydrated.lastResolvedTileId = null;
    return { state: hydrated as GameState, notice: null };
  } catch {
    return { state: null, notice: 'Jogo salvo corrompido — começando um novo.' };
  }
}

export function load(): LoadResult {
  // Drop legacy-schema saves up front so they don't linger between sessions.
  for (const legacy of LEGACY_KEYS) {
    try {
      if (localStorage.getItem(legacy) != null) localStorage.removeItem(legacy);
    } catch {
      // ignore
    }
  }
  try {
    const raw = localStorage.getItem(KEY);
    const result = parseSave(raw);
    if (result.notice != null) {
      try {
        localStorage.removeItem(KEY);
      } catch {
        // ignore
      }
    }
    return result;
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
