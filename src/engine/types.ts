// Pure engine types. No React, no DOM. This module runs under Node for tests.

export type PlayerId = 'p1' | 'p2' | 'p3' | 'p4';

export type TokenKind =
  | 'locomotive'
  | 'top-hat'
  | 'cotton-bobbin'
  | 'pickaxe'
  | 'pocket-watch'
  | 'factory-chimney';

export type SectorId =
  | 'textiles'
  | 'coal-iron'
  | 'shipyards'
  | 'chemicals'
  | 'railways-industries'
  | 'publishing'
  | 'banking'
  | 'empire';

export type DeckId = 'invention' | 'edict';

export type TileId = number; // 0..39 around the board

export type CornerKind = 'start' | 'prison' | 'public-square' | 'go-to-prison';

// Educational payload attached to every tile and every card.
export interface EducationalPayload {
  title: string;
  date: string; // e.g. "1769" or "1776–1815"
  blurb: string; // 40–120 words
  source: string; // citation string (book/URL)
}

interface TileBase {
  id: TileId;
  name: string;
  education: EducationalPayload;
}

export interface CornerTile extends TileBase {
  role: 'corner';
  corner: CornerKind;
}

export interface IndustryTile extends TileBase {
  role: 'industry';
  sector: SectorId;
  price: number;
  // rents[0] = base rent, rents[1..4] = tier 1..4 (Factory..Foundry),
  // rents[5] = tier 5 (Empire). rents[0] with full sector monopoly doubles (engine-applied).
  rents: readonly [number, number, number, number, number, number];
  upgradeCost: number;
  mortgage: number;
}

export interface TransportTile extends TileBase {
  role: 'transport';
  price: number;
  // rent depends on how many transports the owner holds
  rentByCount: readonly [number, number, number, number];
  mortgage: number;
}

export interface UtilityTile extends TileBase {
  role: 'utility';
  price: number;
  // rent multiplier on dice roll; 4x if sole utility, 10x with both
  multipliers: readonly [number, number];
  mortgage: number;
}

export interface TaxTile extends TileBase {
  role: 'tax';
  amount: number;
}

export interface CardDrawTile extends TileBase {
  role: 'card';
  deck: DeckId;
}

export type Tile = CornerTile | IndustryTile | TransportTile | UtilityTile | TaxTile | CardDrawTile;

export type CardEffect =
  | { kind: 'gain'; amount: number }
  | { kind: 'pay'; amount: number }
  | { kind: 'move-to'; tileId: TileId; passStartAward: boolean }
  | { kind: 'move-by'; delta: number }
  | { kind: 'go-to-prison' }
  | { kind: 'keep-get-out-of-prison' }
  | { kind: 'pay-per-property'; perIndustry: number; perUpgrade: number }
  | { kind: 'collect-from-each'; amount: number };

export interface Card {
  id: string;
  deck: DeckId;
  title: string;
  // User-facing plain-language description of the effect.
  effectText: string;
  effect: CardEffect;
  education: EducationalPayload;
}

export interface QuizStats {
  correct: number;
  wrong: number;
  hintsBought: number;
  cashSpentOnHints: number;
}

export interface Player {
  id: PlayerId;
  name: string;
  token: TokenKind;
  cash: number;
  position: TileId; // 0..39
  inPrison: boolean;
  prisonRollsLeft: number; // 3..0
  getOutCards: number;
  bankrupt: boolean;
  doublesStreak: number; // consecutive doubles this turn (0..2)
  quizStats: QuizStats;
}

export interface TileOwnership {
  owner: PlayerId | null;
  tier: 0 | 1 | 2 | 3 | 4 | 5; // upgrade tier for industries
  mortgaged: boolean;
}

export type TurnPhase =
  | 'awaiting-roll'
  | 'moving'
  | 'awaiting-quiz-answer'
  | 'awaiting-land-action'
  | 'drawing-card'
  | 'awaiting-end-turn'
  | 'in-prison-decision'
  | 'game-over';

export type QuizHintKind = 'eliminate-option' | 'clue-text' | 'first-letter';

export interface QuizOption {
  id: string; // 'a' | 'b' | 'c' | 'd' (authored)
  text: string;
}

export interface QuizHint {
  id: string;
  kind: QuizHintKind;
  priceCash: number;
  // For `eliminate-option`: target option id.
  // For `clue-text`: the clue sentence shown to the player.
  // For `first-letter`: unused (UI derives from correct option's text).
  payload: string;
}

export interface Question {
  id: string;
  prompt: string;
  options: readonly QuizOption[]; // 2..4 options
  correctOptionId: string;
  hints: readonly QuizHint[];
  source: string;
}

export interface CurrentQuiz {
  tileId: TileId;
  questionId: string;
  revealedHints: string[]; // hint ids already purchased
  eliminatedOptionIds: string[]; // from eliminate-option hints
}

export type ModalRequest =
  | { kind: 'tile-info'; tileId: TileId; readOnly?: boolean }
  | { kind: 'card'; cardId: string }
  | { kind: 'rent'; tileId: TileId; owed: number }
  | { kind: 'tax'; tileId: TileId; owed: number }
  | { kind: 'prison' }
  | null;

export interface JournalEntry {
  kind: 'tile' | 'card';
  refId: string; // tile id as string or card id
  title: string;
  date: string;
  blurb: string;
  source: string;
  seenAtTurn: number;
  // Only set on tile entries produced by answering a landing quiz.
  questionId?: string;
  answerOutcome?: 'correct' | 'wrong';
}

export interface GameState {
  schemaVersion: 2;
  seed: number;
  rngState: number;
  turn: number; // turn counter (increments on END_TURN)
  activePlayerIndex: number;
  turnPhase: TurnPhase;

  players: Player[];
  order: PlayerId[]; // original order; bankrupt players remain but are skipped
  tiles: Record<TileId, TileOwnership>;

  decks: {
    invention: { draw: string[]; discard: string[] };
    edict: { draw: string[]; discard: string[] };
  };

  lastRoll: { a: number; b: number; total: number; doubles: boolean } | null;

  modal: ModalRequest;
  pendingCardId: string | null; // card drawn but not yet applied
  pendingLandingResolved: boolean; // true after land effect applied, required before end-turn

  // Live quiz shown during `awaiting-quiz-answer`. Null in any other phase.
  currentQuiz: CurrentQuiz | null;

  factsJournal: JournalEntry[];
  winner: PlayerId | null;
  status: 'active' | 'game-over';
  log: string[]; // short human-readable game log
}

// Actions

export type Action =
  | { type: 'ROLL_DICE' }
  | { type: 'RESOLVE_MOVEMENT' }
  | { type: 'RESOLVE_LANDING' }
  | { type: 'ACK_MODAL' } // close current info/rent/tax/card modal after effect applied
  | { type: 'OPEN_TILE_INFO'; tileId: TileId } // inspect a tile (read-only, no side effects)
  | { type: 'BUY_TILE' }
  | { type: 'DECLINE_BUY' }
  | { type: 'UPGRADE_TILE'; tileId: TileId }
  | { type: 'MORTGAGE_TILE'; tileId: TileId }
  | { type: 'REDEEM_TILE'; tileId: TileId }
  | { type: 'DRAW_CARD'; deck: DeckId }
  | { type: 'APPLY_CARD' } // apply effect of `pendingCardId`
  | { type: 'PAY_PRISON_FEE' }
  | { type: 'USE_GET_OUT_CARD' }
  | { type: 'PRISON_ROLL' } // try to roll doubles to escape
  | { type: 'ANSWER_QUESTION'; optionId: string }
  | { type: 'BUY_HINT'; hintId: string }
  | { type: 'END_TURN' };

export const PRISON_FEE = 50;
export const PASS_START_BONUS = 200;
export const MAX_TIER = 5;
