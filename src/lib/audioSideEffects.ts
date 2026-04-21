// Subscribe to the game store and play sounds when interesting transitions occur.
// Called once per mount from GameScreen. Idempotent across hot reloads.

import { useEffect } from 'react';
import { audio } from './audio';
import { useGameStore } from '@/state/gameStore';
import type { GameState, Player } from '@/engine/types';

export function useGameAudio(): void {
  useEffect(() => {
    let prev = useGameStore.getState().state;
    const unsub = useGameStore.subscribe((s) => {
      const cur = s.state;
      if (!cur) {
        prev = cur;
        return;
      }
      if (!prev) {
        prev = cur;
        return;
      }
      handleTransition(prev, cur);
      prev = cur;
    });
    return unsub;
  }, []);
}

function handleTransition(prev: GameState, cur: GameState): void {
  // Dice roll (any non-prison roll from inside the reducer produces a new lastRoll object)
  if (cur.lastRoll && cur.lastRoll !== prev.lastRoll) {
    audio.play('dice');
  }

  // Card draw
  if (cur.pendingCardId && cur.pendingCardId !== prev.pendingCardId) {
    audio.play('card');
  }

  // Tile purchased: any tile whose owner changed from null to something
  for (const id of Object.keys(cur.tiles)) {
    const before = prev.tiles[Number(id)];
    const after = cur.tiles[Number(id)];
    if (!before || !after) continue;
    if (!before.owner && after.owner) {
      audio.play('buy');
      break;
    }
  }

  // Pass-start bonus, taxes, rent: detect cash motion on the active player.
  const activeBefore = prev.players[prev.activePlayerIndex];
  const activeAfter = cur.players[cur.activePlayerIndex];
  if (activeBefore && activeAfter && activeBefore.id === activeAfter.id) {
    if (prev.modal?.kind === 'rent' && cur.modal === null && cur.turnPhase === 'awaiting-end-turn') {
      // Rent modal was acknowledged (payment just occurred).
      audio.play('levy');
    } else if (prev.modal?.kind === 'tax' && cur.modal === null && cur.turnPhase === 'awaiting-end-turn') {
      audio.play('levy');
    }
  }

  // Pass start bonus heuristic: position decreased (wrapped) AND player cash strictly increased.
  if (activeBefore && activeAfter && activeBefore.id === activeAfter.id) {
    if (
      activeBefore.position !== 0 &&
      activeAfter.position < activeBefore.position &&
      activeAfter.cash > activeBefore.cash
    ) {
      audio.play('passStart');
    }
  }

  // Prison: any player newly in prison
  if (anyPlayerEnteredPrison(prev.players, cur.players)) audio.play('prison');

  // Prison escape: any player left prison
  if (anyPlayerLeftPrison(prev.players, cur.players)) audio.play('escape');

  // Bankruptcy
  if (anyPlayerBankrupted(prev.players, cur.players)) audio.play('bankrupt');

  // Win
  if (prev.status !== 'game-over' && cur.status === 'game-over') {
    audio.play('win');
  }
}

function anyPlayerEnteredPrison(prev: Player[], cur: Player[]): boolean {
  return cur.some((p) => {
    const before = prev.find((x) => x.id === p.id);
    return before != null && !before.inPrison && p.inPrison;
  });
}

function anyPlayerLeftPrison(prev: Player[], cur: Player[]): boolean {
  return cur.some((p) => {
    const before = prev.find((x) => x.id === p.id);
    return before != null && before.inPrison && !p.inPrison;
  });
}

function anyPlayerBankrupted(prev: Player[], cur: Player[]): boolean {
  return cur.some((p) => {
    const before = prev.find((x) => x.id === p.id);
    return before != null && !before.bankrupt && p.bankrupt;
  });
}
