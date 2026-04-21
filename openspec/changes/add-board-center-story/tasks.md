## 1. Engine state

- [x] 1.1 Add `currentStoryId: string | null` and `lastResolvedTileId: TileId | null` to `GameState` in `src/engine/types.ts`.
- [x] 1.2 Initialize both fields in `src/engine/init.ts`: pick `currentStoryId` from a deterministic RNG draw at startup, `lastResolvedTileId = null`.

## 2. Story corpus

- [x] 2.1 Create `src/content/stories.ts` exporting `STORIES: readonly StoryEntry[]` and a helper `getStoryById(id)`. Derive entries from non-corner tiles (id format `tile:<n>`) and from both card decks (id format `card:<deckId>:<cardId>`).
- [x] 2.2 Each entry: `{ id, sourceKind: 'tile' | 'card', sourceRefId: string, title, body, citation }`. Body is the existing `education.blurb`; title and citation mirror the existing payload.
- [x] 2.3 Extend `scripts/lint-content.ts` (or add a tiny assertion) that confirms the corpus has ≥ 50 entries and no duplicate ids.

## 3. Reducer

- [x] 3.1 In `src/engine/reducer.ts`, add a pure helper `pickStoryId(rngState, exclude: ReadonlySet<string>): { state, storyId }` that uniformly picks from `STORIES` minus the exclusion set, advancing the RNG.
- [x] 3.2 In `startQuizForTile` (and the no-quiz branch in `handleResolveMovement`), set `lastResolvedTileId` to the landed tile id.
- [x] 3.3 In `handleEndTurn`, when the turn is actually advancing or granting a re-roll (i.e. the function returns a NEW state), compute exclusion `= { currentStoryId, "tile:" + currentQuiz?.tileId, "tile:" + lastResolvedTileId }` (filter out null/undefined entries), call `pickStoryId`, and set the new `currentStoryId` and `rngState`.
- [x] 3.4 Confirm rejected `END_TURN` paths return the same state reference unchanged (no-op).

## 4. Persistence

- [x] 4.1 In `src/lib/persist.ts` `parseSave`, hydrate missing `currentStoryId` to `null` and missing `lastResolvedTileId` to `null` for v2 saves predating this change. Do NOT bump `schemaVersion`.

## 5. Engine tests

- [x] 5.1 Init test: `createInitialState` returns a non-null `currentStoryId` and a `null` `lastResolvedTileId`; same seed yields same id.
- [x] 5.2 Reducer test: `RESOLVE_MOVEMENT` onto a gameplay tile sets `lastResolvedTileId` to that tile id.
- [x] 5.3 Reducer test: a successful `END_TURN` rotates `currentStoryId` to a different value and advances `rngState`.
- [x] 5.4 Reducer test: a rejected `END_TURN` (e.g. dispatched in `awaiting-quiz-answer`) returns the same state reference (no rotation).
- [x] 5.5 Reducer test: rotation excludes both `lastResolvedTileId` (`tile:<n>`) and the previous `currentStoryId`.
- [x] 5.6 Reducer test: replay determinism — same seed + same action sequence produces identical `currentStoryId` chain.
- [x] 5.7 Persistence test: `parseSave` of a v2 JSON without `currentStoryId`/`lastResolvedTileId` returns a state with both fields hydrated to `null`.

## 6. 3D scene

- [x] 6.1 In `src/scene/Board.tsx`, reposition the title plaque ("INDUSTROPOLY") to the top edge of the inner area and reduce its font size; do the same shift for the "A Era do Vapor" subtitle.
- [x] 6.2 Add a `<StoryPanel />` group rendered at world origin lying flat on the parchment surface. Use `@react-three/drei`'s `<Text>` with `maxWidth` covering most of the inner area, italic style, low fill opacity, `colors.inkSoft`, and a small seeded z-rotation jitter for character.
- [x] 6.3 Read the current story from `useGameStore((s) => s.state?.currentStoryId)` and resolve it via `getStoryById`. Render its `title` (small) and `body` (paragraph). If the id is null, render nothing.
- [x] 6.4 Set `<Text>` to `raycast={null}` (or equivalent) so it never captures pointer events. Confirm tokens and dice render visibly on top.

## 7. HUD + accessibility modal

- [x] 7.1 Add a "📜 História" button to `src/ui/Hud.tsx` next to the existing "Diário" button.
- [x] 7.2 Wire it to a new boolean in `src/state/uiStore.ts` (e.g. `storyOpen` + `setStoryOpen`).
- [x] 7.3 Create `src/ui/modals/StoryModal.tsx` built on the existing `Modal.tsx` showing the current story's title, body, and citation. Read-only; closing it dispatches no engine action.
- [x] 7.4 Mount `<StoryModal />` from `src/app/GameScreen.tsx` when `storyOpen` is true.

## 8. Documentation

- [x] 8.1 Update `README.md` "How the game teaches" section to describe the rotating central story panel and its HUD modal.
- [x] 8.2 Add a sentence in the doc explaining that stories are derived from existing blurbs (no separate authoring needed).

## 9. Verification

- [x] 9.1 Run `npm run typecheck`, `npm test`, `npm run lint:content` — all green.
- [x] 9.2 Manual smoke: start a game, confirm the central story is visible (low opacity, sepia, italic), the HUD button opens the modal, and ending a turn changes the story.
