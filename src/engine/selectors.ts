// Pure helpers over engine state. Used by both engine and UI.

import type { GameState, IndustryTile, Player, PlayerId, Tile, TileId } from './types';
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
