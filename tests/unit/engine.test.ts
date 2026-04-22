import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/engine/init';
import { reducer } from '@/engine/reducer';
import { computeRent } from '@/engine/selectors';
import type { GameState, TokenKind } from '@/engine/types';
import { TILES } from '@/content/tiles';
import { QUESTIONS } from '@/content/questions';
import { parseSave } from '@/lib/persist';

function mkState(seed = 1, tokens: TokenKind[] = ['locomotive', 'top-hat']): GameState {
  return createInitialState(
    tokens.map((t, i) => ({ name: `P${i + 1}`, token: t })),
    seed,
  );
}

// Variant that enables the optional consolation-move rule. Default is OFF;
// these tests were authored when consolation was the implicit behaviour.
function mkStateWithConsolation(seed = 1, tokens: TokenKind[] = ['locomotive', 'top-hat']): GameState {
  return createInitialState(
    tokens.map((t, i) => ({ name: `P${i + 1}`, token: t })),
    seed,
    { consolationMoveOnWrong: true },
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
    // Default start is the corner tile 0 (Início) — no quiz on roll, so the
    // flow goes straight to `moving` and RESOLVE_MOVEMENT advances the token.
    s = reducer(s, { type: 'ROLL_DICE' });
    const roll = s.lastRoll!.total;
    expect(s.turnPhase).toBe('moving');
    s = reducer(s, { type: 'RESOLVE_MOVEMENT' });
    expect(s.players[0]!.position).toBe(roll % 40);
    // The landed tile is a gameplay tile, so we go directly to land action.
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

// Helpers for quiz tests -----------------------------------------------------

/** Park the active player on `tileId` and dispatch ROLL_DICE so the new flow
 *  surfaces the quiz about THAT tile (the one the player is parked on). */
function enterQuizAt(state: GameState, tileId: number): GameState {
  const s: GameState = {
    ...state,
    turnPhase: 'awaiting-roll',
    lastRoll: null,
    players: state.players.map((p, i) =>
      i === state.activePlayerIndex ? { ...p, position: tileId } : p,
    ),
  };
  return reducer(s, { type: 'ROLL_DICE' });
}

/** Read the question id the engine selected for `state.currentQuiz` and return
 *  its correct/wrong option id from the live currentQuiz, not just QUESTIONS[tileId][0]. */
function correctOptionFor(state: GameState): string {
  const q = state.currentQuiz!;
  const question = QUESTIONS[q.tileId]!.find((x) => x.id === q.questionId)!;
  return question.correctOptionId;
}

function wrongOptionFor(state: GameState): string {
  const q = state.currentQuiz!;
  const question = QUESTIONS[q.tileId]!.find((x) => x.id === q.questionId)!;
  return question.options.find((o) => o.id !== question.correctOptionId)!.id;
}

describe('engine quiz flow', () => {
  it('ROLL_DICE on a quiz-eligible parked tile enters awaiting-quiz-answer about that tile, deferring the roll', () => {
    let s = mkState();
    s = enterQuizAt(s, 1); // Cromford — industry, has a question
    expect(s.turnPhase).toBe('awaiting-quiz-answer');
    expect(s.currentQuiz).not.toBeNull();
    expect(s.currentQuiz!.tileId).toBe(1);
    // Position is unchanged — the quiz happens BEFORE movement.
    expect(s.players[s.activePlayerIndex]!.position).toBe(1);
    // Dice are NOT rolled until the player answers correctly.
    expect(s.lastRoll).toBeNull();
  });

  it('ROLL_DICE on a corner skips the quiz and goes straight to moving', () => {
    let s = mkState();
    // Player starts on tile 0 (Início, corner). Roll: no quiz.
    s = reducer(s, { type: 'ROLL_DICE' });
    expect(s.currentQuiz).toBeNull();
    expect(s.turnPhase).toBe('moving');
    expect(s.lastRoll).not.toBeNull();
  });

  it('correct answer on the pre-move quiz rolls the dice and transitions to moving (then RESOLVE_MOVEMENT advances the token)', () => {
    let s = mkState();
    s = enterQuizAt(s, 1);
    expect(s.lastRoll).toBeNull();
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: correctOptionFor(s) });
    expect(s.currentQuiz).toBeNull();
    expect(s.turnPhase).toBe('moving');
    // Dice are rolled now.
    expect(s.lastRoll).not.toBeNull();
    const total = s.lastRoll!.total;
    expect(s.players[s.activePlayerIndex]!.quizStats.correct).toBe(1);
    s = reducer(s, { type: 'RESOLVE_MOVEMENT' });
    // Was parked at tile 1; advanced by `total`.
    expect(s.players[s.activePlayerIndex]!.position).toBe((1 + total) % 40);
  });

  it('wrong answer grants a 1-tile consolation move, clears lastRoll, ends turn', () => {
    let s = mkStateWithConsolation();
    // Park on tile 19 so the consolation move lands on tile 20 (Praça Pública,
    // a corner with no landing effect) — keeps the assertion about ending the
    // turn clean.
    s = enterQuizAt(s, 19);
    const cashBefore = s.players[0]!.cash;
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongOptionFor(s) });
    expect(s.turnPhase).toBe('awaiting-end-turn');
    expect(s.lastRoll).toBeNull();
    expect(s.players[0]!.position).toBe(20);
    expect(s.players[0]!.cash).toBe(cashBefore);
    expect(s.players[0]!.quizStats.wrong).toBe(1);
    expect(s.players[0]!.doublesStreak).toBe(0);
    expect(s.players[0]!.correctAnswerStreak).toBe(0);
  });

  it('wrong answer with default options (consolation OFF) keeps player parked and ends the turn', () => {
    let s = mkState();
    s = enterQuizAt(s, 19);
    const posBefore = s.players[0]!.position;
    const cashBefore = s.players[0]!.cash;
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongOptionFor(s) });
    expect(s.turnPhase).toBe('awaiting-end-turn');
    expect(s.lastRoll).toBeNull();
    expect(s.players[0]!.position).toBe(posBefore);
    expect(s.players[0]!.cash).toBe(cashBefore);
    expect(s.players[0]!.quizStats.wrong).toBe(1);
    expect(s.pendingLandingResolved).toBe(true);
  });

  it('correct answer on a parked owned-industry tile lets player move on (rent applies only at the destination)', () => {
    let s = mkState();
    // p1 parked on tile 1 owned by p2; correct answer → moves on, no rent at origin.
    s = { ...s, tiles: { ...s.tiles, [1]: { owner: 'p2', tier: 0, mortgaged: false } } };
    s = enterQuizAt(s, 1);
    const p1Before = s.players[0]!.cash;
    const p2Before = s.players[1]!.cash;
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: correctOptionFor(s) });
    expect(s.turnPhase).toBe('moving');
    // No rent has been collected yet — player is still en route.
    expect(s.players[0]!.cash).toBe(p1Before);
    expect(s.players[1]!.cash).toBe(p2Before);
  });

  it('consolation landing on an unowned industry does NOT trigger the buy offer', () => {
    let s = mkStateWithConsolation();
    // Tile 7 is a card tile; the consolation move lands on tile 8 (Soho de
    // Boulton — an unowned industry). The buy offer must be suppressed so a
    // wrong answer cannot become a shopping opportunity.
    s = enterQuizAt(s, 7);
    const cashBefore = s.players[0]!.cash;
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongOptionFor(s) });
    expect(s.players[0]!.position).toBe(8);
    expect(s.turnPhase).toBe('awaiting-end-turn');
    expect(s.modal).toBeNull();
    expect(s.tiles[8]!.owner).toBeNull();
    expect(s.players[0]!.cash).toBe(cashBefore);
  });

  it('consolation landing on an owned industry charges the rent', () => {
    let s = mkStateWithConsolation();
    // Tile 8 is an industry. Give it to p2, then park p1 on tile 7 (card) so
    // the consolation move drifts p1 onto tile 8 — rent must still apply.
    s = { ...s, tiles: { ...s.tiles, [8]: { owner: 'p2', tier: 0, mortgaged: false } } };
    s = enterQuizAt(s, 7);
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongOptionFor(s) });
    expect(s.players[0]!.position).toBe(8);
    // The rent modal is surfaced — the pipeline hands off to the standard
    // landing flow, which asks the player to acknowledge the rent charge.
    expect(s.modal?.kind).toBe('rent');
  });

  it('wrong answer parked on a card tile does NOT draw that tile\'s card (quiz gate held)', () => {
    let s = mkStateWithConsolation();
    s = enterQuizAt(s, 7); // invention card tile
    const before = s.decks.invention.draw.length;
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongOptionFor(s) });
    // Card from tile 7 was NOT drawn — the quiz gate blocked it. The player
    // drifts to tile 8 (industry, unowned) and the turn ends without a card.
    expect(s.decks.invention.draw.length).toBe(before);
    expect(s.pendingCardId).toBeNull();
    expect(s.players[0]!.position).toBe(8);
    expect(s.turnPhase).toBe('awaiting-end-turn');
  });

  it('consolation landing on a card tile draws a card (quiz was on the origin tile)', () => {
    let s = mkStateWithConsolation();
    // Park on tile 6 (industry) so the consolation move lands on tile 7
    // (invention card). The origin quiz was Cartwright's, not the card tile's
    // — so landing on tile 7 correctly draws from the invention deck.
    s = enterQuizAt(s, 6);
    const before = s.decks.invention.draw.length;
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongOptionFor(s) });
    expect(s.players[0]!.position).toBe(7);
    expect(s.turnPhase).toBe('drawing-card');
    expect(s.modal?.kind).toBe('card');
    expect(s.pendingCardId).not.toBeNull();
    expect(s.decks.invention.draw.length).toBe(before - 1);
  });

  it('doubles + wrong answer ends turn without granting another roll', () => {
    let s = mkState();
    // Park on tile 19 so the consolation lands on tile 20 (Praça Pública, a
    // corner with no landing effect). We can then assert turnPhase cleanly
    // transitioned to `awaiting-end-turn` and the doubles streak did not grant
    // the player another roll.
    s = enterQuizAt(s, 19);
    s = {
      ...s,
      lastRoll: { a: 3, b: 3, total: 6, doubles: true },
      players: s.players.map((p, i) => (i === 0 ? { ...p, doublesStreak: 1 } : p)),
    };
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongOptionFor(s) });
    expect(s.turnPhase).toBe('awaiting-end-turn');
    expect(s.lastRoll).toBeNull();
    const activeBefore = s.activePlayerIndex;
    s = reducer(s, { type: 'END_TURN' });
    expect(s.activePlayerIndex).not.toBe(activeBefore);
  });

  it('BUY_HINT deducts cash, tracks reveals, rejects duplicates and insufficient funds', () => {
    let s = mkState();
    s = enterQuizAt(s, 1);
    // Pick the question the engine actually selected (not always QUESTIONS[1][0]).
    const live = QUESTIONS[s.currentQuiz!.tileId]!.find((q) => q.id === s.currentQuiz!.questionId)!;
    const hint = live.hints[0]!;
    const cashBefore = s.players[0]!.cash;
    s = reducer(s, { type: 'BUY_HINT', hintId: hint.id });
    expect(s.currentQuiz!.revealedHints).toContain(hint.id);
    expect(s.players[0]!.cash).toBe(cashBefore - hint.priceCash);
    expect(s.players[0]!.quizStats.hintsBought).toBe(1);
    expect(s.players[0]!.quizStats.cashSpentOnHints).toBe(hint.priceCash);

    const dup = reducer(s, { type: 'BUY_HINT', hintId: hint.id });
    expect(dup).toBe(s);

    const poor: GameState = {
      ...s,
      players: s.players.map((p, i) => (i === 0 ? { ...p, cash: 0 } : p)),
    };
    const second = live.hints[1];
    if (second) {
      const after = reducer(poor, { type: 'BUY_HINT', hintId: second.id });
      expect(after).toBe(poor);
    }
  });

  it('BUY_TILE, APPLY_CARD and RESOLVE_MOVEMENT are rejected while in quiz phase', () => {
    let s = mkState();
    s = enterQuizAt(s, 1);
    expect(reducer(s, { type: 'BUY_TILE' })).toBe(s);
    expect(reducer(s, { type: 'APPLY_CARD' })).toBe(s);
    expect(reducer(s, { type: 'RESOLVE_MOVEMENT' })).toBe(s);
  });

  it('replay determinism — same seed + action sequence selects identical question ids', () => {
    const a0 = mkState(98765);
    const b0 = mkState(98765);
    const a1 = enterQuizAt(a0, 5);
    const b1 = enterQuizAt(b0, 5);
    expect(a1.currentQuiz?.questionId).toBe(b1.currentQuiz?.questionId);
    expect(a1.rngState).toBe(b1.rngState);
  });

  it('facts journal logs entry on first answer; does not duplicate on repeat (tile,question)', () => {
    let s = mkState();
    s = enterQuizAt(s, 1);
    const qid = s.currentQuiz!.questionId;
    const wrongOpt = wrongOptionFor(s);
    const firstAnswer = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongOpt });
    const matches1 = firstAnswer.factsJournal.filter(
      (e) => e.kind === 'tile' && e.refId === '1' && e.questionId === qid,
    );
    expect(matches1.length).toBe(1);
    expect(matches1[0]!.answerOutcome).toBe('wrong');

    // Player is still parked on tile 1 (wrong answer = no movement). Roll again
    // next turn — same tile, possibly the same question if the rng repeats it.
    const revisit: GameState = {
      ...firstAnswer,
      turnPhase: 'awaiting-quiz-answer',
      currentQuiz: { tileId: 1, questionId: qid, revealedHints: [], eliminatedOptionIds: [] },
    };
    const correctOpt = QUESTIONS[1]!.find((q) => q.id === qid)!.correctOptionId;
    const second = reducer(revisit, { type: 'ANSWER_QUESTION', optionId: correctOpt });
    const matches2 = second.factsJournal.filter(
      (e) => e.kind === 'tile' && e.refId === '1' && e.questionId === qid,
    );
    expect(matches2.length).toBe(1);
  });

  it('parseSave rejects schemaVersion 1 and returns a migration notice', () => {
    const legacy = JSON.stringify({ schemaVersion: 1, players: [] });
    const res = parseSave(legacy);
    expect(res.state).toBeNull();
    expect(res.notice).toMatch(/atualizado|incompat|novo/i);
  });

  it('three consecutive correct answers award the streak bonus and reset the streak', () => {
    let s = mkState();
    const startCash = s.players[0]!.cash;

    // First correct answer → streak=1, no bonus yet.
    s = enterQuizAt(s, 1);
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: correctOptionFor(s) });
    expect(s.players[0]!.correctAnswerStreak).toBe(1);
    expect(s.players[0]!.cash).toBe(startCash);

    // Second correct answer → streak=2.
    s = enterQuizAt(s, 3);
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: correctOptionFor(s) });
    expect(s.players[0]!.correctAnswerStreak).toBe(2);
    expect(s.players[0]!.cash).toBe(startCash);

    // Third correct answer → bonus of R$50, streak resets to 0.
    s = enterQuizAt(s, 5);
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: correctOptionFor(s) });
    expect(s.players[0]!.correctAnswerStreak).toBe(0);
    expect(s.players[0]!.cash).toBe(startCash + 50);
  });

  it('a wrong answer resets the correct-answer streak', () => {
    let s = mkState();
    s = enterQuizAt(s, 1);
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: correctOptionFor(s) });
    expect(s.players[0]!.correctAnswerStreak).toBe(1);

    s = enterQuizAt(s, 3);
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongOptionFor(s) });
    expect(s.players[0]!.correctAnswerStreak).toBe(0);
  });

  it('consolation move past the start tile awards the pass-start bonus', () => {
    let s = mkStateWithConsolation();
    // Park on tile 39 (the last tile before Manchester/Start at tile 0).
    s = enterQuizAt(s, 39);
    const cashBefore = s.players[0]!.cash;
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongOptionFor(s) });
    expect(s.players[0]!.position).toBe(0);
    expect(s.players[0]!.cash).toBe(cashBefore + 200);
  });

  it('consolation move landing on go-to-prison still sends the player to jail', () => {
    let s = mkStateWithConsolation();
    // Tile 29 → consolation move puts player on tile 30 (go-to-prison corner).
    s = enterQuizAt(s, 29);
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongOptionFor(s) });
    expect(s.players[0]!.inPrison).toBe(true);
    expect(s.players[0]!.position).toBe(10);
  });

  it('RESOLVE_MOVEMENT no longer consumes RNG (question selection moved to ROLL_DICE)', () => {
    // Park on a corner so ROLL_DICE goes straight to moving (no quiz).
    let s = mkState();
    s = reducer(s, { type: 'ROLL_DICE' }); // corner start, no quiz
    const beforeRng = s.rngState;
    s = reducer(s, { type: 'RESOLVE_MOVEMENT' });
    expect(s.rngState).toBe(beforeRng);
  });
});

describe('engine newspaper', () => {
  it('createInitialState seeds currentNewspaper.issueNumber=1 with 6 distinct ids', () => {
    const a = mkState(42);
    expect(a.currentNewspaper).not.toBeNull();
    expect(a.currentNewspaper!.issueNumber).toBe(1);
    expect(a.currentNewspaper!.headlineIds.length).toBe(6);
    const ids = new Set(a.currentNewspaper!.headlineIds);
    expect(ids.size).toBe(6);
    expect(a.lastResolvedTileId).toBeNull();
    const b = mkState(42);
    expect(b.currentNewspaper!.headlineIds).toEqual(a.currentNewspaper!.headlineIds);
  });

  it('a successful END_TURN increments issueNumber, swaps every headline, advances rngState', () => {
    let s = mkState();
    s = {
      ...s,
      turnPhase: 'awaiting-end-turn',
      pendingLandingResolved: true,
      lastResolvedTileId: null,
    };
    const beforeIssue = s.currentNewspaper!.issueNumber;
    const beforeIds = new Set(s.currentNewspaper!.headlineIds);
    const beforeRng = s.rngState;
    const next = reducer(s, { type: 'END_TURN' });
    expect(next.currentNewspaper!.issueNumber).toBe(beforeIssue + 1);
    // No overlap with the previous issue (avoid set covers prev headlines).
    for (const id of next.currentNewspaper!.headlineIds) {
      expect(beforeIds.has(id)).toBe(false);
    }
    expect(next.currentNewspaper!.headlineIds.length).toBe(6);
    expect(next.rngState).not.toBe(beforeRng);
  });

  it('END_TURN dispatched in awaiting-quiz-answer is a no-op (same reference)', () => {
    let s = mkState();
    s = enterQuizAt(s, 1);
    const next = reducer(s, { type: 'END_TURN' });
    expect(next).toBe(s);
  });

  it('rotation does NOT exclude currentQuiz.tileId or lastResolvedTileId', () => {
    // We sample several seeds and look for at least one issue containing
    // `tile:1` while lastResolvedTileId === 1, proving the filter is gone.
    let foundInclusion = false;
    for (let seed = 1; seed < 200 && !foundInclusion; seed++) {
      let s = mkState(seed);
      s = {
        ...s,
        lastResolvedTileId: 1,
        turnPhase: 'awaiting-end-turn',
        pendingLandingResolved: true,
        currentQuiz: { tileId: 1, questionId: 'x', revealedHints: [], eliminatedOptionIds: [] },
      };
      const next = reducer(s, { type: 'END_TURN' });
      if (next.currentNewspaper!.headlineIds.includes('tile:1')) foundInclusion = true;
    }
    expect(foundInclusion).toBe(true);
  });

  it('replay determinism — same seed + END_TURN sequence yields the same headline chain', () => {
    function play(seed: number): string[][] {
      let s = mkState(seed);
      const chain: string[][] = [s.currentNewspaper!.headlineIds.slice()];
      for (let i = 0; i < 5; i++) {
        const ready: GameState = {
          ...s,
          turnPhase: 'awaiting-end-turn',
          pendingLandingResolved: true,
        };
        s = reducer(ready, { type: 'END_TURN' });
        chain.push(s.currentNewspaper!.headlineIds.slice());
      }
      return chain;
    }
    expect(play(99)).toEqual(play(99));
  });

  it('parseSave hydrates currentNewspaper to null and ignores legacy currentStoryId', () => {
    const legacy = JSON.stringify({
      schemaVersion: 2,
      seed: 1,
      rngState: 1,
      turn: 1,
      activePlayerIndex: 0,
      turnPhase: 'awaiting-roll',
      players: [],
      order: [],
      tiles: {},
      decks: { invention: { draw: [], discard: [] }, edict: { draw: [], discard: [] } },
      lastRoll: null,
      modal: null,
      pendingCardId: null,
      pendingLandingResolved: false,
      currentQuiz: null,
      currentStoryId: 'tile:9', // legacy field — must be dropped
      factsJournal: [],
      winner: null,
      status: 'active',
      log: [],
    });
    const res = parseSave(legacy);
    expect(res.state).not.toBeNull();
    expect(res.notice).toBeNull();
    expect(res.state!.currentNewspaper).toBeNull();
    expect(res.state!.lastResolvedTileId).toBeNull();
    // Legacy field stripped — must not appear under either name.
    expect((res.state as unknown as { currentStoryId?: unknown }).currentStoryId).toBeUndefined();
  });

  it('RESOLVE_MOVEMENT records the landed tile id in lastResolvedTileId', () => {
    // Quiz no longer triggers on movement; instead we exercise the full
    // park → roll (corner so no quiz) → resolve flow and assert the landed
    // tile is recorded.
    let s = mkState();
    // Park the player one tile before tile 5; force lastRoll so the move lands on 5.
    s = {
      ...s,
      turnPhase: 'moving',
      lastRoll: { a: 2, b: 3, total: 5, doubles: false },
      players: s.players.map((p, i) =>
        i === s.activePlayerIndex ? { ...p, position: 0 } : p,
      ),
    };
    s = reducer(s, { type: 'RESOLVE_MOVEMENT' });
    expect(s.lastResolvedTileId).toBe(5);
  });
});
