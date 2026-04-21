## 1. Reducer — quiz now gates movement

- [x] 1.1 In `src/engine/reducer.ts` `handleRoll`, after the dice are rolled and the doubles-streak / three-doubles-prison logic runs, decide whether to enter the quiz. If the active player's current tile (TILE_INDEX[player.position]) has at least one authored question (`QUESTIONS[tileId]?.length > 0` and not a corner), call a new `startQuizForCurrentTile(state, position)` and return; otherwise return the state with `turnPhase: 'moving'` as today.
- [x] 1.2 Rename `startQuizForTile` to `startQuizForCurrentTile` (one caller). Leave the body identical; update the JSDoc to note it is invoked from `handleRoll` against the player's CURRENT position, not from movement.
- [x] 1.3 In `handleResolveMovement`, **remove** the quiz-trigger branch: gameplay tiles now go straight to `awaiting-land-action` (same as today's corner branch), corners follow today's logic. Drop the `startQuizForTile(s, pos)` return and the `tileNeedsQuiz` helper if it becomes unused. Keep recording `lastResolvedTileId` to the landed tile (used by the next turn's quiz target).
- [x] 1.4 Wait — `lastResolvedTileId` is what feeds the NEXT turn's quiz, but the actual lookup uses `player.position` directly. Confirm `lastResolvedTileId` no longer drives gameplay; keep the field but stop relying on it for routing. The newspaper rotation already does not use it.
- [x] 1.5 In `handleAnswerQuestion`, the **correct** branch must transition to `turnPhase: 'moving'` (NOT `awaiting-land-action`); the auto-dispatch in `GameScreen` will then run `RESOLVE_MOVEMENT`. Remove the inline call to `handleResolveLanding` in the correct branch.
- [x] 1.6 In `handleAnswerQuestion`, the **wrong** branch must clear `lastRoll` to null in addition to the existing changes (currentQuiz=null, turnPhase='awaiting-end-turn', pendingLandingResolved=true, modal=null, doublesStreak=0). The player's `position` MUST stay unchanged — this is the explicit "you didn't move" outcome.
- [x] 1.7 Confirm `handleResolveMovement` does NOT consume RNG anymore (since it no longer picks a question). All replay-determinism asserts must continue to hold under the new flow.

## 2. Reducer — newspaper is now 6 items

- [x] 2.1 Update `pickIssue` callers to count = 6: in `handleEndTurn` (the rotation site).
- [x] 2.2 Update `src/engine/init.ts` to call `pickIssue(s2.state, 6)`.

## 3. UI — QuestionModal copy

- [x] 3.1 In `src/ui/modals/QuestionModal.tsx`, **remove** the line `Acerte para seguir com a regra da casa. Errar encerra o turno.` and replace it with a single italic sub-header `*O Cronista pergunta:*` rendered above the prompt at small size, opacity ~0.7.
- [x] 3.2 In the result phase, change the body wording: correct → `Sua peça avança.`, wrong → `Você fica parado neste turno.`
- [x] 3.3 In the result phase, change the educational panel header from `Você sabia?` to `Lembrete`.

## 4. UI — NewspaperPanel rebuilt as 3-column framed page

- [x] 4.1 In `src/scene/NewspaperPanel.tsx`, replace the current layout with a 3-column layout that consumes `newspaper.headlineIds[0..5]`: index 0 is the lead (full-width title + ~140-char snippet); indices 1–5 are secondary items arranged in a 3-column grid (cells: row 0 cols 0–2 → ids 1, 2, 3; row 1 cols 0–1 → ids 4, 5; col 2 row 1 empty).
- [x] 4.2 Add a thin border frame: 4 `<mesh>` planes (top, bottom, left, right) at `colors.ink` with low opacity (~0.6), sitting at the same y as the text (`BOARD.tileDepth/2 + 0.025`). Width chosen to inset slightly from the inner-area edge.
- [x] 4.3 Add a horizontal masthead rule (thin mesh) immediately below the masthead text and above the edition line.
- [x] 4.4 Add 2 vertical column-separator rules between the 3 secondary columns (only spanning the secondary grid area, not the lead).
- [x] 4.5 Typography sizes (drei `<Text>` `fontSize`):
  - Masthead: 0.7, no italic, `outlineWidth=0.012`, `colors.ink`.
  - Edition line: 0.28, italic, `colors.inkSoft`, opacity 0.85.
  - Lead title: 0.36, no italic, `colors.ink`.
  - Lead snippet: 0.22, `colors.inkSoft`.
  - Secondary title: 0.22, no italic, `colors.ink`.
  - Secondary snippet: 0.16, `colors.inkSoft`, lineHeight 1.25.
- [x] 4.6 Snippet trim helper: lead trims to ~140 chars on word boundary; secondary trims to ~70 chars. Keep the existing `trim()` helper or generalise it to accept `maxLen`.
- [x] 4.7 All `<Text>` elements set `raycast={() => null}`. Frame and column-rule meshes register no pointer handlers.
- [x] 4.8 If any of the 6 headline ids resolves to `undefined` via `getStoryById`, render that slot empty without throwing.

## 5. Engine tests

- [x] 5.1 Update existing `enterQuizAt` test helper: now it should set the player's position to `tileId` (not 0) and dispatch `ROLL_DICE` with a forced `lastRoll` so the new `handleRoll` finds the player parked on a quiz-eligible tile and enters the quiz. Adjust all callers.
- [x] 5.2 Add reducer test: `ROLL_DICE` while the active player is on tile 1 (Cromford, has a question) → `turnPhase === 'awaiting-quiz-answer'`, `currentQuiz.tileId === 1`, position unchanged at 1, `lastRoll` set.
- [x] 5.3 Add reducer test: `ROLL_DICE` while the active player is on tile 0 (Início, corner) → `turnPhase === 'moving'`, `currentQuiz === null`, `lastRoll` set.
- [x] 5.4 Add reducer test: wrong answer on the pre-move quiz → `position` unchanged, `lastRoll === null`, `turnPhase === 'awaiting-end-turn'`, `quizStats.wrong === 1`, `doublesStreak === 0`.
- [x] 5.5 Add reducer test: correct answer on the pre-move quiz → `turnPhase === 'moving'`, `currentQuiz === null`, `quizStats.correct === 1`. Then dispatching `RESOLVE_MOVEMENT` advances the token by `lastRoll.total`.
- [x] 5.6 Update existing tests "correct answer on owned industry collects rent", "wrong answer on owned industry waives rent", "wrong answer on card tile skips draw" — these used to model "lands then quiz". Rewrite them to model "park on tile X owned by p2 → roll → quiz → answer → outcome" matching the new flow. (For owned-rent: park p1 on tile owned by p2; roll; correct answer → moving → resolveMovement to NEW tile (rent applies only at the destination, which is a different tile). Note the semantics changed: rent is now only ever paid at the *destination*, not the *origin*.)
- [x] 5.7 Update the "doubles + wrong answer" test for the new ordering: roll doubles → wrong answer on pre-move quiz → `END_TURN` rotates the player.
- [x] 5.8 Update the newspaper tests to expect `headlineIds.length === 6` everywhere (init seed, post-rotation length, no-overlap with previous issue still holds with avoid set).
- [x] 5.9 Add a regression assert: `RESOLVE_MOVEMENT` no longer changes `rngState` (it used to consume RNG for question selection). Two reductions of `RESOLVE_MOVEMENT` from the same prior state must produce equal `rngState`.

## 6. Documentation

- [x] 6.1 Update README "How the game teaches" section: the quiz now fires on roll about the tile you're parked on; wrong = stay; right = move and the landing rule applies as usual. Mention that the first turn is quiz-free for everyone (corner start).
- [x] 6.2 Note that the newspaper now ships 6 items per edition in a 3-column page with masthead, edition line, lead, and 5 secondary items.

## 7. Verification

- [x] 7.1 Run `npm run typecheck`, `npm test`, `npm run lint:content`, `npm run build` — all green.
- [x] 7.2 Manual smoke (dev server): start a new game, roll on turn 1 (Início) → no quiz, token moves; on turn 2 with the player parked on a real tile → quiz fires for that tile; wrong answer keeps the token in place and ends the turn; right answer animates the dice and the token; the central panel shows masthead + edition line + lead + 5 secondary items inside a thin frame.
