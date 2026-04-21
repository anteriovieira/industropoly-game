// Pure reducer for the Industropoly engine.
//
// Conventions:
//   - Never mutate the input state; always return a new object (or the same one if no-op).
//   - Invalid actions are silently ignored (returning the same state), so the UI can dispatch
//     freely without guarding every branch; tests assert validity with specific setups.
//   - All randomness flows through state.rngState via helpers in rng.ts.

import type {
  Action,
  Card,
  CardEffect,
  DeckId,
  GameState,
  JournalEntry,
  ModalRequest,
  Player,
  PlayerId,
  Tile,
  TileId,
} from './types';
import { MAX_TIER, PASS_START_BONUS, PRISON_FEE } from './types';
import { rollD6 } from './rng';
import { activePlayer as selActive, computeRent, netWorth, ownsSector } from './selectors';
import { TILES } from '@/content/tiles';
import { INVENTION_CARDS } from '@/content/invention-cards';
import { EDICT_CARDS } from '@/content/edict-cards';

const BOARD_SIZE = 40;
const PRISON_TILE: TileId = 10;
const GO_TO_PRISON_TILE: TileId = 30;

const CARD_INDEX: Record<string, Card> = {};
for (const c of [...INVENTION_CARDS, ...EDICT_CARDS]) CARD_INDEX[c.id] = c;
const TILE_INDEX: Record<TileId, Tile> = {};
for (const t of TILES) TILE_INDEX[t.id] = t;

export function reducer(state: GameState, action: Action): GameState {
  if (state.status === 'game-over') return state;

  switch (action.type) {
    case 'ROLL_DICE':
      return handleRoll(state);
    case 'RESOLVE_MOVEMENT':
      return handleResolveMovement(state);
    case 'RESOLVE_LANDING':
      return handleResolveLanding(state);
    case 'ACK_MODAL':
      return handleAckModal(state);
    case 'OPEN_TILE_INFO':
      return handleOpenTileInfo(state, action.tileId);
    case 'BUY_TILE':
      return handleBuyTile(state);
    case 'DECLINE_BUY':
      return handleDeclineBuy(state);
    case 'UPGRADE_TILE':
      return handleUpgradeTile(state, action.tileId);
    case 'MORTGAGE_TILE':
      return handleMortgage(state, action.tileId);
    case 'REDEEM_TILE':
      return handleRedeem(state, action.tileId);
    case 'DRAW_CARD':
      return handleDrawCard(state, action.deck);
    case 'APPLY_CARD':
      return handleApplyCard(state);
    case 'PAY_PRISON_FEE':
      return handlePayPrisonFee(state);
    case 'USE_GET_OUT_CARD':
      return handleUseGetOut(state);
    case 'PRISON_ROLL':
      return handlePrisonRoll(state);
    case 'END_TURN':
      return handleEndTurn(state);
    default:
      return state;
  }
}

// Helpers -----------------------------------------------------------------

function rollPair(rngState: number): {
  rngState: number;
  a: number;
  b: number;
  total: number;
  doubles: boolean;
} {
  const r1 = rollD6(rngState);
  const r2 = rollD6(r1.state);
  return { rngState: r2.state, a: r1.face, b: r2.face, total: r1.face + r2.face, doubles: r1.face === r2.face };
}

function updateActivePlayer(state: GameState, updater: (p: Player) => Player): GameState {
  const list = state.players.slice();
  list[state.activePlayerIndex] = updater(list[state.activePlayerIndex]!);
  return { ...state, players: list };
}

function updatePlayer(state: GameState, id: PlayerId, updater: (p: Player) => Player): GameState {
  const idx = state.players.findIndex((p) => p.id === id);
  if (idx < 0) return state;
  const list = state.players.slice();
  list[idx] = updater(list[idx]!);
  return { ...state, players: list };
}

function appendLog(state: GameState, message: string): GameState {
  return { ...state, log: [...state.log, message] };
}

function recordJournal(state: GameState, entry: JournalEntry): GameState {
  const key = `${entry.kind}:${entry.refId}`;
  const exists = state.factsJournal.some((e) => `${e.kind}:${e.refId}` === key);
  if (exists) return state;
  return { ...state, factsJournal: [...state.factsJournal, entry] };
}

function recordTileFact(state: GameState, tileId: TileId): GameState {
  const t = TILE_INDEX[tileId]!;
  return recordJournal(state, {
    kind: 'tile',
    refId: String(tileId),
    title: t.education.title,
    date: t.education.date,
    blurb: t.education.blurb,
    source: t.education.source,
    seenAtTurn: state.turn,
  });
}

function recordCardFact(state: GameState, card: Card): GameState {
  return recordJournal(state, {
    kind: 'card',
    refId: card.id,
    title: card.education.title,
    date: card.education.date,
    blurb: card.education.blurb,
    source: card.education.source,
    seenAtTurn: state.turn,
  });
}

function setModal(state: GameState, modal: ModalRequest): GameState {
  return { ...state, modal };
}

// ROLL_DICE ---------------------------------------------------------------

function handleRoll(state: GameState): GameState {
  if (state.turnPhase !== 'awaiting-roll') return state;
  const p = selActive(state);
  if (p.inPrison) return state;

  const r = rollPair(state.rngState);
  const doublesStreak = r.doubles ? p.doublesStreak + 1 : 0;
  let s: GameState = {
    ...state,
    rngState: r.rngState,
    lastRoll: { a: r.a, b: r.b, total: r.total, doubles: r.doubles },
    turnPhase: 'moving',
  };
  s = updateActivePlayer(s, (pl) => ({ ...pl, doublesStreak }));
  s = appendLog(s, `${p.name} tirou ${r.a} + ${r.b}${r.doubles ? ' (dupla!)' : ''}.`);

  // Three consecutive doubles -> prison, do not resolve movement
  if (r.doubles && doublesStreak >= 3) {
    s = sendActiveToPrison(s, 'excesso de velocidade suspeito');
    return { ...s, lastRoll: null, turnPhase: 'awaiting-end-turn' };
  }

  return s;
}

// RESOLVE_MOVEMENT --------------------------------------------------------

function handleResolveMovement(state: GameState): GameState {
  if (state.turnPhase !== 'moving' || !state.lastRoll) return state;
  const p = selActive(state);
  const steps = state.lastRoll.total;

  let pos = p.position;
  let cashDelta = 0;
  for (let i = 0; i < steps; i++) {
    pos = (pos + 1) % BOARD_SIZE;
    if (pos === 0) cashDelta += PASS_START_BONUS;
  }

  let s = updateActivePlayer(state, (pl) => ({ ...pl, position: pos, cash: pl.cash + cashDelta }));
  if (cashDelta > 0) s = appendLog(s, `${p.name} passou pelo Início e recebeu £${cashDelta}.`);
  return { ...s, turnPhase: 'awaiting-land-action' };
}

// RESOLVE_LANDING ---------------------------------------------------------

function handleResolveLanding(state: GameState): GameState {
  if (state.turnPhase !== 'awaiting-land-action') return state;
  const p = selActive(state);
  const t = TILE_INDEX[p.position]!;

  let s = recordTileFact(state, p.position);

  switch (t.role) {
    case 'corner': {
      if (t.corner === 'go-to-prison') {
        s = sendActiveToPrison(s, 'flagrado por fraude');
        return { ...s, turnPhase: 'awaiting-end-turn', pendingLandingResolved: true };
      }
      // start, prison (just visiting), public-square: nothing special
      s = setModal(s, { kind: 'tile-info', tileId: p.position });
      return { ...s, pendingLandingResolved: true };
    }
    case 'industry':
    case 'transport':
    case 'utility': {
      const o = s.tiles[t.id]!;
      if (!o.owner) {
        // Available for purchase
        s = setModal(s, { kind: 'tile-info', tileId: p.position });
        return { ...s, pendingLandingResolved: false };
      }
      if (o.owner === p.id || o.mortgaged) {
        s = setModal(s, { kind: 'tile-info', tileId: p.position });
        return { ...s, pendingLandingResolved: true };
      }
      const owed = computeRent(s, t.id, s.lastRoll?.total ?? 0);
      if (owed <= 0) {
        s = setModal(s, { kind: 'tile-info', tileId: p.position });
        return { ...s, pendingLandingResolved: true };
      }
      s = setModal(s, { kind: 'rent', tileId: t.id, owed });
      return { ...s, pendingLandingResolved: false };
    }
    case 'tax': {
      s = setModal(s, { kind: 'tax', tileId: t.id, owed: t.amount });
      return { ...s, pendingLandingResolved: false };
    }
    case 'card': {
      return { ...handleDrawCard(s, t.deck), turnPhase: 'drawing-card' };
    }
    default:
      return s;
  }
}

// ACK_MODAL ---------------------------------------------------------------

function handleAckModal(state: GameState): GameState {
  if (!state.modal) return state;
  const m = state.modal;

  if (m.kind === 'rent') {
    const o = state.tiles[m.tileId]!;
    if (!o.owner) return { ...state, modal: null };
    const p = selActive(state);
    const payable = Math.min(m.owed, p.cash + netWorthExcludingCash(state, p.id));
    // For v1 simplicity: auto-liquidate if needed, else bankruptcy.
    if (p.cash + netWorthExcludingCash(state, p.id) < m.owed) {
      let s = appendLog(state, `${p.name} não pode pagar £${m.owed} de aluguel — falido.`);
      s = markBankrupt(s, p.id);
      s = updatePlayer(s, o.owner, (ow) => ({ ...ow, cash: ow.cash + payable }));
      s = {
        ...s,
        modal: null,
        pendingLandingResolved: true,
        turnPhase: 'awaiting-end-turn',
      };
      return checkWin(s);
    }
    let s = updateActivePlayer(state, (pl) => ({ ...pl, cash: pl.cash - m.owed }));
    s = updatePlayer(s, o.owner, (ow) => ({ ...ow, cash: ow.cash + m.owed }));
    s = appendLog(s, `${p.name} pagou £${m.owed} de aluguel.`);
    return { ...s, modal: null, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' };
  }

  if (m.kind === 'tax') {
    const p = selActive(state);
    if (p.cash < m.owed) {
      let s = appendLog(state, `${p.name} não pode pagar o imposto de £${m.owed} — falido.`);
      s = markBankrupt(s, p.id);
      return checkWin({ ...s, modal: null, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' });
    }
    let s = updateActivePlayer(state, (pl) => ({ ...pl, cash: pl.cash - m.owed }));
    s = appendLog(s, `${p.name} pagou £${m.owed} de imposto.`);
    return { ...s, modal: null, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' };
  }

  if (m.kind === 'tile-info') {
    // Simple acknowledgment, no side effect
    const needsMore = !state.pendingLandingResolved;
    return {
      ...state,
      modal: null,
      // If we were waiting on a purchase decision, leave pendingLandingResolved=false;
      // the user must then choose Buy/Decline to progress.
      pendingLandingResolved: needsMore ? state.pendingLandingResolved : true,
    };
  }

  if (m.kind === 'card') {
    // Should go through APPLY_CARD; treat as apply then close.
    return handleApplyCard(state);
  }

  if (m.kind === 'prison') {
    return { ...state, modal: null };
  }

  return { ...state, modal: null };
}

// OPEN_TILE_INFO ----------------------------------------------------------
// Read-only inspection. Only opens when no other modal is active, and only in
// "safe" phases so it cannot interrupt a landing/card flow.

function handleOpenTileInfo(state: GameState, tileId: TileId): GameState {
  if (state.modal) return state;
  if (tileId < 0 || tileId >= 40 || !Number.isInteger(tileId)) return state;
  const safe: ReadonlyArray<GameState['turnPhase']> = ['awaiting-roll', 'awaiting-end-turn'];
  if (!safe.includes(state.turnPhase)) return state;
  return { ...state, modal: { kind: 'tile-info', tileId, readOnly: true } };
}

// BUY_TILE / DECLINE_BUY --------------------------------------------------

function handleBuyTile(state: GameState): GameState {
  const p = selActive(state);
  const t = TILE_INDEX[p.position]!;
  if (t.role !== 'industry' && t.role !== 'transport' && t.role !== 'utility') return state;
  const o = state.tiles[t.id]!;
  if (o.owner) return state;
  if (p.cash < t.price) return state;

  const tiles = { ...state.tiles, [t.id]: { ...o, owner: p.id } };
  let s: GameState = { ...state, tiles };
  s = updateActivePlayer(s, (pl) => ({ ...pl, cash: pl.cash - t.price }));
  s = appendLog(s, `${p.name} comprou ${t.name} por £${t.price}.`);
  return { ...s, modal: null, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' };
}

function handleDeclineBuy(state: GameState): GameState {
  if (state.turnPhase !== 'awaiting-land-action') return state;
  return { ...state, modal: null, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' };
}

// UPGRADE_TILE ------------------------------------------------------------

function handleUpgradeTile(state: GameState, tileId: TileId): GameState {
  const p = selActive(state);
  const t = TILE_INDEX[tileId];
  if (!t || t.role !== 'industry') return state;
  const o = state.tiles[tileId]!;
  if (o.owner !== p.id || o.mortgaged) return state;
  if (o.tier >= MAX_TIER) return state;
  if (!ownsSector(state, p.id, t.sector)) return state;
  if (p.cash < t.upgradeCost) return state;

  const nextTier = (o.tier + 1) as 1 | 2 | 3 | 4 | 5;
  const tiles = { ...state.tiles, [tileId]: { ...o, tier: nextTier } };
  let s: GameState = { ...state, tiles };
  s = updateActivePlayer(s, (pl) => ({ ...pl, cash: pl.cash - t.upgradeCost }));
  return appendLog(s, `${p.name} melhorou ${t.name} para o nível ${nextTier}.`);
}

// MORTGAGE / REDEEM -------------------------------------------------------

function handleMortgage(state: GameState, tileId: TileId): GameState {
  const p = selActive(state);
  const t = TILE_INDEX[tileId];
  if (!t || !('mortgage' in t)) return state;
  const o = state.tiles[tileId]!;
  if (o.owner !== p.id || o.mortgaged) return state;
  if (t.role === 'industry' && o.tier > 0) return state;

  const tiles = { ...state.tiles, [tileId]: { ...o, mortgaged: true } };
  let s: GameState = { ...state, tiles };
  s = updateActivePlayer(s, (pl) => ({ ...pl, cash: pl.cash + t.mortgage }));
  return appendLog(s, `${p.name} hipotecou ${t.name} por £${t.mortgage}.`);
}

function handleRedeem(state: GameState, tileId: TileId): GameState {
  const p = selActive(state);
  const t = TILE_INDEX[tileId];
  if (!t || !('mortgage' in t)) return state;
  const o = state.tiles[tileId]!;
  if (o.owner !== p.id || !o.mortgaged) return state;
  const cost = Math.ceil(t.mortgage * 1.1);
  if (p.cash < cost) return state;

  const tiles = { ...state.tiles, [tileId]: { ...o, mortgaged: false } };
  let s: GameState = { ...state, tiles };
  s = updateActivePlayer(s, (pl) => ({ ...pl, cash: pl.cash - cost }));
  return appendLog(s, `${p.name} resgatou ${t.name} por £${cost}.`);
}

// DRAW_CARD / APPLY_CARD --------------------------------------------------

function handleDrawCard(state: GameState, deck: DeckId): GameState {
  const d = state.decks[deck];
  if (d.draw.length === 0) return state;
  const [id, ...rest] = d.draw;
  if (!id) return state;
  const card = CARD_INDEX[id]!;
  let s: GameState = {
    ...state,
    decks: {
      ...state.decks,
      [deck]: { draw: rest, discard: [...d.discard, id] },
    },
    pendingCardId: id,
    modal: { kind: 'card', cardId: id },
    turnPhase: 'drawing-card',
  };
  s = recordCardFact(s, card);
  s = appendLog(s, `${selActive(s).name} comprou a carta ${card.title}.`);
  return s;
}

function handleApplyCard(state: GameState): GameState {
  const id = state.pendingCardId;
  if (!id) return { ...state, modal: null };
  const card = CARD_INDEX[id];
  if (!card) return { ...state, modal: null, pendingCardId: null };

  let s = applyCardEffect(state, card.effect, card);
  s = { ...s, pendingCardId: null, modal: null };

  // If effect moved the token (move-to / move-by / go-to-prison),
  // re-resolve landing. Otherwise land effect is the card itself — done.
  const movedToNewTile =
    card.effect.kind === 'move-to' ||
    card.effect.kind === 'move-by' ||
    card.effect.kind === 'go-to-prison';

  if (movedToNewTile) {
    // After relocation, resolve landing again if not in prison.
    const p = selActive(s);
    if (!p.inPrison) {
      s = { ...s, turnPhase: 'awaiting-land-action', pendingLandingResolved: false };
      return handleResolveLanding(s);
    }
    return { ...s, turnPhase: 'awaiting-end-turn', pendingLandingResolved: true };
  }

  return { ...s, turnPhase: 'awaiting-end-turn', pendingLandingResolved: true };
}

function applyCardEffect(state: GameState, effect: CardEffect, card: Card): GameState {
  const p = selActive(state);
  switch (effect.kind) {
    case 'gain':
      return updateActivePlayer(state, (pl) => ({ ...pl, cash: pl.cash + effect.amount }));
    case 'pay': {
      if (p.cash + netWorthExcludingCash(state, p.id) < effect.amount) {
        let s = appendLog(state, `${p.name} não pode pagar £${effect.amount} — falido.`);
        s = markBankrupt(s, p.id);
        return checkWin(s);
      }
      return updateActivePlayer(state, (pl) => ({ ...pl, cash: pl.cash - effect.amount }));
    }
    case 'move-to': {
      const target = effect.tileId;
      let cashDelta = 0;
      if (effect.passStartAward && target < p.position) cashDelta += PASS_START_BONUS;
      return updateActivePlayer(state, (pl) => ({
        ...pl,
        position: target,
        cash: pl.cash + cashDelta,
      }));
    }
    case 'move-by': {
      let pos = p.position;
      let cashDelta = 0;
      const steps = Math.abs(effect.delta);
      const dir = Math.sign(effect.delta);
      for (let i = 0; i < steps; i++) {
        pos = (pos + dir + BOARD_SIZE) % BOARD_SIZE;
        if (dir > 0 && pos === 0) cashDelta += PASS_START_BONUS;
      }
      return updateActivePlayer(state, (pl) => ({
        ...pl,
        position: pos,
        cash: pl.cash + cashDelta,
      }));
    }
    case 'go-to-prison':
      return sendActiveToPrison(state, `por ${card.title}`);
    case 'keep-get-out-of-prison':
      return updateActivePlayer(state, (pl) => ({ ...pl, getOutCards: pl.getOutCards + 1 }));
    case 'pay-per-property': {
      let industries = 0;
      let upgrades = 0;
      for (const t of TILES) {
        if (t.role !== 'industry') continue;
        const o = state.tiles[t.id]!;
        if (o.owner === p.id) {
          industries += 1;
          upgrades += o.tier;
        }
      }
      const owed = industries * effect.perIndustry + upgrades * effect.perUpgrade;
      if (owed <= 0) return state;
      if (p.cash + netWorthExcludingCash(state, p.id) < owed) {
        let s = appendLog(state, `${p.name} deve £${owed} — falido.`);
        s = markBankrupt(s, p.id);
        return checkWin(s);
      }
      let s = updateActivePlayer(state, (pl) => ({ ...pl, cash: pl.cash - owed }));
      return appendLog(s, `${p.name} pagou £${owed} (${industries} indústrias + ${upgrades} melhorias).`);
    }
    case 'collect-from-each': {
      let total = 0;
      let s: GameState = state;
      for (const other of state.players) {
        if (other.id === p.id || other.bankrupt) continue;
        if (other.cash < effect.amount) {
          total += other.cash;
          s = updatePlayer(s, other.id, (o) => ({ ...o, cash: 0 }));
          s = markBankrupt(s, other.id);
        } else {
          total += effect.amount;
          s = updatePlayer(s, other.id, (o) => ({ ...o, cash: o.cash - effect.amount }));
        }
      }
      s = updateActivePlayer(s, (pl) => ({ ...pl, cash: pl.cash + total }));
      return checkWin(s);
    }
  }
}

// PRISON ------------------------------------------------------------------

function sendActiveToPrison(state: GameState, reason: string): GameState {
  const p = selActive(state);
  let s = updateActivePlayer(state, (pl) => ({
    ...pl,
    position: PRISON_TILE,
    inPrison: true,
    prisonRollsLeft: 3,
    doublesStreak: 0,
  }));
  s = appendLog(s, `${p.name} foi enviado(a) à Prisão dos Devedores (${reason}).`);
  return s;
}

function handlePayPrisonFee(state: GameState): GameState {
  const p = selActive(state);
  if (!p.inPrison || p.cash < PRISON_FEE) return state;
  let s = updateActivePlayer(state, (pl) => ({
    ...pl,
    inPrison: false,
    prisonRollsLeft: 0,
    cash: pl.cash - PRISON_FEE,
  }));
  s = appendLog(s, `${p.name} pagou a taxa de £${PRISON_FEE} da prisão.`);
  return { ...s, turnPhase: 'awaiting-roll' };
}

function handleUseGetOut(state: GameState): GameState {
  const p = selActive(state);
  if (!p.inPrison || p.getOutCards <= 0) return state;
  let s = updateActivePlayer(state, (pl) => ({
    ...pl,
    inPrison: false,
    prisonRollsLeft: 0,
    getOutCards: pl.getOutCards - 1,
  }));
  s = appendLog(s, `${p.name} usou uma carta de Perdão Real.`);
  return { ...s, turnPhase: 'awaiting-roll' };
}

function handlePrisonRoll(state: GameState): GameState {
  const p = selActive(state);
  if (!p.inPrison) return state;
  const r = rollPair(state.rngState);
  let s: GameState = {
    ...state,
    rngState: r.rngState,
    lastRoll: { a: r.a, b: r.b, total: r.total, doubles: r.doubles },
  };
  s = appendLog(s, `${p.name} tirou ${r.a} + ${r.b} tentando escapar.`);
  if (r.doubles) {
    s = updateActivePlayer(s, (pl) => ({ ...pl, inPrison: false, prisonRollsLeft: 0 }));
    s = appendLog(s, `${p.name} escapa com uma dupla!`);
    // Move and resolve landing without granting another doubles roll.
    s = { ...s, turnPhase: 'moving' };
    s = handleResolveMovement(s);
    return handleResolveLanding(s);
  }
  const remaining = p.prisonRollsLeft - 1;
  if (remaining <= 0) {
    // Forced to pay the fee; if they can't, bankrupt.
    if (s.players[s.activePlayerIndex]!.cash < PRISON_FEE) {
      s = markBankrupt(s, p.id);
      return checkWin({ ...s, turnPhase: 'awaiting-end-turn' });
    }
    s = updateActivePlayer(s, (pl) => ({
      ...pl,
      inPrison: false,
      prisonRollsLeft: 0,
      cash: pl.cash - PRISON_FEE,
    }));
    s = appendLog(s, `${p.name} foi forçado(a) a pagar a taxa de £${PRISON_FEE}.`);
    // Then move and resolve.
    s = { ...s, turnPhase: 'moving' };
    s = handleResolveMovement(s);
    return handleResolveLanding(s);
  }
  s = updateActivePlayer(s, (pl) => ({ ...pl, prisonRollsLeft: remaining }));
  return { ...s, turnPhase: 'awaiting-end-turn' };
}

// END_TURN ----------------------------------------------------------------

function handleEndTurn(state: GameState): GameState {
  if (!state.pendingLandingResolved && state.turnPhase !== 'awaiting-end-turn') return state;
  const p = selActive(state);
  if (state.lastRoll?.doubles && !p.inPrison && p.doublesStreak > 0 && p.doublesStreak < 3) {
    // Another roll for the same player.
    return {
      ...state,
      turnPhase: 'awaiting-roll',
      lastRoll: null,
      pendingLandingResolved: false,
      modal: null,
    };
  }

  // Advance to next non-bankrupt player.
  let nextIdx = state.activePlayerIndex;
  for (let i = 0; i < state.players.length; i++) {
    nextIdx = (nextIdx + 1) % state.players.length;
    if (!state.players[nextIdx]!.bankrupt) break;
  }

  let s: GameState = {
    ...state,
    activePlayerIndex: nextIdx,
    turn: state.turn + 1,
    turnPhase: 'awaiting-roll',
    lastRoll: null,
    pendingLandingResolved: false,
    modal: null,
  };
  // Reset previous player's doubles streak
  s = updatePlayer(s, p.id, (pl) => ({ ...pl, doublesStreak: 0 }));
  return s;
}

// Bankruptcy / win --------------------------------------------------------

function markBankrupt(state: GameState, id: PlayerId): GameState {
  let s = updatePlayer(state, id, (p) => ({ ...p, bankrupt: true, cash: 0 }));
  const tiles = { ...s.tiles };
  for (const t of TILES) {
    const o = tiles[t.id]!;
    if (o.owner === id) tiles[t.id] = { owner: null, tier: 0, mortgaged: false };
  }
  s = { ...s, tiles };
  s = appendLog(s, `${playerName(state, id)} faliu — propriedades liberadas.`);
  return s;
}

function checkWin(state: GameState): GameState {
  const alive = state.players.filter((p) => !p.bankrupt);
  if (alive.length <= 1) {
    const winner = alive[0]?.id ?? null;
    return {
      ...state,
      status: 'game-over',
      winner,
      turnPhase: 'game-over',
      modal: null,
    };
  }
  return state;
}

function playerName(state: GameState, id: PlayerId): string {
  return state.players.find((p) => p.id === id)?.name ?? id;
}

function netWorthExcludingCash(state: GameState, id: PlayerId): number {
  return netWorth(state, id) - (state.players.find((p) => p.id === id)?.cash ?? 0);
}
