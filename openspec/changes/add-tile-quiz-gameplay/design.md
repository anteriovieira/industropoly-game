## Context

Industropoly is an "edutainment" Monopoly-style game about the Industrial Revolution. Today's tile interaction is passive — landing opens a `TileInfoModal` with historical blurb/title/date/source and a button to continue to the tile's rule (buy, rent, card, tax, prison). Players can dismiss the modal without engaging with the content. We want the learning to be *load-bearing*: you must engage with the tile's content to unlock its gameplay effect.

Relevant existing code (from current repo state):
- `src/engine/types.ts` — `TurnPhase = 'awaiting-roll' | 'moving' | 'awaiting-land-action' | 'drawing-card' | 'awaiting-end-turn' | 'in-prison-decision' | 'game-over'`; `ModalRequest` includes `tile-info`, `card`, `rent`, `tax`, `prison`; `GameState` includes `factsJournal` and `log`.
- `src/engine/reducer.ts` — pure reducer owning phase transitions.
- `src/ui/modals/TileInfoModal.tsx`, `CardModal.tsx`, `RentModal.tsx`, `TaxModal.tsx`, `PrisonModal.tsx` — one modal per kind, selected by `ModalRequest`.
- `src/content/tiles.ts` — static tile data with `education` payload per tile.

Constraints:
- Engine must stay pure (testable under Node, no React/DOM).
- Existing `education-layer` spec is proposed but not yet archived — this change overrides it. `create-industropoly-game` is still in progress.
- No external dependencies should be added for this feature.
- Save schema (`schemaVersion: 1`) is treated as in-flight; bumping it and dropping old saves is acceptable.

Stakeholders: the single author/student playing, plus anyone building content. Content authoring is the heaviest cost of this change.

## Goals / Non-Goals

**Goals:**
- Gate tile rule resolution behind answering a content-linked multiple-choice question.
- Give wrong answers a clear, immediate gameplay cost: the turn ends.
- Let players trade cash for hints on a per-question basis.
- Keep the engine pure and deterministic (question selection seeded from `rngState`).
- Keep the Facts Journal as the source of truth for "what have I been exposed to," now including questions seen and answer correctness.
- Preserve tile inspection (HUD → tile click) as a read-only educational path with no quiz — you're not on that tile, you're just learning.

**Non-Goals:**
- Open-ended / free-text answers. MCQ only in this change.
- Adaptive difficulty / spaced repetition. Future work.
- Multi-question chains per tile. One question per landing.
- Quizzes on card draws. Cards stay informational for now; we revisit after the tile quiz proves the pattern.
- Localization of question text. Questions ship in the same language as tile content.
- Penalizing wrong answers beyond skipping the rule + ending turn (no cash loss, no extra move).

## Decisions

### Decision 1: Insert a new `awaiting-quiz-answer` phase between `moving` and `awaiting-land-action`

**Why:** The engine already models turn flow as a phase machine. Adding a dedicated phase keeps the reducer expressive and makes it trivial to assert from tests and the UI whether a quiz is open. A wrong answer transitions to `awaiting-end-turn` directly, bypassing `awaiting-land-action`.

**Flow:**
```
awaiting-roll → moving → awaiting-quiz-answer
                                   ├─ correct → awaiting-land-action (existing flow: buy/rent/card/tax)
                                   └─ wrong   → awaiting-end-turn    (rule is skipped)
```

**Corner cases handled up front:**
- **Corner tiles** (`start`, `public-square`, `prison` as visitor): no rule to gate → no question, phase passes straight through to `awaiting-end-turn` (these are also no-ops today).
- **`go-to-prison` corner**: going to prison is a *movement consequence*, not a tile rule. It applies **before** the quiz phase (equivalent to how it applies today before the info modal). So landing on "Go to Prison" moves you to prison and ends the turn, regardless of any quiz. Justification: the quiz's purpose is to gate tile rules (economic choices). A punitive movement consequence is not a rule the player can act on.
- **Card tile**: quiz gates the draw. Wrong answer → no draw, turn ends. Correct → draw happens as today.
- **Owned industry / transport / utility** (rent owed): quiz gates whether rent is collected. Wrong answer → rent is waived, turn ends. This is intentional and is the "reward" for answering; the owner loses out but the owner wasn't active anyway. Discussed under Risks.
- **Unowned purchasable tile**: quiz gates the buy offer. Wrong answer → no offer shown.
- **Tax tile**: quiz gates the tax. Wrong answer → tax waived, turn ends. Again intentional, mirrors the rent case.
- **Already-in-prison player**: no movement this turn, no quiz.
- **Doubles streak**: a correct answer resolves the tile; if doubles were rolled and player isn't sent to prison via streak, they still get to roll again as today. A wrong answer ends the turn even on doubles — this keeps the gameplay cost meaningful.

**Alternatives considered:**
- *Quiz as a modal within `awaiting-land-action`*: simpler state machine but harder to assert in the reducer which path (gated/ungated) was taken, and conflates the quiz with land actions. Rejected.
- *Quiz after land action applies*: would mean the player already got the benefit before answering. Defeats the purpose. Rejected.

### Decision 2: Keep engine pure; question selection is seeded from `rngState`

The reducer picks the question by `drawQuestionIndex(rngState, tileId)` — a pure function over the RNG state — so tests and replays are deterministic. The engine does not depend on any React/DOM module.

**Alternatives considered:**
- *Pick in the UI layer and dispatch `ASK_QUESTION { questionId }`*: would split truth between UI and engine and break determinism. Rejected.

### Decision 3: Content lives in `src/content/questions.ts`, keyed by `tileId`

Each entry:
```ts
{
  tileId: number,
  questions: [{
    id: string,
    prompt: string,
    options: [{ id: 'a'|'b'|'c'|'d', text: string }],
    correctOptionId: 'a'|'b'|'c'|'d',
    hints: [{ id: string, kind: 'eliminate-option' | 'clue-text' | 'first-letter', priceCash: number, payload: string }],
    source: string,   // citation
  }]
}
```

Why a separate file rather than embedding on `Tile`: content team can iterate on questions (and later expand to multiple per tile) without touching gameplay code, and the tile data stays focused on rules.

### Decision 4: Hints are per-question and purchased on the fly

- The question view exposes up to 3 hint buttons priced in cash (content-authored, not algorithmic).
- Hint types supported in v1: `eliminate-option` (greys out one wrong option), `clue-text` (adds a sentence of context above the prompt), `first-letter` (reveals the first letter of the correct option's text).
- Hints are stored as actions: `BUY_HINT { hintId }` mutates the engine (deduct cash, append to `currentQuiz.revealedHints[]`) so the server-side/engine is the source of truth.
- If the player can't afford the hint, the button is disabled; the reducer rejects the action if cash < price (defensive, should be unreachable via UI).

**Alternatives considered:**
- *Algorithmic hints with fixed prices* (e.g., always 50 to eliminate): simpler but can't tailor hints to content (e.g., a clue-text for a decree vs. an invention). Rejected.
- *Hint cost scales with tile price*: tempting but muddies per-question authoring. Rejected for v1.

### Decision 5: Move the educational blurb from "before rule" to "after answer"

- On both correct and wrong answers, the result screen shows the tile's `EducationalPayload` (title/date/blurb/source). This is the teach moment: the player now has the answer and can internalize the content.
- HUD tile inspection (`OPEN_TILE_INFO`) keeps the current `TileInfoModal` unchanged — out-of-turn browsing is still pure info, no quiz.

### Decision 6: Track a `QuizAttempt` ledger per player

Adds to `Player`:
- `quizStats: { correct: number; wrong: number; hintsBought: number; cashSpentOnHints: number }`

And adds to `GameState`:
- `currentQuiz: { tileId: TileId; questionId: string; revealedHints: string[]; eliminatedOptionIds: string[] } | null`

Justification: stats feed the end-of-game recap. `currentQuiz` holds the live question so the UI and reducer share one source of truth and the hint actions have something to mutate.

### Decision 7: Facts Journal entry is recorded on *answer*, not on *landing*

Old behavior logged the entry when the player saw the modal. New behavior logs it when the player answers (right or wrong), and the journal entry carries `answerOutcome: 'correct' | 'wrong' | 'skipped-by-hint'`. This makes the journal a real learning record rather than an "opened-modal" log.

### Decision 8: Bump `schemaVersion` from 1 to 2; drop older saves

The `persistence` capability is still pre-archive, so there are no real saves in the wild. On load, if `schemaVersion < 2`, discard the save and start a new game (with a user-visible toast: "Save format updated, starting fresh").

## Risks / Trade-offs

- **Wrong answer waives rent to a non-active owner** → the passive owner "loses out" even though they did nothing wrong. *Mitigation:* this is a deliberate teaching lever; it costs the active player nothing but denies them progress, and costs the owner a rent collection. Document in proposal + release notes. If user-testing shows it feels unfair, swap to "rent is paid but the tile's educational reward (e.g., card upgrade discount, Facts Journal entry) is withheld" in a follow-up.
- **Answer fatigue on long games** → 40 tiles × multiple laps × one question per land = a lot of questions. *Mitigation:* allow a question to be pooled across tiles in the same theme later; for v1, keep questions short (≤25 words prompt, ≤12 words per option). Content lint will enforce length.
- **Content authoring bottleneck** → every tile needs ≥1 question with source; this is a real amount of writing. *Mitigation:* ship a seed set of 1 question per tile, lint in CI, add a "needs-question" placeholder that fails the build for missing tiles so omissions can't sneak in.
- **Hint cost balance** → hints too cheap trivialize questions; too expensive, nobody uses them. *Mitigation:* start with content-authored prices, collect feel-data from playthroughs, adjust. Keep cost editable in content without code changes.
- **Determinism under replay** → adding an RNG-consuming step (question pick) means old replays won't match. *Mitigation:* replays don't exist yet; document that seeds produced before v2 are not reusable.
- **A11y** → question modal needs keyboard nav, screen-reader labelling, and must not trap focus after close. *Mitigation:* reuse the existing `Modal` base component's focus trap logic; add `role="radiogroup"` for options and `aria-live` for hint reveals.
- **Time pressure** → initial version has no timer; a timer was considered but rejected for v1 (makes wrong answers feel unfair for readers). Leave as Open Question.

## Migration Plan

1. Land engine changes (new phase, new actions, `currentQuiz`, stats) behind the existing flow disabled (a `featureFlags.quizOnLand: false` default) so the engine can merge without breaking the app.
2. Author question content for all 40 tiles in `src/content/questions.ts`; run content lint.
3. Build `QuestionModal.tsx` and `HintShop.tsx`; wire into `GameScreen.tsx` when phase === `awaiting-quiz-answer`.
4. Flip `featureFlags.quizOnLand` to `true` and remove `TileInfoModal` from the on-land path (it stays for HUD inspection).
5. Update the end-of-game recap to show per-player quiz stats alongside the Facts Journal.
6. No staged rollout needed — this is a single-device app; either the build ships the flag on or it doesn't. Rollback = flip flag off and re-wire `TileInfoModal` on-land.

## Open Questions

- **Timer per question?** Default: no timer. Worth revisiting once we have real playtest data.
- **Multiple questions per tile?** Content supports an array; the reducer picks one by seed. Do we want the seed to guarantee a different question per lap around the board, or is pure random OK? Default: pure random for v1.
- **Does a correct answer grant a small cash reward?** Could reinforce learning but changes balance. Default: no bonus in v1.
- **Should the "Go to Prison" corner have a question?** Above we say no (it's a movement consequence). Revisit if playtesting wants it.
- **Hint UI placement** — alongside options, or a "shop" drawer? Default: inline buttons above the option list, to keep hints visually tied to the question.
