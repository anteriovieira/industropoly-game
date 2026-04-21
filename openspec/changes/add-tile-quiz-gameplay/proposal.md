## Why

Industropoly's core purpose is to teach players about the Industrial Revolution, but the current "land → read info modal → collect rent/buy" loop is passive: a player can skip the text, pay, and move on without any signal they learned anything. To turn each tile landing into a real learning moment, we want the tile's educational content to drive a question the player must answer to earn the right to act on the tile. Getting it wrong should have a clear gameplay cost (turn ends) so that reading/listening to content is actually rewarded, and buying hints gives a strategic way to trade resources for a safer answer.

## What Changes

- Replace the "info modal appears on landing" flow with a **quiz-first flow**: when a token's movement resolves on a tile, the app shows a question tied to that tile's content before any gameplay rule (buy, rent, tax, card draw, prison, etc.) runs.
- Each question SHALL have a prompt text, 2–4 selectable options, exactly one correct answer, and a reference back to the tile's educational payload.
- **Correct answer** → the tile's normal rule proceeds as today (purchase offer, rent collection, card draw, tax, prison transition, etc.).
- **Wrong answer** → the tile's rule is skipped and the turn ends automatically (no buy/rent/card effect applies; any prison-entry effect still applies because it is a movement consequence, not a tile rule — see design.md).
- Add a **hint shop** inside the question view: players can spend money to reveal hints that reduce difficulty (eliminate one wrong option, reveal a textual clue, or reveal the first letter of the correct answer). Hint pricing and availability are per-question.
- Keep the educational info (title, date, blurb, source) reachable, but show it **after** the question resolves (as a "Did you know?" panel on the result screen) so that the player reads content with the answer in mind. The Info modal from the HUD/tile inspection remains unchanged for out-of-turn learning.
- Add quiz content alongside each tile in `src/content/tiles.ts` (or a parallel `src/content/questions.ts` keyed by tile id), with a lint rule that every tile has at least one question and every question has a source.
- Track per-player quiz stats (correct / wrong / hints purchased) so the end-of-game recap can show a learning score in addition to the Facts Journal.

## Capabilities

### New Capabilities
- `tile-quiz-gameplay`: Pre-rule question prompt on tile landing, answer evaluation, wrong-answer turn termination, and the hint shop (purchase + reveal mechanics).

### Modified Capabilities
- `education-layer`: The "educational modal on tile interaction" requirement is replaced by "quiz on landing + post-answer info panel"; tile inspection from HUD still shows the info modal unchanged; Facts Journal now also records questions seen and whether they were answered correctly.
- `game-engine`: Turn flow adds a `awaiting-quiz-answer` phase between `moving` and `resolving-tile`; a wrong answer transitions directly to `end-turn`, skipping tile-rule resolution.

## Impact

- **Code**:
  - `src/engine/types.ts`, `src/engine/reducer.ts`: new state phase, new actions (`ANSWER_QUESTION`, `BUY_HINT`), wrong-answer early-end.
  - `src/app/GameScreen.tsx`, `src/ui/Hud.tsx`: render new `QuestionModal` when in quiz phase; block dice/end-turn controls while quiz is open.
  - `src/ui/modals/TileInfoModal.tsx`: keep for HUD inspection; new `QuestionModal.tsx` and `HintShop.tsx` components.
  - `src/content/`: new `questions.ts` with per-tile question sets; content lint in `scripts/` (if present) updated.
- **Content**: Every tile in `src/content/tiles.ts` needs at least one question written and source-cited.
- **Tests**: Reducer tests for new phase transitions; Playwright flows in `tests/` for correct-answer and wrong-answer paths; hint purchase.
- **No external dependencies** added.
- **Breaking for save files**: the engine state shape changes (new phase/fields). Since `persistence` is still in-flight, we bump the save schema version and drop older saves on load.
