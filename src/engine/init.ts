import type { GameState, Player, PlayerId, TileOwnership, TokenKind } from './types';
import { normalizeSeed, shuffle } from './rng';
import { TILES } from '@/content/tiles';
import { INVENTION_CARDS } from '@/content/invention-cards';
import { EDICT_CARDS } from '@/content/edict-cards';

export interface InitialPlayerInput {
  name: string;
  token: TokenKind;
}

const PLAYER_IDS: readonly PlayerId[] = ['p1', 'p2', 'p3', 'p4'] as const;
const STARTING_CASH = 1500;

export function createInitialState(players: InitialPlayerInput[], seed: number): GameState {
  if (players.length < 2 || players.length > 4) {
    throw new Error('Industropoly requires 2–4 players');
  }

  const tokens = new Set<TokenKind>();
  for (const p of players) {
    if (tokens.has(p.token)) throw new Error(`Duplicate token: ${p.token}`);
    tokens.add(p.token);
  }

  const rngSeed = normalizeSeed(seed);

  const inventionIds = INVENTION_CARDS.map((c) => c.id);
  const edictIds = EDICT_CARDS.map((c) => c.id);
  const s1 = shuffle(inventionIds, rngSeed);
  const s2 = shuffle(edictIds, s1.state);

  const playerList: Player[] = players.map((p, i) => ({
    id: PLAYER_IDS[i]!,
    name: p.name,
    token: p.token,
    cash: STARTING_CASH,
    position: 0,
    inPrison: false,
    prisonRollsLeft: 0,
    getOutCards: 0,
    bankrupt: false,
    doublesStreak: 0,
    quizStats: { correct: 0, wrong: 0, hintsBought: 0, cashSpentOnHints: 0 },
  }));

  const tiles: Record<number, TileOwnership> = {};
  for (const t of TILES) {
    tiles[t.id] = { owner: null, tier: 0, mortgaged: false };
  }

  return {
    schemaVersion: 2,
    seed: rngSeed,
    rngState: s2.state,
    turn: 1,
    activePlayerIndex: 0,
    turnPhase: 'awaiting-roll',
    players: playerList,
    order: playerList.map((p) => p.id),
    tiles,
    decks: {
      invention: { draw: s1.out, discard: [] },
      edict: { draw: s2.out, discard: [] },
    },
    lastRoll: null,
    modal: null,
    pendingCardId: null,
    pendingLandingResolved: false,
    currentQuiz: null,
    factsJournal: [],
    winner: null,
    status: 'active',
    log: [`O jogo começa — ${playerList.length} jogadores.`],
  };
}
