// Thin wrappers around engine selectors for consumption by React components.

import type { GameState, PlayerId, TileId } from '@/engine/types';
import {
  activePlayer as engineActive,
  computeRent,
  ownsSector,
  playerById,
} from '@/engine/selectors';

export function activePlayer(state: GameState) {
  return engineActive(state);
}

export function getPlayer(state: GameState, id: PlayerId) {
  return playerById(state, id);
}

export function tileOwner(state: GameState, tileId: TileId): PlayerId | null {
  return state.tiles[tileId]?.owner ?? null;
}

export function rentFor(state: GameState, tileId: TileId): number {
  return computeRent(state, tileId, state.lastRoll?.total ?? 0);
}

export function hasMonopoly(state: GameState, playerId: PlayerId, sector: string): boolean {
  return ownsSector(state, playerId, sector);
}
