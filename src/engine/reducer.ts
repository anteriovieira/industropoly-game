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
  CurrentQuiz,
  DeckId,
  GameState,
  JournalEntry,
  ModalRequest,
  Player,
  PlayerId,
  Question,
  Tile,
  TileId,
} from './types';
import {
  CONSOLATION_MOVE_STEPS,
  MAX_TIER,
  PASS_START_BONUS,
  PRISON_FEE,
  STREAK_BONUS_AMOUNT,
  STREAK_BONUS_THRESHOLD,
} from './types';
import { nextUint32, rollD6 } from './rng';
import { activePlayer as selActive, computeRent, netWorth, ownsSector } from './selectors';
import { TILES } from '@/content/tiles';
import { INVENTION_CARDS } from '@/content/invention-cards';
import { EDICT_CARDS } from '@/content/edict-cards';
import { QUESTIONS } from '@/content/questions';
import { STORIES } from '@/content/stories';

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
    case 'ANSWER_QUESTION':
      return handleAnswerQuestion(state, action.optionId);
    case 'BUY_HINT':
      return handleBuyHint(state, action.hintId);
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

  // Quiz gates the ROLL itself: if the active player is parked on a tile with
  // an authored question, surface the quiz first WITHOUT rolling. The dice
  // only get rolled once they answer correctly. A wrong answer means no roll
  // and no movement at all.
  const currentTile = TILE_INDEX[p.position]!;
  if (currentTile.role !== 'corner' && (QUESTIONS[currentTile.id]?.length ?? 0) > 0) {
    return startQuizForCurrentTile(state, currentTile.id);
  }

  // No quiz on this tile — roll immediately and proceed to movement.
  return performRoll(state);
}

// Actually rolls the dice, updates lastRoll/doublesStreak/log, and transitions
// to `moving` (or `awaiting-end-turn` on a 3-doubles prison send-off). Called
// from `handleRoll` for non-quiz tiles and from `handleAnswerQuestion` after a
// correct answer.
function performRoll(state: GameState): GameState {
  const p = selActive(state);
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
  if (cashDelta > 0) s = appendLog(s, `${p.name} passou pelo Início e recebeu R$${cashDelta}.`);

  // Track the landed tile (consumed by future features; not used by routing).
  s = { ...s, lastResolvedTileId: pos };

  // Go-to-prison is a movement consequence, not a tile rule — apply and end.
  const tile = TILE_INDEX[pos]!;
  if (tile.role === 'corner' && tile.corner === 'go-to-prison') {
    s = sendActiveToPrison(s, 'flagrado por fraude');
    s = recordTileFact(s, pos);
    return { ...s, turnPhase: 'awaiting-end-turn', pendingLandingResolved: true };
  }

  // Other corners (Início, Praça, Visitando Prisão): no rule, just end turn.
  if (tile.role === 'corner') {
    s = recordTileFact(s, pos);
    return { ...s, turnPhase: 'awaiting-end-turn', pendingLandingResolved: true };
  }

  // Quiz already happened (or was skipped) before movement. Resolve the
  // landing's gameplay rule directly.
  return { ...s, turnPhase: 'awaiting-land-action' };
}

// Called from `handleRoll` against the player's CURRENT position. Picks a
// question for that tile via the rng. If the tile has no authored question
// (defensive — `handleRoll` already short-circuits this case) the caller's
// `moving` phase is preserved.
function startQuizForCurrentTile(state: GameState, tileId: TileId): GameState {
  const questions = QUESTIONS[tileId] ?? [];
  if (questions.length === 0) return state; // already in `moving`
  const draw = drawQuestionIndex(state.rngState, questions.length);
  const q = questions[draw.index]!;
  const quiz: CurrentQuiz = {
    tileId,
    questionId: q.id,
    revealedHints: [],
    eliminatedOptionIds: [],
  };
  return {
    ...state,
    rngState: draw.state,
    turnPhase: 'awaiting-quiz-answer',
    currentQuiz: quiz,
  };
}

// RESOLVE_LANDING ---------------------------------------------------------

function handleResolveLanding(state: GameState): GameState {
  if (state.turnPhase !== 'awaiting-land-action') return state;
  const p = selActive(state);
  const t = TILE_INDEX[p.position]!;

  // Journal entry for the tile is written on quiz answer. For tiles that can
  // reach this handler without a quiz (e.g. card-effect relocations), record
  // here as a fallback so the entry still appears.
  let s = recordTileFact(state, p.position);

  switch (t.role) {
    case 'corner': {
      // go-to-prison is handled before the quiz in movement resolution.
      // Other corners just end the turn with no UI side-effect (info is shown
      // alongside the quiz result, not here).
      return { ...s, turnPhase: 'awaiting-end-turn', pendingLandingResolved: true };
    }
    case 'industry':
    case 'transport':
    case 'utility': {
      const o = s.tiles[t.id]!;
      if (!o.owner) {
        // Available for purchase — surface the buy offer.
        s = setModal(s, { kind: 'tile-info', tileId: p.position });
        return { ...s, pendingLandingResolved: false };
      }
      if (o.owner === p.id || o.mortgaged) {
        return { ...s, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' };
      }
      const owed = computeRent(s, t.id, s.lastRoll?.total ?? 0);
      if (owed <= 0) {
        return { ...s, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' };
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
      let s = appendLog(state, `${p.name} não pode pagar R$${m.owed} de aluguel — falido.`);
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
    s = appendLog(s, `${p.name} pagou R$${m.owed} de aluguel.`);
    return { ...s, modal: null, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' };
  }

  if (m.kind === 'tax') {
    const p = selActive(state);
    if (p.cash < m.owed) {
      let s = appendLog(state, `${p.name} não pode pagar o imposto de R$${m.owed} — falido.`);
      s = markBankrupt(s, p.id);
      return checkWin({ ...s, modal: null, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' });
    }
    let s = updateActivePlayer(state, (pl) => ({ ...pl, cash: pl.cash - m.owed }));
    s = appendLog(s, `${p.name} pagou R$${m.owed} de imposto.`);
    return { ...s, modal: null, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' };
  }

  if (m.kind === 'tile-info') {
    // If this tile-info came from a landing (awaiting-land-action with the
    // landing still unresolved), acknowledging it counts as declining the
    // purchase — otherwise the GameScreen auto-dispatcher re-enters
    // RESOLVE_LANDING and re-opens this same modal in a loop.
    if (state.turnPhase === 'awaiting-land-action' && !state.pendingLandingResolved) {
      return {
        ...state,
        modal: null,
        pendingLandingResolved: true,
        turnPhase: 'awaiting-end-turn',
      };
    }
    return { ...state, modal: null };
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
  if (state.turnPhase === 'awaiting-quiz-answer') return state;
  const p = selActive(state);
  const t = TILE_INDEX[p.position]!;
  if (t.role !== 'industry' && t.role !== 'transport' && t.role !== 'utility') return state;
  const o = state.tiles[t.id]!;
  if (o.owner) return state;
  if (p.cash < t.price) return state;

  const tiles = { ...state.tiles, [t.id]: { ...o, owner: p.id } };
  let s: GameState = { ...state, tiles };
  s = updateActivePlayer(s, (pl) => ({ ...pl, cash: pl.cash - t.price }));
  s = appendLog(s, `${p.name} comprou ${t.name} por R$${t.price}.`);
  return { ...s, modal: null, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' };
}

function handleDeclineBuy(state: GameState): GameState {
  if (state.turnPhase !== 'awaiting-land-action') return state;
  return { ...state, modal: null, pendingLandingResolved: true, turnPhase: 'awaiting-end-turn' };
}

// Quiz actions ------------------------------------------------------------

function handleAnswerQuestion(state: GameState, optionId: string): GameState {
  if (state.turnPhase !== 'awaiting-quiz-answer' || !state.currentQuiz) return state;
  const q = getQuestion(state.currentQuiz);
  if (!q) return state;
  const opt = q.options.find((o) => o.id === optionId);
  if (!opt) return state;

  const correct = optionId === q.correctOptionId;
  const outcome: 'correct' | 'wrong' = correct ? 'correct' : 'wrong';

  // Record journal entry once per (tileId, questionId) pair.
  let s = recordQuizJournal(state, state.currentQuiz.tileId, q, outcome);

  // Update quiz stats + streak in a single player patch.
  s = updateActivePlayer(s, (pl) => {
    if (correct) {
      return {
        ...pl,
        quizStats: { ...pl.quizStats, correct: pl.quizStats.correct + 1 },
        correctAnswerStreak: pl.correctAnswerStreak + 1,
      };
    }
    return {
      ...pl,
      quizStats: { ...pl.quizStats, wrong: pl.quizStats.wrong + 1 },
      correctAnswerStreak: 0,
    };
  });

  const p = selActive(s);
  s = appendLog(
    s,
    `${p.name} respondeu ${correct ? 'corretamente' : 'incorretamente'} a pergunta da casa.`,
  );

  if (correct) {
    // Award streak bonus every Nth consecutive correct answer, then reset the
    // streak so the next bonus requires another full run.
    const streak = selActive(s).correctAnswerStreak;
    if (streak >= STREAK_BONUS_THRESHOLD) {
      s = updateActivePlayer(s, (pl) => ({
        ...pl,
        cash: pl.cash + STREAK_BONUS_AMOUNT,
        correctAnswerStreak: 0,
      }));
      s = appendLog(
        s,
        `${p.name} emendou ${STREAK_BONUS_THRESHOLD} acertos seguidos e recebeu R$${STREAK_BONUS_AMOUNT} de bonificação.`,
      );
    }
    // Quiz passed — NOW roll the dice. The 3-doubles prison check runs inside
    // performRoll. GameScreen auto-dispatches RESOLVE_MOVEMENT once turnPhase
    // enters `moving`. The dice 'fall' animation triggers off lastRoll change.
    return performRoll({ ...s, currentQuiz: null });
  }

  // Wrong answer: reset doublesStreak and apply a consolation move —
  // the player advances CONSOLATION_MOVE_STEPS tile(s) forward (banking the
  // pass-start bonus if they cross Manchester) and then resolves the landing
  // so cards, taxes and rents still fire. The one exception is an unowned
  // industry/transport/utility: we skip its buy offer (otherwise missing a
  // quiz would turn into a purchase opportunity).
  s = updateActivePlayer(s, (pl) => ({ ...pl, doublesStreak: 0 }));
  return applyConsolationMove({ ...s, currentQuiz: null, modal: null });
}

// Moves the active player CONSOLATION_MOVE_STEPS forward (with pass-start
// bonus), then resolves the landing via the normal handler. The only skipped
// effect is the buy offer for an unowned purchasable tile — a wrong answer
// must not become a shopping opportunity. Cards, taxes, rents and the
// go-to-prison corner all fire as usual.
function applyConsolationMove(state: GameState): GameState {
  const p = selActive(state);
  let pos = p.position;
  let cashDelta = 0;
  for (let i = 0; i < CONSOLATION_MOVE_STEPS; i++) {
    pos = (pos + 1) % BOARD_SIZE;
    if (pos === 0) cashDelta += PASS_START_BONUS;
  }

  let s = updateActivePlayer(state, (pl) => ({
    ...pl,
    position: pos,
    cash: pl.cash + cashDelta,
  }));
  s = appendLog(
    s,
    `${p.name} avança ${CONSOLATION_MOVE_STEPS} casa de consolação.`,
  );
  if (cashDelta > 0) {
    s = appendLog(s, `${p.name} passou pelo Início e recebeu R$${cashDelta}.`);
  }

  const tile = TILE_INDEX[pos]!;
  if (tile.role === 'corner' && tile.corner === 'go-to-prison') {
    s = sendActiveToPrison(s, 'detido durante o trajeto');
    return {
      ...s,
      turnPhase: 'awaiting-end-turn',
      lastRoll: null,
      pendingLandingResolved: true,
    };
  }

  // Hand off to the normal landing pipeline so cards/taxes/rents fire. Clear
  // lastRoll first — a wrong answer must not leave dice numbers around (rent
  // on utility tiles multiplies them).
  s = {
    ...s,
    turnPhase: 'awaiting-land-action',
    pendingLandingResolved: false,
    lastRoll: null,
  };
  const landed = handleResolveLanding(s);

  // Suppress the buy offer for unowned purchasable tiles — otherwise a wrong
  // answer would become a shopping opportunity. The landing is treated as
  // declined: the modal is dismissed and the turn ends.
  if (
    landed.modal?.kind === 'tile-info' &&
    landed.turnPhase === 'awaiting-land-action' &&
    !landed.pendingLandingResolved
  ) {
    return {
      ...landed,
      modal: null,
      pendingLandingResolved: true,
      turnPhase: 'awaiting-end-turn',
    };
  }
  return landed;
}

function handleBuyHint(state: GameState, hintId: string): GameState {
  if (state.turnPhase !== 'awaiting-quiz-answer' || !state.currentQuiz) return state;
  const q = getQuestion(state.currentQuiz);
  if (!q) return state;
  if (state.currentQuiz.revealedHints.includes(hintId)) return state;
  const hint = q.hints.find((h) => h.id === hintId);
  if (!hint) return state;
  const p = selActive(state);
  if (p.cash < hint.priceCash) return state;

  const revealedHints = [...state.currentQuiz.revealedHints, hintId];
  const eliminatedOptionIds =
    hint.kind === 'eliminate-option' && !state.currentQuiz.eliminatedOptionIds.includes(hint.payload)
      ? [...state.currentQuiz.eliminatedOptionIds, hint.payload]
      : state.currentQuiz.eliminatedOptionIds;

  let s: GameState = {
    ...state,
    currentQuiz: { ...state.currentQuiz, revealedHints, eliminatedOptionIds },
  };
  s = updateActivePlayer(s, (pl) => ({
    ...pl,
    cash: pl.cash - hint.priceCash,
    quizStats: {
      ...pl.quizStats,
      hintsBought: pl.quizStats.hintsBought + 1,
      cashSpentOnHints: pl.quizStats.cashSpentOnHints + hint.priceCash,
    },
  }));
  s = appendLog(s, `${p.name} comprou uma dica por R$${hint.priceCash}.`);
  return s;
}

function getQuestion(q: CurrentQuiz): Question | undefined {
  return (QUESTIONS[q.tileId] ?? []).find((x) => x.id === q.questionId);
}

function recordQuizJournal(
  state: GameState,
  tileId: TileId,
  question: Question,
  outcome: 'correct' | 'wrong',
): GameState {
  const key = `tile:${tileId}:${question.id}`;
  const exists = state.factsJournal.some(
    (e) => e.kind === 'tile' && e.refId === String(tileId) && e.questionId === question.id,
  );
  if (exists) return state;
  const t = TILE_INDEX[tileId]!;
  const entry: JournalEntry = {
    kind: 'tile',
    refId: String(tileId),
    title: t.education.title,
    date: t.education.date,
    blurb: t.education.blurb,
    source: t.education.source,
    seenAtTurn: state.turn,
    questionId: question.id,
    answerOutcome: outcome,
  };
  void key;
  return { ...state, factsJournal: [...state.factsJournal, entry] };
}

// Draw a deterministic question index from the current rngState, advancing the
// rng. Pure — same (rngState, tileId) maps to the same index every time.
export function drawQuestionIndex(rngState: number, count: number): { state: number; index: number } {
  const r = nextUint32(rngState);
  const index = count > 0 ? r.value % count : 0;
  return { state: r.state, index };
}

// Pick a newspaper issue: `count` distinct story ids, drawn uniformly from
// STORIES while skipping any id in `avoid`. Pure — advances rng once per
// successful draw. Falls back to the full corpus if `avoid` empties the pool.
export function pickIssue(
  rngState: number,
  count: number,
  avoid: ReadonlySet<string> = new Set(),
): { state: number; ids: string[] } {
  if (STORIES.length === 0 || count <= 0) return { state: rngState, ids: [] };
  const filtered = STORIES.filter((s) => !avoid.has(s.id));
  const pool = filtered.length >= count ? filtered : STORIES;
  const ids: string[] = [];
  let s = rngState;
  // Bounded retry per draw: with 65+ candidates and at most 3 picks, this
  // always finds a non-duplicate within a handful of attempts.
  while (ids.length < count) {
    const r = nextUint32(s);
    s = r.state;
    const candidate = pool[r.value % pool.length]!.id;
    if (ids.includes(candidate)) continue; // try again, advancing rng each retry
    ids.push(candidate);
  }
  return { state: s, ids };
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
  return appendLog(s, `${p.name} hipotecou ${t.name} por R$${t.mortgage}.`);
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
  return appendLog(s, `${p.name} resgatou ${t.name} por R$${cost}.`);
}

// DRAW_CARD / APPLY_CARD --------------------------------------------------

function handleDrawCard(state: GameState, deck: DeckId): GameState {
  if (state.turnPhase === 'awaiting-quiz-answer') return state;
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
  const deckName = deck === 'invention' ? 'Baralho de Invenções' : 'Baralho de Editais';
  s = appendLog(s, `${selActive(s).name} sacou "${card.title}" do ${deckName}.`);
  return s;
}

function handleApplyCard(state: GameState): GameState {
  if (state.turnPhase === 'awaiting-quiz-answer') return state;
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
    case 'gain': {
      let s = updateActivePlayer(state, (pl) => ({ ...pl, cash: pl.cash + effect.amount }));
      return appendLog(s, `${p.name} recebeu R$${effect.amount} (${card.title}).`);
    }
    case 'pay': {
      if (p.cash + netWorthExcludingCash(state, p.id) < effect.amount) {
        let s = appendLog(state, `${p.name} não pode pagar R$${effect.amount} — falido.`);
        s = markBankrupt(s, p.id);
        return checkWin(s);
      }
      let s = updateActivePlayer(state, (pl) => ({ ...pl, cash: pl.cash - effect.amount }));
      return appendLog(s, `${p.name} pagou R$${effect.amount} (${card.title}).`);
    }
    case 'move-to': {
      const target = effect.tileId;
      let cashDelta = 0;
      if (effect.passStartAward && target < p.position) cashDelta += PASS_START_BONUS;
      let s = updateActivePlayer(state, (pl) => ({
        ...pl,
        position: target,
        cash: pl.cash + cashDelta,
      }));
      const destName = TILE_INDEX[target]?.name ?? `casa ${target}`;
      s = appendLog(s, `${p.name} foi levado(a) para ${destName}.`);
      if (cashDelta > 0) s = appendLog(s, `${p.name} passou pelo Início e recebeu R$${cashDelta}.`);
      return s;
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
      let s = updateActivePlayer(state, (pl) => ({
        ...pl,
        position: pos,
        cash: pl.cash + cashDelta,
      }));
      const destName = TILE_INDEX[pos]?.name ?? `casa ${pos}`;
      const verb = effect.delta >= 0 ? 'avançou' : 'recuou';
      s = appendLog(s, `${p.name} ${verb} ${steps} casa(s) até ${destName}.`);
      if (cashDelta > 0) s = appendLog(s, `${p.name} passou pelo Início e recebeu R$${cashDelta}.`);
      return s;
    }
    case 'go-to-prison':
      return sendActiveToPrison(state, `por ${card.title}`);
    case 'keep-get-out-of-prison': {
      let s = updateActivePlayer(state, (pl) => ({ ...pl, getOutCards: pl.getOutCards + 1 }));
      return appendLog(s, `${p.name} guardou uma carta de Perdão Real.`);
    }
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
        let s = appendLog(state, `${p.name} deve R$${owed} — falido.`);
        s = markBankrupt(s, p.id);
        return checkWin(s);
      }
      let s = updateActivePlayer(state, (pl) => ({ ...pl, cash: pl.cash - owed }));
      return appendLog(s, `${p.name} pagou R$${owed} (${industries} indústrias + ${upgrades} melhorias).`);
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
      if (total > 0) s = appendLog(s, `${p.name} recebeu R$${total} dos demais jogadores (${card.title}).`);
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
  s = appendLog(s, `${p.name} pagou a taxa de R$${PRISON_FEE} da prisão.`);
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
    s = appendLog(s, `${p.name} foi forçado(a) a pagar a taxa de R$${PRISON_FEE}.`);
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
  if (state.turnPhase === 'awaiting-quiz-answer') return state;
  if (!state.pendingLandingResolved && state.turnPhase !== 'awaiting-end-turn') return state;
  const p = selActive(state);

  // Rotate the newspaper. Avoid the previous issue's headlines so back-to-back
  // duplication is minimised. Quiz-related exclusions are intentionally NOT
  // applied — overlap with the quiz corpus is the new ambient-hint mechanism.
  const prevIssue = state.currentNewspaper;
  const avoid = new Set<string>(prevIssue?.headlineIds ?? []);
  const issue = pickIssue(state.rngState, 6, avoid);
  const nextNewspaper = {
    issueNumber: (prevIssue?.issueNumber ?? 0) + 1,
    headlineIds: issue.ids,
  };

  if (state.lastRoll?.doubles && !p.inPrison && p.doublesStreak > 0 && p.doublesStreak < 3) {
    // Another roll for the same player.
    return {
      ...state,
      rngState: issue.state,
      currentNewspaper: nextNewspaper,
      lastResolvedTileId: null,
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
    rngState: issue.state,
    currentNewspaper: nextNewspaper,
    lastResolvedTileId: null,
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
