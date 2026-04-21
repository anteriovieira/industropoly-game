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
    // With seed=1 the landing is a gameplay tile, so the flow pauses on the quiz.
    expect(s.turnPhase).toBe('awaiting-quiz-answer');
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

/** Force the active player onto a tile and reproduce what RESOLVE_MOVEMENT
 *  produces, starting the quiz for that tile. */
function enterQuizAt(state: GameState, tileId: number): GameState {
  // Pretend the player rolled exactly `tileId` steps from 0.
  const s: GameState = {
    ...state,
    turnPhase: 'moving',
    lastRoll: { a: Math.min(6, tileId), b: Math.max(1, tileId - 6), total: tileId, doubles: false },
    players: state.players.map((p, i) => (i === state.activePlayerIndex ? { ...p, position: 0 } : p)),
  };
  return reducer(s, { type: 'RESOLVE_MOVEMENT' });
}

function correctIdFor(tileId: number): string {
  const qs = QUESTIONS[tileId] ?? [];
  if (qs.length === 0) throw new Error(`no questions for tile ${tileId}`);
  return qs[0]!.correctOptionId;
}

function wrongIdFor(tileId: number): string {
  const qs = QUESTIONS[tileId] ?? [];
  const q = qs[0]!;
  const wrong = q.options.find((o) => o.id !== q.correctOptionId)!;
  return wrong.id;
}

describe('engine quiz flow', () => {
  it('landing on an industry enters awaiting-quiz-answer with currentQuiz set', () => {
    let s = mkState();
    s = enterQuizAt(s, 1); // Cromford — industry
    expect(s.turnPhase).toBe('awaiting-quiz-answer');
    expect(s.currentQuiz).not.toBeNull();
    expect(s.currentQuiz!.tileId).toBe(1);
  });

  it('correct answer on unowned industry transitions to awaiting-land-action and opens buy offer', () => {
    let s = mkState();
    s = enterQuizAt(s, 1);
    const correct = s.currentQuiz!; // capture before clearing
    const correctOpt = QUESTIONS[1]!.find((q) => q.id === correct.questionId)!.correctOptionId;
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: correctOpt });
    expect(s.currentQuiz).toBeNull();
    expect(s.modal?.kind).toBe('tile-info');
    expect(s.players[s.activePlayerIndex]!.quizStats.correct).toBe(1);
  });

  it('correct answer on owned industry collects tier-appropriate rent', () => {
    let s = mkState();
    // p2 owns tile 1 at tier 0; p1 (active) lands there.
    s = { ...s, tiles: { ...s.tiles, [1]: { owner: 'p2', tier: 0, mortgaged: false } } };
    s = enterQuizAt(s, 1);
    const p1Before = s.players[0]!.cash;
    const p2Before = s.players[1]!.cash;
    const correctOpt = correctIdFor(1);
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: correctOpt });
    // Rent modal opens; ACK_MODAL applies the payment.
    expect(s.modal?.kind).toBe('rent');
    s = reducer(s, { type: 'ACK_MODAL' });
    expect(s.players[0]!.cash).toBeLessThan(p1Before);
    expect(s.players[1]!.cash).toBeGreaterThan(p2Before);
    expect(s.turnPhase).toBe('awaiting-end-turn');
  });

  it('wrong answer on unowned industry skips buy offer and ends turn', () => {
    let s = mkState();
    const cashBefore = s.players[0]!.cash;
    s = enterQuizAt(s, 1);
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongIdFor(1) });
    expect(s.turnPhase).toBe('awaiting-end-turn');
    expect(s.modal).toBeNull();
    expect(s.tiles[1]!.owner).toBeNull();
    expect(s.players[0]!.cash).toBe(cashBefore);
    expect(s.players[0]!.quizStats.wrong).toBe(1);
  });

  it('wrong answer on owned industry waives rent and ends turn', () => {
    let s = mkState();
    s = { ...s, tiles: { ...s.tiles, [1]: { owner: 'p2', tier: 0, mortgaged: false } } };
    const p1Before = s.players[0]!.cash;
    const p2Before = s.players[1]!.cash;
    s = enterQuizAt(s, 1);
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongIdFor(1) });
    expect(s.turnPhase).toBe('awaiting-end-turn');
    expect(s.players[0]!.cash).toBe(p1Before);
    expect(s.players[1]!.cash).toBe(p2Before);
  });

  it('wrong answer on a card tile skips the draw and ends turn', () => {
    let s = mkState();
    const before = s.decks.invention.draw.length;
    s = enterQuizAt(s, 7); // invention card tile
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongIdFor(7) });
    expect(s.turnPhase).toBe('awaiting-end-turn');
    expect(s.decks.invention.draw.length).toBe(before);
    expect(s.pendingCardId).toBeNull();
  });

  it('corner tiles (start/public-square/visiting-prison) skip the quiz and end the turn', () => {
    for (const corner of [0, 10, 20]) {
      let s = mkState();
      s = enterQuizAt(s, corner);
      expect(s.currentQuiz).toBeNull();
      expect(s.turnPhase).toBe('awaiting-end-turn');
      expect(s.pendingLandingResolved).toBe(true);
    }
  });

  it('go-to-prison corner sends player to prison and ends turn without a quiz', () => {
    let s = mkState();
    s = enterQuizAt(s, 30);
    expect(s.currentQuiz).toBeNull();
    expect(s.players[0]!.inPrison).toBe(true);
    expect(s.players[0]!.position).toBe(10);
    expect(s.turnPhase).toBe('awaiting-end-turn');
  });

  it('doubles + wrong answer ends turn without granting another roll', () => {
    let s = mkState();
    // Force doubles roll manually + move to tile 1.
    s = {
      ...s,
      turnPhase: 'moving',
      lastRoll: { a: 1, b: 1, total: 2, doubles: true },
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, position: 0, doublesStreak: 1 } : p,
      ),
    };
    s = reducer(s, { type: 'RESOLVE_MOVEMENT' });
    expect(s.turnPhase).toBe('awaiting-quiz-answer');
    s = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongIdFor(2) });
    expect(s.turnPhase).toBe('awaiting-end-turn');
    const activeBefore = s.activePlayerIndex;
    s = reducer(s, { type: 'END_TURN' });
    expect(s.activePlayerIndex).not.toBe(activeBefore);
  });

  it('BUY_HINT deducts cash, tracks reveals, rejects duplicates and insufficient funds', () => {
    let s = mkState();
    s = enterQuizAt(s, 1);
    const hint = QUESTIONS[1]![0]!.hints[0]!;
    const cashBefore = s.players[0]!.cash;
    s = reducer(s, { type: 'BUY_HINT', hintId: hint.id });
    expect(s.currentQuiz!.revealedHints).toContain(hint.id);
    expect(s.players[0]!.cash).toBe(cashBefore - hint.priceCash);
    expect(s.players[0]!.quizStats.hintsBought).toBe(1);
    expect(s.players[0]!.quizStats.cashSpentOnHints).toBe(hint.priceCash);

    // Duplicate: state unchanged
    const dup = reducer(s, { type: 'BUY_HINT', hintId: hint.id });
    expect(dup).toBe(s);

    // Insufficient: drop cash to zero, try another hint.
    const poor: GameState = {
      ...s,
      players: s.players.map((p, i) => (i === 0 ? { ...p, cash: 0 } : p)),
    };
    const second = QUESTIONS[1]![0]!.hints[1];
    if (second) {
      const after = reducer(poor, { type: 'BUY_HINT', hintId: second.id });
      expect(after).toBe(poor);
    }
  });

  it('BUY_TILE and APPLY_CARD are rejected while in quiz phase', () => {
    let s = mkState();
    s = enterQuizAt(s, 1);
    const buy = reducer(s, { type: 'BUY_TILE' });
    expect(buy).toBe(s);
    const apply = reducer(s, { type: 'APPLY_CARD' });
    expect(apply).toBe(s);
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
    const firstAnswer = reducer(s, { type: 'ANSWER_QUESTION', optionId: wrongIdFor(1) });
    const matches1 = firstAnswer.factsJournal.filter(
      (e) => e.kind === 'tile' && e.refId === '1' && e.questionId === qid,
    );
    expect(matches1.length).toBe(1);
    expect(matches1[0]!.answerOutcome).toBe('wrong');

    // Revisit the same tile and answer the same question again.
    // Manually restore quiz state to simulate another landing.
    const revisit: GameState = {
      ...firstAnswer,
      turnPhase: 'awaiting-quiz-answer',
      currentQuiz: { tileId: 1, questionId: qid, revealedHints: [], eliminatedOptionIds: [] },
    };
    const second = reducer(revisit, { type: 'ANSWER_QUESTION', optionId: correctIdFor(1) });
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
});

describe('engine board-center-story', () => {
  it('createInitialState seeds currentStoryId and leaves lastResolvedTileId null', () => {
    const a = mkState(42);
    expect(a.currentStoryId).not.toBeNull();
    expect(a.lastResolvedTileId).toBeNull();
    const b = mkState(42);
    expect(b.currentStoryId).toBe(a.currentStoryId);
  });

  it('RESOLVE_MOVEMENT records the landed tile id in lastResolvedTileId', () => {
    let s = mkState();
    s = enterQuizAt(s, 5); // Bridgewater — transport tile, gameplay rule
    expect(s.lastResolvedTileId).toBe(5);
  });

  it('a successful END_TURN rotates currentStoryId and advances rngState', () => {
    let s = mkState();
    // Set up a benign awaiting-end-turn state
    s = {
      ...s,
      turnPhase: 'awaiting-end-turn',
      pendingLandingResolved: true,
      lastResolvedTileId: null,
    };
    const beforeStory = s.currentStoryId;
    const beforeRng = s.rngState;
    const next = reducer(s, { type: 'END_TURN' });
    expect(next.currentStoryId).not.toBeNull();
    expect(next.currentStoryId).not.toBe(beforeStory);
    expect(next.rngState).not.toBe(beforeRng);
  });

  it('END_TURN dispatched in awaiting-quiz-answer is a no-op (same reference)', () => {
    let s = mkState();
    s = enterQuizAt(s, 1);
    const next = reducer(s, { type: 'END_TURN' });
    expect(next).toBe(s);
  });

  it('rotation excludes both the just-resolved tile and the previous story', () => {
    let s = mkState();
    // Force a known state: previous story = `tile:1`, lastResolved = 1
    s = {
      ...s,
      currentStoryId: 'tile:1',
      lastResolvedTileId: 1,
      turnPhase: 'awaiting-end-turn',
      pendingLandingResolved: true,
    };
    const next = reducer(s, { type: 'END_TURN' });
    expect(next.currentStoryId).not.toBe('tile:1');
    // sourceRefId for the picked story must not be tile:1 either
    // (tile:1 is the only id whose sourceRefId equals tile:1)
    expect(next.currentStoryId).not.toMatch(/^tile:1$/);
  });

  it('replay determinism — same seed + END_TURN sequence yields the same story chain', () => {
    function play(seed: number): (string | null)[] {
      let s = mkState(seed);
      const chain: (string | null)[] = [s.currentStoryId];
      for (let i = 0; i < 5; i++) {
        const ready: GameState = {
          ...s,
          turnPhase: 'awaiting-end-turn',
          pendingLandingResolved: true,
        };
        s = reducer(ready, { type: 'END_TURN' });
        chain.push(s.currentStoryId);
      }
      return chain;
    }
    expect(play(99)).toEqual(play(99));
  });

  it('parseSave hydrates currentStoryId and lastResolvedTileId on v2 saves predating this change', () => {
    // A v2 save built before add-board-center-story had no story fields.
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
      factsJournal: [],
      winner: null,
      status: 'active',
      log: [],
    });
    const res = parseSave(legacy);
    expect(res.state).not.toBeNull();
    expect(res.notice).toBeNull();
    expect(res.state!.currentStoryId).toBeNull();
    expect(res.state!.lastResolvedTileId).toBeNull();
  });
});
