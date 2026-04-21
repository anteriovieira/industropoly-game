import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/engine/init';
import { reducer } from '@/engine/reducer';
import { computeRent } from '@/engine/selectors';
import type { GameState, TokenKind } from '@/engine/types';
import { TILES } from '@/content/tiles';

function mkState(seed = 1, tokens: TokenKind[] = ['locomotive', 'top-hat']): GameState {
  return createInitialState(
    tokens.map((t, i) => ({ name: `P${i + 1}`, token: t })),
    seed,
  );
}

describe('engine init', () => {
  it('rejects <2 or >4 players', () => {
    expect(() =>
      createInitialState([{ name: 'a', token: 'locomotive' }], 1),
    ).toThrow(/2.4 players/);
    expect(() =>
      createInitialState(
        [
          { name: 'a', token: 'locomotive' },
          { name: 'b', token: 'top-hat' },
          { name: 'c', token: 'cotton-bobbin' },
          { name: 'd', token: 'pickaxe' },
          { name: 'e', token: 'pocket-watch' },
        ],
        1,
      ),
    ).toThrow();
  });

  it('rejects duplicate tokens', () => {
    expect(() =>
      createInitialState(
        [
          { name: 'a', token: 'locomotive' },
          { name: 'b', token: 'locomotive' },
        ],
        1,
      ),
    ).toThrow(/Duplicate token/);
  });

  it('initializes all tiles as unowned', () => {
    const s = mkState();
    for (const t of TILES) expect(s.tiles[t.id]!.owner).toBeNull();
    expect(s.status).toBe('active');
    expect(s.activePlayerIndex).toBe(0);
  });

  it('shuffles both decks deterministically per seed', () => {
    const a = mkState(12345);
    const b = mkState(12345);
    expect(a.decks.invention.draw).toEqual(b.decks.invention.draw);
    expect(a.decks.edict.draw).toEqual(b.decks.edict.draw);
  });
});

describe('engine actions', () => {
  it('ROLL_DICE updates lastRoll and transitions to moving', () => {
    const s = mkState();
    const r = reducer(s, { type: 'ROLL_DICE' });
    expect(r.lastRoll).not.toBeNull();
    expect(r.turnPhase).toBe('moving');
    expect(r.lastRoll!.total).toBeGreaterThanOrEqual(2);
    expect(r.lastRoll!.total).toBeLessThanOrEqual(12);
  });

  it('RESOLVE_MOVEMENT advances the active token by roll total', () => {
    let s = mkState();
    s = reducer(s, { type: 'ROLL_DICE' });
    const roll = s.lastRoll!.total;
    s = reducer(s, { type: 'RESOLVE_MOVEMENT' });
    expect(s.players[0]!.position).toBe(roll % 40);
    expect(s.turnPhase).toBe('awaiting-land-action');
  });

  it('BUY_TILE transfers ownership and deducts cash', () => {
    let s = mkState();
    s = {
      ...s,
      turnPhase: 'awaiting-land-action',
      players: s.players.map((p, i) => (i === 0 ? { ...p, position: 1 } : p)),
    };
    s = reducer(s, { type: 'RESOLVE_LANDING' });
    const before = s.players[0]!.cash;
    const tile = TILES[1]!;
    s = reducer(s, { type: 'BUY_TILE' });
    expect(s.tiles[1]!.owner).toBe('p1');
    expect(s.players[0]!.cash).toBe(before - ('price' in tile ? tile.price : 0));
    expect(s.turnPhase).toBe('awaiting-end-turn');
  });

  it('DECLINE_BUY leaves tile unowned and ends landing', () => {
    let s = mkState();
    s = {
      ...s,
      turnPhase: 'awaiting-land-action',
      players: s.players.map((p, i) => (i === 0 ? { ...p, position: 1 } : p)),
    };
    s = reducer(s, { type: 'RESOLVE_LANDING' });
    s = reducer(s, { type: 'DECLINE_BUY' });
    expect(s.tiles[1]!.owner).toBeNull();
    expect(s.turnPhase).toBe('awaiting-end-turn');
  });

  it('UPGRADE_TILE rejected without full sector', () => {
    let s = mkState();
    // Tile 1 in sector 'textiles' (4 tiles: 1, 3, 6, 8, 9). Own just one.
    s = {
      ...s,
      tiles: { ...s.tiles, [1]: { owner: 'p1', tier: 0, mortgaged: false } },
    };
    const before = s.tiles[1]!.tier;
    const after = reducer(s, { type: 'UPGRADE_TILE', tileId: 1 });
    expect(after.tiles[1]!.tier).toBe(before);
  });

  it('UPGRADE_TILE succeeds when sector monopoly held', () => {
    let s = mkState();
    const textileIds = TILES.filter(
      (t) => t.role === 'industry' && t.sector === 'textiles',
    ).map((t) => t.id);
    const tiles = { ...s.tiles };
    for (const id of textileIds) tiles[id] = { owner: 'p1', tier: 0, mortgaged: false };
    s = { ...s, tiles };
    s = reducer(s, { type: 'UPGRADE_TILE', tileId: textileIds[0]! });
    expect(s.tiles[textileIds[0]!]!.tier).toBe(1);
  });

  it('rent is zero when mortgaged', () => {
    let s = mkState();
    // Owner: p2. Place p1 on tile 1.
    s = {
      ...s,
      tiles: { ...s.tiles, [1]: { owner: 'p2', tier: 0, mortgaged: true } },
      players: s.players.map((p, i) => (i === 0 ? { ...p, position: 1 } : p)),
      lastRoll: { a: 1, b: 1, total: 2, doubles: true },
    };
    // Assert rent selector directly — mortgaged tiles yield zero rent.
    expect(computeRent(s, 1, 4)).toBe(0);
  });

  it('game-over rejects further actions', () => {
    let s = mkState();
    s = { ...s, status: 'game-over', turnPhase: 'game-over' };
    const afterRoll = reducer(s, { type: 'ROLL_DICE' });
    expect(afterRoll).toBe(s);
  });

  it('replay from same seed produces identical state', () => {
    const a = mkState(7777);
    const b = mkState(7777);
    const actions = [
      { type: 'ROLL_DICE' },
      { type: 'RESOLVE_MOVEMENT' },
    ] as const;
    const applied1 = actions.reduce((st, ac) => reducer(st, ac), a);
    const applied2 = actions.reduce((st, ac) => reducer(st, ac), b);
    expect(applied1).toEqual(applied2);
  });
});
