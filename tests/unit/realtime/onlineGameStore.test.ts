import { describe, it, expect, vi } from 'vitest';
import { createOnlineGameStore } from '@/realtime/onlineGameStore';
import type { Action } from '@/engine/types';

const PLAYERS = [
  { name: 'Ada', token: 'locomotive' as const },
  { name: 'Babbage', token: 'top-hat' as const },
];
const SEED = 12345;

describe('createOnlineGameStore', () => {
  it('starts with no state', () => {
    const append = vi.fn(async () => 1);
    const store = createOnlineGameStore({ append });
    expect(store.getState().state).toBeNull();
  });

  it('initialize() seeds the state from seed+players', () => {
    const append = vi.fn(async () => 1);
    const store = createOnlineGameStore({ append });
    store.getState().initialize(SEED, PLAYERS);
    expect(store.getState().state).not.toBeNull();
    expect(store.getState().state!.players).toHaveLength(2);
  });

  it('dispatch() calls append but does NOT apply locally', () => {
    const append = vi.fn(async () => 1);
    const store = createOnlineGameStore({ append });
    store.getState().initialize(SEED, PLAYERS);
    const before = store.getState().state;
    store.getState().dispatch({ type: 'ROLL_DICE' });
    expect(append).toHaveBeenCalledWith({ type: 'ROLL_DICE' });
    expect(store.getState().state).toBe(before);
  });

  it('applyRemoteAction({ seq, action }) advances state in order', () => {
    const append = vi.fn(async () => 1);
    const store = createOnlineGameStore({ append });
    store.getState().initialize(SEED, PLAYERS);
    const before = store.getState().state!;
    store.getState().applyRemoteAction({ seq: 1, action: { type: 'ROLL_DICE' } as Action });
    expect(store.getState().state).not.toBe(before);
    expect(store.getState().lastSeq).toBe(1);
  });

  it('applyRemoteAction buffers out-of-order entries', () => {
    const append = vi.fn(async () => 1);
    const store = createOnlineGameStore({ append });
    store.getState().initialize(SEED, PLAYERS);
    store.getState().applyRemoteAction({ seq: 2, action: { type: 'ROLL_DICE' } as Action });
    expect(store.getState().lastSeq).toBe(0);
    store.getState().applyRemoteAction({ seq: 1, action: { type: 'ROLL_DICE' } as Action });
    expect(store.getState().lastSeq).toBe(2);
  });
});
