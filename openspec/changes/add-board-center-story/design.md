## Context

Industropoly's board center today is occupied by a parchment inset, a compass rose, and the title plaque "INDUSTROPOLY / A Era do Vapor". The dice tumble over this region. The just-shipped quiz feature (`add-tile-quiz-gameplay`) makes the active player's downtime tighter, but the *non-active* players still wait through other turns with nothing to do — and the table loses learning seconds.

Existing relevant code:
- `src/scene/Board.tsx` — the central area with the title and compass.
- `src/scene/BoardScene.tsx` — wraps `<Board />`, dice, tokens, lights, camera.
- `src/scene/Dice.tsx` — dice mesh; tumbles roughly above the board center.
- `src/engine/types.ts` — `GameState` (currently `schemaVersion: 2` from the quiz change).
- `src/engine/reducer.ts` — pure reducer; `handleEndTurn` rotates the active player.
- `src/content/tiles.ts`, `src/content/invention-cards.ts`, `src/content/edict-cards.ts` — corpus of blurbs we'll derive stories from.

Constraints:
- Engine must stay pure (no React/DOM imports in `src/engine/`).
- The story must NEVER reveal the current quiz's answer — strictly excludes the quiz tile/card and the most-recently quizzed tile.
- Visual: faded handwriting, doesn't fight tokens or dice for attention.
- No new external libraries (we already have `@react-three/drei`'s `<Text>`).

## Goals / Non-Goals

**Goals:**
- A constantly-present, low-distraction reading surface at the board's geometric center.
- Deterministic story selection from the existing corpus, replayable from a seed.
- Rotation cadence tied to a clear gameplay event (`END_TURN`) — not a timer.
- An accessible read-out path via the HUD for any player who can't read it on the 3D board.
- Persistence: the story id survives reload until the next `END_TURN`.

**Non-Goals:**
- Authoring new "letter" content. v1 reuses tile + card blurbs verbatim.
- Player-driven story navigation (no "next story" button mid-turn).
- Animations / typewriter effects. Static text, period.
- Localization beyond what the existing blurbs already provide (Portuguese).
- Hooking the story into scoring or quiz selection (it stays decoupled).

## Decisions

### Decision 1: Rotate on `END_TURN`, not on a timer

`END_TURN` is the only natural gameplay boundary where every player's attention resets. Rotating mid-turn would steal focus from the active player just before a decision; rotating on a clock would be both engine-impure (needs wall time) and visually noisy. Rotating on `END_TURN` also means the story id can live on `GameState` and survive reloads with no extra plumbing.

**Alternatives considered:**
- *Timer (every N seconds)*: pollutes determinism; needs side-effects in the UI to drive rotation; rejected.
- *Rotate on `ROLL_DICE`*: would change the panel just as a player commits to a turn — wrong moment. Rejected.

### Decision 2: Story corpus is derived, not authored

Build a single `STORIES: readonly StoryEntry[]` array in `src/content/stories.ts` by mapping over `TILES` (non-corner only) and over both card decks. Each entry is `{ id, sourceKind: 'tile' | 'card', sourceRefId: string, title, body, citation }` where `body` is the existing `education.blurb` and `title`/`citation` mirror the existing payload. This buys us ~70 stories on day one with zero new writing.

**Why not author bespoke "letter" prose?** It's a real authoring lift (we just shipped 36 questions), the existing blurbs are already first-person friendly, and we can layer a typographic treatment (italic + sepia) that *reads* handwritten without each blurb being authored as a letter. A future change can replace the corpus without touching the rotation logic.

**Alternatives considered:**
- *New `stories.ts` file with hand-written first-person letters*: better immersion, multi-hour writing task. Deferred.
- *AI-generated letters at build time*: out of scope for this change.

### Decision 3: Selection algorithm — uniform, exclusion-aware, deterministic

`pickStoryId(rngState, exclude: Set<string>): { state, storyId }`:

1. Build the candidate list `STORIES.filter(s => !exclude.has(s.id))`.
2. If the candidate list is empty (corner case — shouldn't happen with 70+ stories and a tiny exclusion set), fall back to the full list.
3. `index = nextUint32(rngState).value % candidates.length`; advance rng.
4. Return the selected story's id and the new rng state.

The exclusion set is computed at the call site:
- The current quiz's tile id (if any) → exclude `tile:<id>` from `STORIES`.
- The just-finished landing's tile id (the player who just hit `END_TURN` may have been quizzed on it) → exclude that too. We track this in `lastResolvedTileId: TileId | null` on `GameState`.
- The currently displayed `currentStoryId` so we never repeat back-to-back.

### Decision 4: Engine state shape

Add to `GameState`:
- `currentStoryId: string | null` — the active story id; null only at the very start of a fresh game (initialized in `createInitialState`).
- `lastResolvedTileId: TileId | null` — the tile that the most recent landing resolved on; updated whenever a quiz starts (so it reflects the just-landed tile) and consulted as exclusion when picking the next story.

`schemaVersion` stays at **2**. The new fields are additive and the loader can hydrate missing values to safe defaults (`null`) without a fresh-game migration. This avoids forcing another save reset on the user immediately after the quiz change did so.

**Alternatives considered:**
- *Bump `schemaVersion` to 3 and reject v2 saves*: heavy-handed for additive fields. Rejected.
- *Compute story id at render time from `(turn, seed)`*: would couple visual output to the renderer's read of state and break replays. Rejected.

### Decision 5: 3D placement and z-ordering

Render order on the board's central plane (lowest to highest):
1. Parchment inset (current).
2. Compass rose (top-left of inner area, current).
3. **Story panel** — a `drei` `<Text>` block with `maxWidth ≈ innerSize - 4`, anchored at world origin, lying flat (`rotation=[-π/2, 0, 0]`), low opacity (`fillOpacity ≈ 0.35`), `color: colors.inkSoft`, sized so 4–6 lines of body text fit within the inner area, with a slight z-rotation jitter (≈ 1.5°) seeded from the story id.
4. Title plaque "INDUSTROPOLY" — moved to the **top edge** of the inner area (e.g., `position={[0, ..., -innerSize/2 + 1.2]}`) and shrunk a notch so it acts like a header rather than centerpiece.
5. Tokens & dice — already rendered above (different y) and `<Text>` here uses the default `<drei/Text>` render order, which sits below 3D meshes by default.

To guarantee the dice never visually obscure the text in a confusing way, the text uses `material-toneMapped={false}` and a soft outline color matching the parchment. We do NOT add a transparent backing plane — the text should look like ink on the board, not a separate sticker.

### Decision 6: HUD accessibility surface

A new "📜 História" button in the HUD opens `StoryModal.tsx` (built on the existing `Modal.tsx`) showing the current story title, body, and citation. This is the screen-reader-friendly path and also helps mobile players who can't read the slanted/faded board text. The modal is read-only; closing it does not advance state.

### Decision 7: No story rotation on `RESOLVE_MOVEMENT` or quiz events

Even though the quiz captures the player's full attention, we do NOT rotate the story when the quiz opens. The rotating cadence stays a clean function of `END_TURN` so the story is stable for the duration of the active player's turn (including their dice roll, quiz, and any tile resolution).

## Risks / Trade-offs

- **Visual clutter** → the inner area already holds the title, compass rose, and dice region. Adding paragraphs risks looking busy. *Mitigation:* keep opacity low (~0.35), constrain to 4–6 lines, push the title to the top edge as a header. If it's still too busy, we can add a later toggle in the HUD to hide the panel.
- **Reading ergonomics on a 3D plane** → text laid flat at a tilted camera is hard to read at extreme angles. *Mitigation:* the HUD modal is the canonical readable surface; the 3D panel is "ambient." The camera default tilt should already give a legible view at neutral camera; document this in the player guide.
- **Off-by-one on exclusion** → the just-resolved tile is recorded after movement; if we pick the new story before recording, the exclusion can leak. *Mitigation:* `END_TURN` updates `lastResolvedTileId` first, then picks the story.
- **Story content overlap with quiz hints** → some tile blurbs literally answer their own questions. The exclusion of the quizzed tile fixes the worst case; cross-tile leakage (e.g., a Cromford story when the next quiz is about Arkwright) is acceptable since the player doesn't know what their next quiz will be.
- **Replay determinism** → adding an RNG-consuming step on `END_TURN` changes byte-for-byte replays. *Mitigation:* no real replays exist yet; document.
- **Mobile / small screens** → text on a 3D plane will be tiny on phones. *Mitigation:* the HUD button + modal are the primary path on mobile.

## Migration Plan

1. Engine: add `currentStoryId` and `lastResolvedTileId` to `GameState`; default both to `null`. Initialize `currentStoryId` to a seeded pick in `createInitialState`. Update `handleResolveMovement` (or `startQuizForTile`) to record `lastResolvedTileId`. Update `handleEndTurn` to rotate the story.
2. Persistence: hydrate missing fields to `null` in `parseSave` for backwards compatibility with v2 saves shipped before this change (additive only — no schema bump).
3. Content: add `src/content/stories.ts` deriving from `TILES` + cards. No new authoring.
4. UI: add `<StoryPanel />` to `Board.tsx`; reposition title; add HUD button + `StoryModal.tsx`.
5. Tests: reducer tests for rotation, exclusion, init, replay determinism. A small UI smoke that the HUD button opens the modal.
6. Rollback: remove the `<StoryPanel />` import from `Board.tsx` and the HUD button. The engine fields stay, harmless.

## Open Questions

- **Should the story panel hide entirely while the quiz modal is open?** The quiz modal already covers most of the screen; the panel is fine "underneath" since the modal sits above the canvas. Default: leave the 3D panel as-is.
- **First-letter font choice** — `IM Fell English` is loaded today and reads as historical serif but isn't strictly handwriting. Adding a true handwritten font is a font-pipeline change. v1 uses italic `IM Fell English` + lowered opacity for the "handwritten letter" feel.
- **Repeat avoidance window** — currently 1 (no immediate repeat). Should we keep a longer history (last 3–5)? Default: just the immediate previous and the just-resolved tile, to keep state cheap.
- **Should non-active players see the same story id as the active player?** Yes — the field is on `GameState`, single-source-of-truth. Hot-seat assumption.
