## Context

We shipped `add-board-center-story` with a clear rule: the ambient panel must never reveal the next quiz. Playing it exposed the inverse need — the game is an educational tool, so ambient reading material SHOULD overlap with the quiz corpus. A newspaper is also a period-apt metaphor for an Industrial Revolution table: short items, masthead, legible display type, multiple stories per issue.

Relevant existing code:
- `src/engine/types.ts` — `GameState.currentStoryId: string | null`, `lastResolvedTileId: TileId | null`.
- `src/engine/reducer.ts` — `pickStoryId(rngState, exclude)`; `handleEndTurn` rotates with exclusions.
- `src/engine/init.ts` — seeds `currentStoryId` on init.
- `src/lib/persist.ts` — `parseSave` hydrates missing `currentStoryId`/`lastResolvedTileId` to `null`.
- `src/scene/StoryPanel.tsx` — faded italic `drei/Text` at board center.
- `src/scene/Board.tsx` — mounts `<StoryPanel />` and the repositioned title.
- `src/ui/modals/StoryModal.tsx` — read-only HUD modal showing the current story.
- `src/ui/Hud.tsx` — "📜 História (H)" button.
- `src/content/stories.ts` — 68-entry `STORIES` corpus; `getStoryById`.

Constraints:
- Engine stays pure; rotation is a deterministic RNG function.
- `schemaVersion` stays at `2` — all changes are additive or field-renames that old saves can survive.
- Board center must remain readable and not block the dice or token visuals.
- No new external dependencies.

## Goals / Non-Goals

**Goals:**
- A *legible* newspaper-style panel at the board center showing **3 headlines per turn**.
- Rotation tied to `END_TURN`, same cadence as today.
- Issue numbering (1, 2, 3...) visible as the "edition" on the masthead and in the HUD modal.
- Ambient content that *can* overlap with the upcoming quiz — no exclusion filters.
- HUD modal lists the full current issue.

**Non-Goals:**
- Per-player newspapers or hot-seat private views. Hot-seat is a single shared board; one issue per turn.
- Headlines with authored, newspaper-specific prose. v1 reuses existing `STORIES` bodies and titles — we just present 3 of them.
- Prescient targeting (picking headlines most likely to match the next player's roll). Out of scope; the teaching effect comes from cumulative exposure across turns.
- Image/illustration in the panel. Text-only.
- Localization beyond existing Portuguese content.
- Multi-page navigation ("next page"). The modal scrolls if needed; that's enough.

## Decisions

### Decision 1: Data model — a Newspaper object with a headline-id list

```ts
export interface Newspaper {
  issueNumber: number;       // 1-based, increments on each rotation
  headlineIds: string[];     // currently exactly 3; kept as array for future 2- or 4-item issues
}
```

Stored on `GameState.currentNewspaper: Newspaper | null`. We keep it an array (not a fixed tuple) so a future change can bump to 4 headlines without widening `schemaVersion`.

`currentStoryId` is **removed** from `GameState`. The `parseSave` hydration path ignores stray `currentStoryId` on older saves and seeds a fresh newspaper if `currentNewspaper` is absent. Old saves keep loading silently.

**Alternatives considered:**
- *Keep `currentStoryId` and add `currentNewspaper` as an overlay*: leaves dead state and two sources of truth for the UI. Rejected.
- *Inline the headlines (full `StoryEntry`) on the state*: bloats the engine state with duplicated content. Storing ids is cheaper and resilient if we ever edit blurbs.

### Decision 2: Pick 3 distinct headlines per issue, no broader exclusions

`pickIssue(rngState, count, avoidIds?)` returns `{ state, ids: string[] }` where `ids` has `count` distinct entries drawn uniformly from `STORIES`. The optional `avoidIds` defaults to the **previous issue's headlines** — so back-to-back duplication within a newspaper rotation is minimized, but there are **no quiz-related exclusions**. Crossover with the quiz corpus is exactly what we want.

Pseudocode:
```ts
function pickIssue(rngState, count, avoid = new Set<string>()) {
  const pool = STORIES.filter(s => !avoid.has(s.id));
  const source = pool.length >= count ? pool : STORIES; // fallback
  // Draw `count` distinct via repeated nextUint32 + modulo, tracking picked ids.
  // Advance rng once per draw. Reject duplicates and keep going.
  ...
}
```

The corpus has 68 entries; 3 distinct picks from a 65-ish filtered pool are trivial to satisfy.

**Alternatives considered:**
- *Pick independently 3× from `pickStoryId`*: could repeat within the same issue. Rejected.
- *Weight by proximity to the next player's position*: tempting (a "local news" feel), but opaque to players and reducer-impure if we don't encode player positions into the RNG call. Keep the v1 pick uniform and revisit after playtest.

### Decision 3: Rotation cadence unchanged (every accepted `END_TURN`)

`handleEndTurn` continues to be the single rotation hook. On each accepted end-turn:
1. Read the current issue's `headlineIds` (if any) into `avoid`.
2. Call `pickIssue(state.rngState, 3, avoid)`.
3. Write `currentNewspaper = { issueNumber: prev.issueNumber + 1, headlineIds }` and advance `rngState`.

No change to the no-op behavior of `END_TURN` when in `awaiting-quiz-answer` or when the landing isn't resolved. Rejected end-turns leave the newspaper untouched.

### Decision 4: Drop quiz and last-resolved-tile exclusions

The whole point of this change. We delete the exclusion construction in `handleEndTurn` (previously built a `Set` from `currentStoryId`, `currentQuiz.tileId`, `lastResolvedTileId`). `lastResolvedTileId` stays on the state for now — future changes might consume it, and removing it would be a pure cleanup we don't need to couple to this change.

**Alternatives considered:**
- *Delete `lastResolvedTileId` altogether*: we'd have to undo the `startQuizForTile` write and adjust tests. Not worth it until a consumer stops appearing.
- *Keep excluding only the previously current story*: minor benefit; the new "avoid previous issue's 3 ids" rule already subsumes this.

### Decision 5: 3D layout — masthead + 3 headlines, legible sepia, full opacity

The panel becomes a horizontal parchment "front page" sitting flat on the board's central area. Layout, in board-local units (board size = 20, inner size ≈ 16):

```
                  O CRONISTA INDUSTRIAL                   <- masthead, ~0.7rem drei
        Edição 12 · Primavera da Era do Vapor             <- date line, ~0.3rem drei
      ┌─────────────────── ▮ ───────────────────┐         <- thin rule
      │ HEADLINE 1 TITLE                        │
      │ short snippet, 2–3 lines...             │          <- lead (slightly larger)
      ├─────────────────────────────────────────┤
      │ HEADLINE 2 TITLE      │ HEADLINE 3 ...  │          <- two shorter columns
      │ snippet...            │ snippet...      │
      └─────────────────────────────────────────┘
```

Typography choice:
- Masthead: `IM Fell English` (already loaded), size ~0.7, `colors.ink`, **no italic**, opacity 1.0, outlined against parchment for pop.
- Date line: `IM Fell English` italic, size ~0.3, `colors.inkSoft`, opacity 0.85.
- Headlines: bold-ish serif look (IM Fell English with a light outline for weight), size ~0.32 for lead / 0.24 for side items, `colors.ink`, opacity 1.0.
- Snippets: same font, size ~0.2, `colors.inkSoft`, opacity 0.9. **Trim blurb** to ~140 chars for the 3D surface — the full body goes in the HUD modal.
- No z-tilt this time; a newspaper reads better square to the camera. Keep `raycast={() => null}` on every `<Text>` so the panel remains non-interactive.

Each `<Text>` still sits on the board surface (`y = BOARD.tileDepth / 2 + 0.025`) so tokens and dice render above it.

**Alternatives considered:**
- *Use a real newspaper font* (e.g., Fraktur, gothic): novel but requires font pipeline work and can hurt legibility for Brazilian-Portuguese readers. Rejected.
- *Render each headline in its own sub-group with a rule bar between them (thin black plane)*: adds visual texture; defer to a polish pass. Start without decorative rules.

### Decision 6: HUD modal shows the full issue

Rename `StoryModal` to read like an issue viewer:
- Title: "📰 Jornal — Edição {issueNumber}"
- Body: loop over `headlineIds`, render each `StoryEntry` as `<article>` with title, full blurb, citation.
- Close behavior unchanged (Esc / click-outside / close button; no engine dispatch).

Filename stays `StoryModal.tsx` in v1 to minimize churn; the component exported rename is internal-only. Keep the `storyOpen`/`setStoryOpen` store keys.

### Decision 7: Persistence hydration

`parseSave`:
- If `currentNewspaper` is undefined on a v2 save, set it to `null`. The reducer's first accepted `END_TURN` will pick a fresh issue, and the UI renders "nothing" until then. An alternative is to synth one on load, but the load path is not allowed to consume RNG (it's a pure parser); we leave hydration to the next reducer action.
- If `currentStoryId` is present on the save, ignore it. It's no longer on the type.
- `lastResolvedTileId` hydration stays as before.

The first render of a freshly-initialized game always has a newspaper (init seeds it). Only older saves predating this change can show `currentNewspaper === null` briefly.

## Risks / Trade-offs

- **Overlap with the next quiz might make questions too easy** → that's now the intended behavior; the quiz already has a Hint Shop and players can fail them. Watch in playtest whether correct-rate climbs uncomfortably; if so, tune question difficulty, not the newspaper.
- **Readable text at board-center y** may still be small on phones → the HUD's "📰 Jornal" modal is the canonical readable path on mobile. Document.
- **3D text performance** (3 headlines × 3 `<Text>` elements each = ~9 more `<Text>` than today) → drei's `<Text>` is SDF-based and cheap; still well under the budget. Monitor FPS on lower-spec machines.
- **Content repetition across several turns** → with 68 stories and a 3-per-issue draw excluding only the previous 3, you won't see the same headline twice in a row, but you'll see recurrences within a handful of turns. That's fine — repetition is how ambient teaching works.
- **Determinism** → adding a 3-pick loop per `END_TURN` consumes more RNG steps than before; byte-level replays from pre-change seeds won't match. No real replay system exists yet; document the break.
- **Old in-progress saves** on a local dev's machine will load with `currentNewspaper === null` and show an empty board center until `END_TURN`. Acceptable.

## Migration Plan

1. Engine types: add `Newspaper`, `currentNewspaper: Newspaper | null`. Leave `lastResolvedTileId` alone.
2. Remove `currentStoryId` from `GameState`. Update callers. Typechecker will find them all.
3. Reducer: replace `pickStoryId` with `pickIssue`; rewrite `handleEndTurn`'s rotation; drop exclusion computation.
4. Init: seed `currentNewspaper` with `issueNumber: 1` and 3 ids via `pickIssue`.
5. Persistence: hydrate missing `currentNewspaper` to `null`; strip `currentStoryId` read.
6. 3D: replace `StoryPanel.tsx` with `NewspaperPanel.tsx` and update `Board.tsx`.
7. HUD modal: rewrite `StoryModal.tsx` to render the full issue. Update HUD button label.
8. Tests: replace the story-rotation suite with newspaper-issue tests (distinct ids, issue-number increment, replay determinism, no-op on reject).
9. Docs: README section and the `board-center-story` spec (MODIFIED capability).
10. Rollback: revert this change; the previous `add-board-center-story` still works if we keep `currentStoryId` dormant. Not needed but worth noting.

## Open Questions

- **Masthead name**: placeholder is "O Cronista Industrial". Final wording is a polish decision; the component accepts it as a constant and is trivial to edit later.
- **Issue date line** — "Edição 12 · Primavera da Era do Vapor" is evocative but fake. Do we want to compute a quasi-date from the turn (e.g., "Ano 5 · Primavera")? Default: plain `Edição {n}` without a faux date. Simpler and honest.
- **Do we render a thin horizontal rule (a dark `<mesh>` plane) between the masthead and the headlines?** Would look more newspaper-y. Default: skip the extra mesh in v1; if the panel feels flat in playtest, add it.
