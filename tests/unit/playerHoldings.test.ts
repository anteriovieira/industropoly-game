import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/engine/init';
import { playerHoldings, computeRent, UTILITY_RENT_ESTIMATE_ROLL } from '@/engine/selectors';
import type { GameState, IndustryTile, PlayerId } from '@/engine/types';
import { TILES } from '@/content/tiles';

const TEXTILE_TILE_IDS = TILES.filter(
  (t): t is IndustryTile => t.role === 'industry' && t.sector === 'textiles',
).map((t) => t.id);

const TRANSPORT_TILE_IDS = TILES.filter((t) => t.role === 'transport').map((t) => t.id);

const UTILITY_TILE_IDS = TILES.filter((t) => t.role === 'utility').map((t) => t.id);

function mkState(): GameState {
  return createInitialState(
    [
      { name: 'P1', token: 'locomotive' },
      { name: 'P2', token: 'top-hat' },
    ],
    1,
  );
}

function setOwner(
  state: GameState,
  tileId: number,
  owner: PlayerId | null,
  opts: { tier?: 0 | 1 | 2 | 3 | 4 | 5; mortgaged?: boolean } = {},
): GameState {
  return {
    ...state,
    tiles: {
      ...state.tiles,
      [tileId]: {
        owner,
        tier: opts.tier ?? 0,
        mortgaged: opts.mortgaged ?? false,
      },
    },
  };
}

describe('playerHoldings selector', () => {
  it('returns zeroed totals and empty groups for an unowned portfolio', () => {
    const s = mkState();
    const h = playerHoldings(s, 'p1');
    expect(h.industriesBySector).toEqual([]);
    expect(h.transports).toEqual([]);
    expect(h.utilities).toEqual([]);
    expect(h.totals).toEqual({ tileCount: 0, mortgageValueAvailable: 0, rentIncome: 0 });
  });

  it('partial sector ownership leaves monopoly = false', () => {
    let s = mkState();
    s = setOwner(s, TEXTILE_TILE_IDS[0]!, 'p1');
    s = setOwner(s, TEXTILE_TILE_IDS[1]!, 'p1');
    const h = playerHoldings(s, 'p1');
    expect(h.industriesBySector).toHaveLength(1);
    const [group] = h.industriesBySector;
    expect(group!.sector).toBe('textiles');
    expect(group!.tiles).toHaveLength(2);
    expect(group!.monopoly).toBe(false);
    expect(group!.sectorTotal).toBe(TEXTILE_TILE_IDS.length);
    expect(h.totals.tileCount).toBe(2);
  });

  it('full sector ownership flips monopoly = true', () => {
    let s = mkState();
    for (const id of TEXTILE_TILE_IDS) s = setOwner(s, id, 'p1');
    const h = playerHoldings(s, 'p1');
    expect(h.industriesBySector[0]!.monopoly).toBe(true);
    expect(h.industriesBySector[0]!.tiles).toHaveLength(TEXTILE_TILE_IDS.length);
  });

  it('mortgaged tiles are excluded from mortgageValueAvailable and contribute 0 rent', () => {
    const tileId = TEXTILE_TILE_IDS[0]!;
    const tile = TILES[tileId]! as IndustryTile;
    let s = mkState();
    // Two textile tiles: one mortgaged, one not.
    s = setOwner(s, tileId, 'p1', { mortgaged: true });
    const otherTileId = TEXTILE_TILE_IDS[1]!;
    const otherTile = TILES[otherTileId]! as IndustryTile;
    s = setOwner(s, otherTileId, 'p1', { mortgaged: false });

    const h = playerHoldings(s, 'p1');
    // Only the unmortgaged tile contributes mortgage value.
    expect(h.totals.mortgageValueAvailable).toBe(otherTile.mortgage);
    // The mortgaged tile contributes 0 to rent income; the other contributes its base rent.
    const expectedRent = computeRent(s, otherTileId, UTILITY_RENT_ESTIMATE_ROLL);
    expect(h.totals.rentIncome).toBe(expectedRent);
    expect(computeRent(s, tileId, UTILITY_RENT_ESTIMATE_ROLL)).toBe(0);
    expect(tile.mortgage).toBeGreaterThan(0); // sanity
  });

  it('transport rent scales with the count of transports the player owns', () => {
    let s = mkState();
    s = setOwner(s, TRANSPORT_TILE_IDS[0]!, 'p1');
    const oneRent = playerHoldings(s, 'p1').totals.rentIncome;

    s = setOwner(s, TRANSPORT_TILE_IDS[1]!, 'p1');
    const twoRent = playerHoldings(s, 'p1').totals.rentIncome;

    expect(twoRent).toBeGreaterThan(oneRent);
    // With two transports each tile pays the count=2 rent (50). Sum = 100.
    expect(twoRent).toBe(50 * 2);
    expect(oneRent).toBe(25);
  });

  it('utility rent uses diceTotal = 7 for the income estimate', () => {
    const utilId = UTILITY_TILE_IDS[0]!;
    let s = mkState();
    s = setOwner(s, utilId, 'p1');
    const h = playerHoldings(s, 'p1');
    // Sole utility multiplier is 4 → 7 * 4 = 28.
    expect(h.totals.rentIncome).toBe(7 * 4);

    // Owning both utilities flips the multiplier to 10.
    s = setOwner(s, UTILITY_TILE_IDS[1]!, 'p1');
    const h2 = playerHoldings(s, 'p1');
    expect(h2.totals.rentIncome).toBe(7 * 10 * 2);
  });
});
