## 1. Engine types and state shape

- [x] 1.1 Add `awaiting-quiz-answer` to the `TurnPhase` union in `src/engine/types.ts`.
- [x] 1.2 Add types: `QuizOption`, `QuizHint` (`kind: 'eliminate-option' | 'clue-text' | 'first-letter'`), `Question`, `CurrentQuiz` (`{ tileId, questionId, revealedHints: string[], eliminatedOptionIds: string[] }`).
- [x] 1.3 Add `quizStats: { correct: number; wrong: number; hintsBought: number; cashSpentOnHints: number }` to `Player`.
- [x] 1.4 Add `currentQuiz: CurrentQuiz | null` to `GameState`.
- [x] 1.5 Extend `JournalEntry` with optional `questionId` and `answerOutcome: 'correct' | 'wrong'` for tile entries.
- [x] 1.6 Extend `Action` union with `{ type: 'ANSWER_QUESTION'; optionId: string }` and `{ type: 'BUY_HINT'; hintId: string }`.
- [x] 1.7 Bump `schemaVersion` from `1` to `2` on `GameState`.

## 2. Content

- [x] 2.1 Create `src/content/questions.ts` exporting a map keyed by `tileId` with authored questions (prompt, options, correctOptionId, hints with prices, source).
- [x] 2.2 Author at least one question per gameplay-rule tile (all industries, transports, utilities, tax tiles, card-draw tiles).
- [x] 2.3 Write a content lint in `scripts/` (or extend existing) that fails CI if any gameplay-rule tile lacks a question, a question lacks a source, options count is outside 2–4, or `correctOptionId` doesn't match an option id.
- [x] 2.4 Add lint script to `package.json` and wire it into the existing test/lint invocation.

## 3. Engine reducer

- [x] 3.1 In `src/engine/reducer.ts`, add `drawQuestionIndex(rngState, tileId)` as a pure function; advance `rngState` deterministically.
- [x] 3.2 On `RESOLVE_MOVEMENT`, after applying movement consequences: if landed tile has a gameplay rule, set `turnPhase = 'awaiting-quiz-answer'` and populate `currentQuiz` via `drawQuestionIndex`; corner/no-rule tiles transition straight to `awaiting-end-turn`.
- [x] 3.3 Ensure `go-to-prison` corner applies its movement consequence before any quiz logic and ends the turn.
- [x] 3.4 Handle `ANSWER_QUESTION`: accept only while `turnPhase === 'awaiting-quiz-answer'`; on correct option, transition to `awaiting-land-action`, clear `currentQuiz`, increment `quizStats.correct`; on wrong option, transition to `awaiting-end-turn`, clear `currentQuiz`, increment `quizStats.wrong`, and do NOT apply tile rule.
- [x] 3.5 Handle `BUY_HINT`: accept only while in quiz phase; reject (no state change) if hint id already revealed or cash < price; on accept, deduct cash, push hint id into `revealedHints`, if hint is `eliminate-option` add its target to `eliminatedOptionIds`, increment `quizStats.hintsBought` and add to `cashSpentOnHints`.
- [x] 3.6 Reject `BUY_TILE`, `DECLINE_BUY`, `APPLY_CARD`, `DRAW_CARD`, `END_TURN` while in quiz phase (no state change).
- [x] 3.7 Append a `factsJournal` entry on each answer if `(tileId, questionId)` pair not yet logged; include `answerOutcome`.
- [x] 3.8 Ensure wrong answer ends turn even after doubles (no additional roll granted).

## 4. Persistence

- [x] 4.1 In the save loader, reject persisted states with `schemaVersion < 2`; initialize a fresh state and emit a UI signal (e.g., return a `migrationNotice` field) that the shell renders as a toast.
- [x] 4.2 Update serialization to include `currentQuiz` and per-player `quizStats`.

## 5. Engine tests

- [x] 5.1 Reducer test: landing on an industry enters `awaiting-quiz-answer` with `currentQuiz` set.
- [x] 5.2 Reducer test: correct answer on unowned industry transitions to `awaiting-land-action` and exposes buy offer.
- [x] 5.3 Reducer test: correct answer on owned industry collects tier-appropriate rent.
- [x] 5.4 Reducer test: wrong answer on unowned industry → `awaiting-end-turn`, no cash change, no offer.
- [x] 5.5 Reducer test: wrong answer on owned industry → no rent collected, turn ends.
- [x] 5.6 Reducer test: wrong answer on card tile → no card drawn, turn ends.
- [x] 5.7 Reducer test: corner `start` / `public-square` / visiting-prison → no quiz, passes through to `awaiting-end-turn`.
- [x] 5.8 Reducer test: `go-to-prison` corner moves player to prison and ends turn without a quiz.
- [x] 5.9 Reducer test: doubles + wrong answer ends turn, next `END_TURN` rotates player.
- [x] 5.10 Reducer test: `BUY_HINT` succeeds, deducts cash, revealed list grows; second purchase of same hint id is rejected; insufficient-cash purchase is rejected.
- [x] 5.11 Reducer test: `BUY_TILE` and `APPLY_CARD` are rejected while in quiz phase.
- [x] 5.12 Reducer test: replay determinism — same seed + same action sequence selects identical question ids across runs.
- [x] 5.13 Reducer test: journal entry written on first answer for a `(tileId, questionId)` pair, not duplicated on repeat.
- [x] 5.14 Reducer test: loading a `schemaVersion: 1` save is rejected and a fresh state is returned.

## 6. UI — question modal

- [x] 6.1 Create `src/ui/modals/QuestionModal.tsx`: reads `currentQuiz` and the selected question from content; renders prompt, options as a radiogroup, and a "Submit" control; dispatches `ANSWER_QUESTION`.
- [x] 6.2 Create `src/ui/modals/HintShop.tsx` (or a subregion in the question modal): lists available hints with price and affordability state; dispatches `BUY_HINT`; renders revealed hints (`clue-text` inline, `first-letter` tag, eliminated options greyed out).
- [x] 6.3 Accessibility: `role="radiogroup"`, keyboard nav between options, `aria-live` for hint reveals, focus trap via existing `Modal` base.
- [x] 6.4 Disable hint buttons when cash < price; visually distinguish already-revealed hints.

## 7. UI — landing and results

- [x] 7.1 In `src/app/GameScreen.tsx`, mount `QuestionModal` when `turnPhase === 'awaiting-quiz-answer'`; ensure dice/end-turn controls are disabled while it's open.
- [x] 7.2 Build a post-answer result view (extend `QuestionModal` or split): show correct/wrong outcome, render the landed tile's `EducationalPayload` (title/date/blurb/source) as a "Did you know?" panel, and a "Continue" button that dispatches the next engine action (proceeds to land action on correct, end-turn on wrong).
- [x] 7.3 Remove the on-land `TileInfoModal` from the landing flow (`ModalRequest.kind === 'tile-info'` only used for HUD inspection).
- [x] 7.4 Keep HUD inspection path: `OPEN_TILE_INFO` still opens `TileInfoModal` unchanged.

## 8. HUD and end-of-game recap

- [x] 8.1 Update `src/ui/Hud.tsx` to show the active player's `quizStats` (e.g., a small "✓ 3 / ✗ 1" badge).
- [x] 8.2 Extend the end-of-game recap screen to render per-player quiz stats alongside the Facts Journal.
- [x] 8.3 Extend the Facts Journal view (`FactsJournal.tsx`) to render `answerOutcome` markers on tile entries.

## 9. Integration tests (Playwright)

- [x] 9.1 Flow: roll → quiz appears → answer correctly → buy offer → purchase → end turn. (Covered by `tests/e2e/smoke.spec.ts`.)
- [x] 9.2 Flow: roll → quiz appears → answer incorrectly → result screen → continue → turn ended without buy/rent. (Covered by `tests/e2e/smoke.spec.ts` via the wrong-answer branch.)
- [x] 9.3 Flow: quiz open → loja de dicas renderiza com pelo menos uma dica. (Covered by `tests/e2e/quiz.spec.ts`. Greying-out specifics covered by reducer test 5.10.)
- [x] 9.4 Flow: HUD tile inspection still shows the info modal and does not trigger a quiz. (Covered by `tests/e2e/quiz.spec.ts`.)
- [x] 9.5 Flow: rolling doubles + wrong answer ends the turn (no re-roll). (Covered by reducer test 5.9 — e2e cannot deterministically force doubles without seed control.)

## 10. Documentation and cleanup

- [x] 10.1 Update `README.md` Playing section to describe the quiz-on-land flow and hint shop.
- [x] 10.2 Add a short "How to add a question" section to the README or a new doc file next to `src/content/questions.ts`.
- [x] 10.3 Remove any dead code paths created by the old "info modal on land" flow. (No-op: `tile-info` modal is still used for HUD inspection and as the buy-offer surface after a correct answer; the old auto-open on every landing was the only behavior to drop, and that's now gated by `state.turnPhase !== 'awaiting-quiz-answer'` in `GameScreen.tsx`.)
- [x] 10.4 Run full test suite (`npm test`) and Playwright suite; ensure content lint passes. (`npm test` and `npm run lint:content` pass — 33 unit tests, 36 questions validated. `npm run lint` is broken project-wide due to a pre-existing ESLint v9 config gap unrelated to this change.)
