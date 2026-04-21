// Pure helpers over engine state. Used by both engine and UI.

import type {
  GameState,
  IndustryTile,
  Player,
  PlayerId,
  SectorId,
  Tile,
  TileId,
} from './types';
import { TILES } from '@/content/tiles';

export function tile(id: TileId): Tile {
  const t = TILES[id];
  if (!t) throw new Error(`Tile not found: ${id}`);
  return t;
}

export function activePlayer(state: GameState): Player {
  const p = state.players[state.activePlayerIndex];
  if (!p) throw new Error('No active player');
  return p;
}

export function playerById(state: GameState, id: PlayerId): Player {
  const p = state.players.find((x) => x.id === id);
  if (!p) throw new Error(`Player not found: ${id}`);
  return p;
}

export function ownsSector(state: GameState, playerId: PlayerId, sector: string): boolean {
  const sectorTiles = TILES.filter(
    (t): t is IndustryTile => t.role === 'industry' && t.sector === sector,
  );
  if (sectorTiles.length === 0) return false;
  return sectorTiles.every((t) => state.tiles[t.id]!.owner === playerId);
}

export function computeRent(state: GameState, tileId: TileId, diceTotal: number): number {
  const t = tile(tileId);
  const o = state.tiles[tileId]!;
  if (!o.owner || o.mortgaged) return 0;

  if (t.role === 'industry') {
    const rent = t.rents[o.tier] ?? t.rents[0];
    const monopoly = o.tier === 0 && ownsSector(state, o.owner, t.sector);
    return monopoly ? rent! * 2 : rent!;
  }
  if (t.role === 'transport') {
    const count = TILES.filter(
      (tx) => tx.role === 'transport' && state.tiles[tx.id]!.owner === o.owner,
    ).length;
    const idx = Math.max(0, Math.min(3, count - 1));
    return t.rentByCount[idx] ?? 0;
  }
  if (t.role === 'utility') {
    const count = TILES.filter(
      (tx) => tx.role === 'utility' && state.tiles[tx.id]!.owner === o.owner,
    ).length;
    const m = count >= 2 ? t.multipliers[1] : t.multipliers[0];
    return diceTotal * (m ?? 4);
  }
  return 0;
}

// Rough net worth for bankruptcy: cash + mortgageable-value of owned tiles (if not yet mortgaged).
export function netWorth(state: GameState, playerId: PlayerId): number {
  let w = playerById(state, playerId).cash;
  for (const t of TILES) {
    const o = state.tiles[t.id]!;
    if (o.owner !== playerId) continue;
    if ('mortgage' in t) {
      // Unmortgaged: we can raise up to t.mortgage. Mortgaged: already spent.
      if (!o.mortgaged) w += t.mortgage;
    }
  }
  return w;
}

export function nonBankruptPlayers(state: GameState): Player[] {
  return state.players.filter((p) => !p.bankrupt);
}

// Representative dice total for utility rent estimation in summary views
// (the expected value of 2d6).
export const UTILITY_RENT_ESTIMATE_ROLL = 7;

export interface PlayerIndustryHolding {
  tileId: TileId;
  tier: number;
  mortgaged: boolean;
}

export interface PlayerSectorGroup {
  sector: SectorId;
  tiles: PlayerIndustryHolding[];
  monopoly: boolean;
  sectorTotal: number;
}

export interface PlayerSimpleHolding {
  tileId: TileId;
  mortgaged: boolean;
}

export interface PlayerHoldingsTotals {
  tileCount: number;
  mortgageValueAvailable: number;
  rentIncome: number;
}

export interface PlayerHoldings {
  industriesBySector: PlayerSectorGroup[];
  transports: PlayerSimpleHolding[];
  utilities: PlayerSimpleHolding[];
  totals: PlayerHoldingsTotals;
}

export function playerHoldings(state: GameState, playerId: PlayerId): PlayerHoldings {
  const sectorMap = new Map<SectorId, PlayerIndustryHolding[]>();
  const sectorTotals = new Map<SectorId, number>();
  const transports: PlayerSimpleHolding[] = [];
  const utilities: PlayerSimpleHolding[] = [];

  let tileCount = 0;
  let mortgageValueAvailable = 0;
  let rentIncome = 0;

  for (const t of TILES) {
    if (t.role === 'industry') {
      sectorTotals.set(t.sector, (sectorTotals.get(t.sector) ?? 0) + 1);
    }
    const o = state.tiles[t.id];
    if (!o || o.owner !== playerId) continue;

    tileCount += 1;
    if ('mortgage' in t && !o.mortgaged) {
      mortgageValueAvailable += t.mortgage;
    }
    rentIncome += computeRent(state, t.id, UTILITY_RENT_ESTIMATE_ROLL);

    if (t.role === 'industry') {
      const list = sectorMap.get(t.sector) ?? [];
      list.push({ tileId: t.id, tier: o.tier, mortgaged: o.mortgaged });
      sectorMap.set(t.sector, list);
    } else if (t.role === 'transport') {
      transports.push({ tileId: t.id, mortgaged: o.mortgaged });
    } else if (t.role === 'utility') {
      utilities.push({ tileId: t.id, mortgaged: o.mortgaged });
    }
  }

  const industriesBySector: PlayerSectorGroup[] = [];
  for (const [sector, tiles] of sectorMap.entries()) {
    tiles.sort((a, b) => a.tileId - b.tileId);
    industriesBySector.push({
      sector,
      tiles,
      monopoly: ownsSector(state, playerId, sector),
      sectorTotal: sectorTotals.get(sector) ?? tiles.length,
    });
  }
  // Stable order: by the tileId of the first owned tile in the sector.
  industriesBySector.sort((a, b) => a.tiles[0]!.tileId - b.tiles[0]!.tileId);
  transports.sort((a, b) => a.tileId - b.tileId);
  utilities.sort((a, b) => a.tileId - b.tileId);

  return {
    industriesBySector,
    transports,
    utilities,
    totals: { tileCount, mortgageValueAvailable, rentIncome },
  };
}
