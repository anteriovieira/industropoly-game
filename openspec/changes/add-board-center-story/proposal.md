## Why

The board's central area today is decorative — a parchment inset with the title plaque, a compass rose, and the dice tumbling region. Players sit through other players' turns with nothing to read. The whole point of Industropoly is teaching: every dead second at the table is a missed exposure to the era. We want the center to become a slow, ambient reading surface — a "letter from a contemporary" that everyone can glance at while it's not their turn — without interrupting any gameplay flow or asking the player to do anything.

The story panel is intentionally **independent of the current quiz** so it doesn't become a cheat sheet. Reading it should feel like overhearing the era, not studying for the test.

## What Changes

- Add a **story panel** anchored at the geometric center of the board (3D scene), rendered as a faded sepia handwriting on the parchment surface. Width covers most of the inner area; text auto-wraps and is a couple of paragraphs long.
- Visual treatment: low contrast (faded ink), an italic/serif "handwritten letter" font, slight tilt for character, and a render order that keeps it **behind** the dice and tokens — it never blocks gameplay or interaction. Dice can tumble across it without visual conflict.
- Pick the story from the existing educational corpus (tile blurbs in `src/content/tiles.ts` plus card blurbs in `invention-cards.ts` / `edict-cards.ts`). No new content authoring required for v1.
- **Selection rule**: deterministic from the engine's `rngState`; selection MUST exclude any tile/card tied to the current quiz (`currentQuiz.tileId`) or the most recently quizzed tile so the panel never doubles as a quiz hint.
- **Rotation cadence**: the story rotates on every `END_TURN` (one new story per turn). It does **not** rotate during a turn — the active player should not be distracted by changing text mid-decision.
- Keep the existing center-of-board "INDUSTROPOLY / A Era do Vapor" title plaque, but reposition it so the story has room (e.g., shrink and push to a corner of the inner area).
- Accessibility: also expose the current story text via the HUD (a small "📜 História atual" button that opens it in a parchment modal) so players using a screen reader or sitting far from the screen can read it.
- Persist the current story id in `GameState` so reloads show the same story until the next `END_TURN`.

## Capabilities

### New Capabilities
- `board-center-story`: Selecting, displaying, rotating, and exposing a per-turn ambient story panel at the board's geometric center.

### Modified Capabilities
- `game-engine`: Adds a `currentStoryId` field on `GameState` and a deterministic story-rotation step on `END_TURN`; story selection consumes the RNG.
- `board-3d`: Repositions/resizes the central title to make room for the story panel; introduces a new central text region with explicit z-ordering so it sits below tokens and the dice.

## Impact

- **Code**:
  - `src/engine/types.ts`, `src/engine/init.ts`, `src/engine/reducer.ts`: add `currentStoryId`, populate at init, rotate on `END_TURN`, expose helper `pickStoryId(state, excludeIds[])`.
  - `src/scene/Board.tsx`: new `<StoryPanel />` group; reposition title; ensure renderOrder/layer is below dice & tokens.
  - `src/content/`: add `src/content/stories.ts` that derives story snippets from existing tile/card blurbs (a single source-of-truth array `STORIES` with `{ id, title, body, source }`).
  - `src/ui/Hud.tsx`: small "📜 História" button; `src/ui/modals/StoryModal.tsx` for screen-reader-accessible reading.
- **Engine state**: `currentStoryId: string | null` added; `schemaVersion` stays at `2` (we treat this as a backward-compatible additive field — see design.md for the migration choice).
- **No new dependencies**.
- **Tests**: reducer tests for rotation on `END_TURN`, exclusion of the current quiz's tile, deterministic replay; UI smoke test that the HUD button opens the story modal.
- **No content authoring required**, but a derivation step is needed to generate the `STORIES` array from existing blurbs (a small build-time map in TypeScript, not a separate file load).
