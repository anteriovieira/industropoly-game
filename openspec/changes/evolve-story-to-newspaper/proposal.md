## Why

The single faded "letter" story we just shipped (`add-board-center-story`) achieved the ambient-teaching goal, but it intentionally **excluded** any content tied to the current or just-resolved quiz so the panel couldn't be read as a cheat sheet. After playing with it, the take-away is the opposite: the game exists to teach, so the ambient reading material should *help* players answer, not hide from them. A period-appropriate **newspaper** format is also a stronger metaphor for an industrial-era information surface than a private letter — and a newspaper naturally carries multiple short items, inviting players to browse between turns.

This change re-frames the center panel as "O Cronista Industrial" (or similar), rotates a fresh **issue of 3 headlines** every turn, and treats the content as legitimate study material — it intentionally *overlaps* with the quiz corpus so a player who reads it arrives at the next question better prepared.

## What Changes

- Replace the single `currentStoryId` field with a `currentNewspaper: { issueNumber; headlineIds: string[] }` (v1 length = 3).
- **BREAKING (engine-internal)**: remove all exclusion logic around the quiz tile / last-resolved tile. Headlines are picked uniformly from the full `STORIES` corpus, with only "no immediate repeat within the same issue" as a constraint. The story panel now *can* and *often will* overlap with the next quiz — that is the new intended behavior.
- Rotate the newspaper on every accepted `END_TURN` (same cadence as today). Issue number increments each rotation. A quiz does not trigger rotation.
- Redesign the 3D panel as a **newspaper front page**: masthead (serif display font), date line using the in-game turn / issue number, then 3 headlines arranged in a simple layout (e.g., one lead + two shorter items, or three columns). Use **regular-weight legible sepia-on-parchment ink** — no more italic + low opacity. The panel is explicitly meant to be read at a glance.
- Keep the title plaque repositioned (header at top edge) — no visual conflict.
- Keep the HUD "📜 História (H)" button but rename it to **"📰 Jornal (J... keep H)"** and rewire its modal to show the whole issue (masthead + all 3 headlines + their bodies and citations). The existing `J` shortcut already opens the Facts Journal; keep using `H` for the newspaper modal.
- Persistence: hydrate missing `currentNewspaper` on older saves (still no schema bump; additive within `schemaVersion: 2`). Saves that still carry `currentStoryId` are ignored by the new code (field becomes unused) — no migration beyond "pick a fresh issue on first `END_TURN` or on init".

## Capabilities

### New Capabilities
- *(none)* — this is an evolution of an existing capability.

### Modified Capabilities
- `board-center-story`: renamed in tone to "newspaper issue," replacing the single-story field with a multi-headline issue, removing quiz-exclusion rules, requiring legible typography, and expanding the HUD modal to render the whole issue.
- `game-engine`: `GameState.currentStoryId` is replaced by `GameState.currentNewspaper`; `lastResolvedTileId` is removed from the rotation exclusion set (kept on the type for now in case a future change needs it, but not consulted); `handleEndTurn` rotates the newspaper.
- `board-3d`: the center panel becomes a newspaper layout (masthead, date, 3 headlines, readable serif at full ink opacity) instead of a faded handwritten letter.

## Impact

- **Code**:
  - `src/engine/types.ts`: add `Newspaper` type, `currentNewspaper: Newspaper | null`; leave `currentStoryId` temporarily for save-hydration, then drop it after callers migrate.
  - `src/engine/reducer.ts`: rename `pickStoryId` → `pickIssue(rngState, count)` returning `N` distinct ids; drop exclusion based on quiz/last-resolved.
  - `src/engine/init.ts`: seed `currentNewspaper` with `issueNumber: 1` and 3 headline ids.
  - `src/lib/persist.ts`: hydrate missing `currentNewspaper` on v2 saves; drop hydration of `currentStoryId` (field removed).
  - `src/scene/StoryPanel.tsx` → rename/rewrite as `src/scene/NewspaperPanel.tsx`: masthead, turn/issue line, 3-headline layout, legible serif at full opacity.
  - `src/scene/Board.tsx`: mount `<NewspaperPanel />` instead of `<StoryPanel />`.
  - `src/ui/modals/StoryModal.tsx` → rewrite to render the whole issue (masthead + 3 articles).
  - `src/ui/Hud.tsx`: button label updated to "📰 Jornal".
  - `README.md`: update the "How the game teaches" section — story panel is now a teaching newspaper.
- **Tests**: reducer tests (rotation produces N distinct ids, replay determinism on issue picks, no-op on rejected `END_TURN`); persistence test for hydration of `currentNewspaper`.
- **Content**: no new authoring; still derived from `STORIES` built on existing blurbs.
- **No new dependencies**.
- **User-visible behavior**: the center panel now shows 3 short items per turn in a legible newspaper layout; reading between turns gives real exposure to material the player might be quizzed on. The HUD's History/Jornal modal shows the full issue.
