## Why

Two things in the live game don't match the original "edutainment" pitch:

1. **The quiz fires AFTER the player has already moved.** The current flow is: roll → token hops to a tile → quiz about that tile → on wrong, the rule is skipped but the token still ends the turn at the new tile. That's a soft penalty and a soft pedagogical loop — the player is tested on a tile they just arrived at, with no time to absorb the content first. The desired loop is: you spent a turn at a tile last turn (saw its blurb in the result panel and the newspaper); now, before you can leave, prove that you remember it. Wrong → you stay parked there, turn ends. This makes the pedagogical loop tighter and the gameplay cost more dramatic.

2. **The newspaper looks like a brochure, not a 19th-century newspaper.** The center panel ships 3 headlines in clean serif. Real period papers (e.g. *La Gazette*, late-1800s French weeklies the user shared as reference) are denser: 6–8 short items per page, multi-column layout, mixed heavy/light serif, masthead in caps with a thin rule below, all framed by a thin border. Without this density the panel reads as decoration, not as something a player would actually scan between turns.

Plus the irritating in-quiz helper text ("Acerte para seguir com a regra da casa. Errar encerra o turno.") needs to go.

## What Changes

### Gameplay — quiz now gates *movement*, not landing

- **BREAKING (engine-internal)**: the quiz phase moves from after `RESOLVE_MOVEMENT` to between `ROLL_DICE` and `RESOLVE_MOVEMENT`. The reducer's new sequence is: `awaiting-roll` → `ROLL_DICE` → `awaiting-quiz-answer` (about the tile the player is **currently standing on**) → on correct, `moving` → `awaiting-land-action` etc. as today; on wrong, jump straight to `awaiting-end-turn` with **no movement applied**. The player keeps their position; the dice result is discarded for this turn.
- **Special case — corners.** Corner tiles (Início at id 0, Praça Pública at 20, Visitando Prisão at 10) have no questions. When the active player starts their turn on a corner — including everyone's first turn (Manchester, id 0) — `ROLL_DICE` SHALL go straight to `moving` without a quiz. Players in prison are not affected (prison flow is separate; they handle escape before any roll).
- **Special case — quiz-eligible tile that has no question authored.** Defensive fallback: skip the quiz and proceed to `moving`, same as today's `startQuizForTile` empty-pool branch.
- The `awaiting-land-action` / rent / tax / card flow on the destination tile is **unchanged** — once the quiz gate is passed, landing resolves exactly as today, including the post-landing "Did you know?" panel for the *destination* tile content.
- The post-quiz result panel for the **current** tile content is reframed as **"Lembrete"** ("you've been here, here's what you saw"), since the player has already lived through this tile's first-time blurb.
- Remove the inline helper line "Acerte para seguir com a regra da casa. Errar encerra o turno." from the question modal. Replace it with a short italic sub-header above the prompt: "*O Cronista pergunta*".
- `lastResolvedTileId` becomes meaningful again — it identifies which tile the next turn's quiz will be about. The field stays on `GameState`.

### Newspaper — denser, period-newspaper layout

- Increase the issue from 3 to **6 headlines** (`pickIssue(rngState, 6, avoid)`).
- 3D layout becomes a **3-column page** with mixed item sizes:
  - **Masthead** in heavy caps with a thin horizontal rule below.
  - **Edition line** in italic (small).
  - **Lead headline** spans the top across all 3 columns (largest title + 2-line snippet).
  - **5 secondary items** distributed across the 3 columns underneath, each with a smaller title + 1-line snippet, separated by short horizontal rules.
- Add a thin **frame mesh** (4 thin dark planes) around the page bounds, like the boxed border in the reference papers.
- Typography stays in `IM Fell English` (already loaded) but uses noticeably distinct sizes (lead vs secondary vs body vs caption) so the page reads "newspaper" instead of "list".
- HUD modal is unchanged in structure (still lists every headline of the issue with full body and citation), only the title bar updates to "📰 O Cronista Industrial — Edição N".

## Capabilities

### Modified Capabilities

- `tile-quiz-gameplay` — the quiz prompt fires on `ROLL_DICE` about the **current** tile, not on `RESOLVE_MOVEMENT` about the landed tile. Wrong-answer outcome changes from "skip rule, end turn at new tile" to "skip movement entirely, end turn parked at current tile". Corner tiles skip the quiz on roll. The post-answer "Did you know?" panel is reframed as "Lembrete" for the current tile. The inline helper line is replaced by a sub-header.
- `game-engine` — `ROLL_DICE` transitions to `awaiting-quiz-answer` instead of `moving` when the active player is on a quiz-eligible tile; `ANSWER_QUESTION` correct transitions to `moving`; wrong transitions to `awaiting-end-turn` with the player's `position` unchanged and `lastRoll` cleared. `lastResolvedTileId` is rotated on the *new* turn's quiz selection.
- `board-center-story` — `pickIssue` default count grows from 3 to 6; the rotation/avoidance/exclusion semantics are otherwise unchanged. The "stable across in-turn actions" guarantee is preserved (the new quiz timing happens within a turn and does not rotate the newspaper).
- `board-3d` — the central newspaper panel becomes a 3-column framed front-page layout with a lead + 5 secondary items, a masthead with a horizontal rule, and a thin border frame.

### New Capabilities
- *(none)*

## Impact

- **Code**:
  - `src/engine/reducer.ts`: reroute `ROLL_DICE` → quiz; rewrite `ANSWER_QUESTION` correct/wrong branches; remove the quiz-trigger inside `RESOLVE_MOVEMENT`/`startQuizForTile` (movement no longer triggers the quiz). Update `pickIssue` callers from 3 to 6.
  - `src/engine/init.ts`: `pickIssue(s2.state, 6)` for the seed issue.
  - `src/ui/modals/QuestionModal.tsx`: drop the inline helper line, add the italic "O Cronista pergunta" sub-header, change result-panel title from "Você sabia?" → "Lembrete" with a slight rewording in the body.
  - `src/scene/NewspaperPanel.tsx`: 3-column layout, 6 items, masthead rule, thin frame mesh.
  - `src/app/GameScreen.tsx`: no logic change expected — the auto-dispatch of `RESOLVE_MOVEMENT` after `moving` already exists.
- **Tests**:
  - Update existing reducer tests that asserted "RESOLVE_MOVEMENT enters quiz" — they now assert "ROLL_DICE enters quiz when current tile is gameplay".
  - New tests: corner-start `ROLL_DICE` skips quiz; wrong answer keeps `position` unchanged and clears `lastRoll`; correct answer enters `moving` then auto-resolves to landing as today.
  - `pickIssue` tests already cover N=3; add an N=6 case.
- **Content**: no change. The 36 questions are now asked while the player is on the corresponding tile (still tile-themed).
- **Persistence**: no schema change. v2 saves predating this still load; the `currentNewspaper.headlineIds` array length grows organically on the next `END_TURN`.
- **No new dependencies**.
- **Behavior visible to the player**: more dramatic stakes (wrong = stay), tighter teaching loop (you're tested on what you saw last turn), denser ambient newspaper to scan between turns.
