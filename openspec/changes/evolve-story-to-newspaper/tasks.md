## 1. Engine state

- [x] 1.1 In `src/engine/types.ts`, add `Newspaper` type (`{ issueNumber: number; headlineIds: string[] }`).
- [x] 1.2 Replace `currentStoryId: string | null` on `GameState` with `currentNewspaper: Newspaper | null`. Leave `lastResolvedTileId` unchanged.

## 2. Reducer

- [x] 2.1 In `src/engine/reducer.ts`, replace `pickStoryId(rngState, exclude)` with `pickIssue(rngState, count, avoid?: ReadonlySet<string>): { state, ids: string[] }`. Implementation: draw `count` distinct ids from `STORIES`, advancing the rng once per draw, retrying on duplicates. `avoid` defaults to an empty set; the caller passes the previous issue's headline ids.
- [x] 2.2 In `handleEndTurn`, on every accepted path (re-roll on doubles AND rotation to next player), call `pickIssue(state.rngState, 3, prevHeadlineSet)` and write `currentNewspaper = { issueNumber: prev?.issueNumber ?? 0 + 1, headlineIds }`. Remove the previous exclusion `Set` that pulled from `currentQuiz.tileId` and `lastResolvedTileId` — no longer applied.
- [x] 2.3 Confirm rejected `END_TURN` paths return the same state reference unchanged (no rotation, no rng advance).

## 3. Init

- [x] 3.1 In `src/engine/init.ts`, replace the single-story RNG draw with a `pickIssue(s2.state, 3)` call. Set `currentNewspaper: { issueNumber: 1, headlineIds: ids }` and use the returned state as `rngState`. Drop `currentStoryId` from the returned object.

## 4. Persistence

- [x] 4.1 In `src/lib/persist.ts` `parseSave`, drop the `currentStoryId` hydration line. Hydrate missing `currentNewspaper` to `null` for v2 saves predating this change. Keep `lastResolvedTileId` hydration.

## 5. Engine tests

- [x] 5.1 Init test: `createInitialState` returns `currentNewspaper.issueNumber === 1` and 3 distinct `headlineIds`; same seed yields the same array.
- [x] 5.2 Reducer test: a successful `END_TURN` increments `issueNumber` by 1, swaps every `headlineId` from the previous issue (no overlap), and advances `rngState`.
- [x] 5.3 Reducer test: a rejected `END_TURN` (e.g. dispatched in `awaiting-quiz-answer`) returns the same state reference.
- [x] 5.4 Reducer test: rotation does NOT exclude `currentQuiz.tileId` or `lastResolvedTileId` — set both to a tile id and assert that the new headline ids MAY include that tile (and definitely don't filter it out by construction; assert by running enough deterministic seeds to find at least one inclusion).
- [x] 5.5 Reducer test: replay determinism — same seed + identical `END_TURN` sequence produces the same chain of `currentNewspaper.headlineIds` arrays.
- [x] 5.6 Persistence test: `parseSave` of a v2 JSON without `currentNewspaper` returns a state with `currentNewspaper: null` and ignores any stale `currentStoryId`.
- [x] 5.7 Update or remove the existing `add-board-center-story` reducer tests that asserted `currentStoryId` semantics; replace with newspaper-equivalents.

## 6. 3D scene

- [x] 6.1 Replace `src/scene/StoryPanel.tsx` with `src/scene/NewspaperPanel.tsx`. Read `state.currentNewspaper`; resolve each id via `getStoryById`. If `currentNewspaper` is null or empty, render nothing.
- [x] 6.2 Layout: masthead "O Cronista Industrial" (or chosen final name) at top of the panel, an edition line `Edição <issueNumber>` below, then the lead headline (full title + ~140-char snippet), then the two side headlines side-by-side (title + ~80-char snippet). All `<Text>` elements use `colors.ink` / `colors.inkSoft`, full opacity, no italic on titles, italic only on the date line. `raycast={() => null}` on every text element.
- [x] 6.3 In `src/scene/Board.tsx`, swap the `<StoryPanel />` import/usage for `<NewspaperPanel />`. Keep the title plaque header treatment from the previous change.
- [x] 6.4 Manual visual check: dice and tokens render above the newspaper text; clicks pass through.

## 7. HUD modal

- [x] 7.1 Rewrite `src/ui/modals/StoryModal.tsx` to render the full current issue: title `📰 Jornal — Edição <issueNumber>`, then for each headline an `<article>` with title, full body (`StoryEntry.body`), and citation. Empty state if `currentNewspaper` is null.
- [x] 7.2 In `src/ui/Hud.tsx`, change the button label from "📜 História" to "📰 Jornal" (keep the `H` keyboard shortcut and `setStoryOpen` wiring).

## 8. Documentation

- [x] 8.1 Update the README "How the game teaches" section: the center panel is now an issue of "O Cronista Industrial" with 3 headlines per turn, intentionally overlapping with the quiz corpus to act as ambient study material.
- [x] 8.2 Note that hint exclusions are gone (was a deliberate reversal from `add-board-center-story`).

## 9. Verification

- [x] 9.1 Run `npm run typecheck`, `npm test`, `npm run lint:content`, `npm run build` — all green.
- [x] 9.2 Manual smoke: start a game, confirm the central panel shows masthead + 3 legible headlines; press `H` to open the modal; end a turn and confirm the issue rotates with a new edition number and headlines.
