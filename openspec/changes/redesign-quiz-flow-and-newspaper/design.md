## Context

Two recent changes shipped — `add-tile-quiz-gameplay` (quiz on landing) and `evolve-story-to-newspaper` (3 headlines per turn). After playing them, two issues surfaced:

1. **Quiz timing is too lenient.** Today: roll → token visually advances → quiz on landed tile → wrong = skip rule, end turn at the new tile. Right answer rate is fine, but wrong answers feel inconsequential because the player still moved (just didn't get to buy / had rent waived). The player has no time to absorb the landed tile's content before being tested on it.
2. **Newspaper looks like a brochure.** 3 headlines on a clean parchment plane. The reference period papers the user sent are 6–8 short items in 3 columns, framed by thin border rules, with mixed typographic weight and size, masthead in caps. Density is the look.

Plus the user explicitly asked to drop the inline "Acerte para seguir..." helper text.

Relevant existing code:

- `src/engine/reducer.ts`:
  - `handleRoll`: `awaiting-roll` → `moving`, sets `lastRoll`. Three-doubles → prison.
  - `handleResolveMovement`: `moving` → `awaiting-quiz-answer` (calls `startQuizForTile`) for gameplay tiles, or → `awaiting-end-turn` for corners. Records `lastResolvedTileId`. Handles `go-to-prison` corner inline.
  - `handleAnswerQuestion`: correct → `awaiting-land-action` + `handleResolveLanding`; wrong → `awaiting-end-turn`, position already moved.
  - `startQuizForTile(state, tileId)`: pure helper. Picks a question via `drawQuestionIndex`.
- `src/engine/init.ts`: seeds first newspaper with `pickIssue(s2.state, 3)`.
- `src/scene/NewspaperPanel.tsx`: drei `<Text>` lead + 2 side columns, full-opacity sepia, no frame.
- `src/ui/modals/QuestionModal.tsx`: helper line, prompt, options, hint shop. Result phase shows "Você sabia?" panel for the landed tile.
- `src/app/GameScreen.tsx`: auto-dispatches `RESOLVE_MOVEMENT` after `moving`.

Constraints:
- Engine stays pure; deterministic from `rngState`.
- No schema bump (`schemaVersion: 2` stays).
- Prison flow is independent (player escapes via `PRISON_ROLL` / `PAY_PRISON_FEE`); rolls inside prison happen there, not via `ROLL_DICE`.
- Token animations key off `turnPhase === 'moving'` and `state.lastRoll` — both must remain meaningful when movement actually happens.

## Goals / Non-Goals

**Goals:**
- Move the quiz gate from "after movement, about landed tile" to "after roll, about current tile".
- Wrong answer: token does not move; turn ends; `lastRoll` cleared so no animation fires.
- Skip the quiz when the active player starts the turn on a corner (no question authored).
- Replace the inline helper text with a short sub-header.
- Newspaper renders as a 3-column page with a lead + 5 secondary items, thin frame, masthead rule.

**Non-Goals:**
- Authoring new questions tailored to "you're parked here" framing — reuse existing 36 tile questions verbatim.
- Adding questions to corner tiles. Corners stay quiz-free.
- Changing quiz hint mechanics. Hint Shop and pricing unchanged.
- Content changes to the newspaper corpus. Same 68 stories, just 6 picked per issue.
- Mobile-specific layout. The HUD modal remains the canonical readable surface on small screens.
- Schema migration. Saves keep loading.

## Decisions

### Decision 1: New phase ordering — quiz between roll and movement

```
awaiting-roll
   ↓ ROLL_DICE
   ├─ active player on a quiz-eligible tile (industry/transport/utility/tax/card)
   │     → awaiting-quiz-answer (currentQuiz = pickQuestion(currentTile))
   │           ↓ ANSWER_QUESTION correct
   │           moving (token animates) → awaiting-land-action → ... → awaiting-end-turn
   │           ↓ ANSWER_QUESTION wrong
   │           awaiting-end-turn (position unchanged, lastRoll cleared)
   │
   └─ active player on a corner OR no question authored
         → moving (no quiz)
```

`handleRoll` is the right place to make the routing decision because it already owns the post-roll transition. The previous quiz hookup inside `handleResolveMovement` is removed; movement now only worries about hopping the token and updating cash for passing Start.

`startQuizForTile` is repurposed as the same pure helper, called from `handleRoll` instead of from `handleResolveMovement`. Its empty-pool fallback (no question for the tile) returns the state with `turnPhase: 'moving'` directly.

**Alternatives considered:**
- *Add a brand-new phase like `awaiting-roll-quiz`*: redundant; we already have `awaiting-quiz-answer`. The semantic question — "where in the turn are we?" — is captured by `currentQuiz != null`.
- *Keep the quiz in `RESOLVE_MOVEMENT` but make wrong-answer reverse the position*: feels hacky; reversing already-applied state risks subtle bugs (pass-Start bonus, doubles streak). Cleaner to gate before movement happens at all.

### Decision 2: Wrong answer = no movement, no rent, no card, end turn

The reducer transitions to `awaiting-end-turn` with:
- `lastRoll = null` (so the dice scene clears and no movement animation triggers)
- `position` unchanged
- `pendingLandingResolved = true` (so `END_TURN` accepts it)
- `modal = null`
- `currentQuiz = null`
- `quizStats.wrong` increments
- `doublesStreak` reset to 0 (the wrong answer eats the doubles bonus, same as before)

`lastResolvedTileId` is **not** updated on wrong (the player didn't land anywhere new). It still holds the previous turn's landing, so the next turn's quiz is about the same tile — which is the correct outcome: you're stuck because you didn't prove what you learned, so you face the same question again next turn (well, the question itself rotates via `drawQuestionIndex`, but it's about the same tile).

### Decision 3: Corner / first-turn behaviour

Corners (start, public-square, prison-as-visitor, go-to-prison) have no `QUESTIONS[id]` entries. On `ROLL_DICE`:

```ts
const onTile = TILE_INDEX[activePlayer.position];
const hasQuestion = onTile.role !== 'corner' && (QUESTIONS[onTile.id]?.length ?? 0) > 0;
if (hasQuestion) {
  // Enter awaiting-quiz-answer about the *current* tile
  return startQuizForCurrentTile(s, onTile.id);
}
// Skip the quiz gate, go straight to moving
return s; // turnPhase already 'moving' from handleRoll above
```

This handles:
- **Turn 1** for everyone (all start on tile 0, a corner) — no quiz, just roll.
- **Returning to Início via passing** — handled implicitly: passing through `0` happens during `RESOLVE_MOVEMENT`, not at the start of the turn. The tile the player is parked on at the *start* of a turn is what matters.
- **Visiting Prison without being jailed** — corner, no quiz.
- **Public Square** — corner, no quiz.

`go-to-prison` is unique: it's a corner so it has no question, but the player can only be parked on it at the *start* of a turn if their last action moved them there. Currently `handleResolveMovement` immediately ricochets the player to Prison (id 10) when they hit `go-to-prison` (id 30) and ends the turn — so the player is never *parked* on `go-to-prison` at the start of their next turn. No special handling needed.

**Alternatives considered:**
- *Author trivia for corners*: would unify the flow but breaks the current "corners are flow-state pauses" feeling. Out of scope.
- *Always require a quiz, fail open on missing*: same as above plus would force an awkward fallback. Rejected.

### Decision 4: Question selection still per-call deterministic via RNG

`startQuizForCurrentTile(state, tileId)` (renamed from `startQuizForTile` for clarity) consumes one RNG step via `drawQuestionIndex(rngState, questions.length)` to pick the question id. Same as today. No new RNG semantics.

### Decision 5: Drop helper line, add sub-header

In `QuestionModal.tsx`, replace:
```
Acerte para seguir com a regra da casa. Errar encerra o turno.
```
with:
```
*O Cronista pergunta:*
```
rendered in italic, ~0.85rem, opacity ~0.65, sitting above the prompt. Short, in-fiction, no instructions.

The result-phase title changes:
- Correct: stays "Resposta correta!" with body adjusted to "Sua peça avança."
- Wrong: stays "Resposta incorreta" with body adjusted to "Você fica parado neste turno."

The "Você sabia?" educational panel is reframed as **"Lembrete"** (the player has *been* on this tile, this is content they've already seen, now reviewed). The panel's content (title/date/blurb/source) is unchanged — pulled from `tile.education` of the *current* tile (`state.currentQuiz.tileId`), which is now the tile the player was parked on, not the landed tile.

### Decision 6: Newspaper layout — 6 items, 3 columns, framed

Visual grid (board-local units, board side ≈ 20, inner ≈ 16, working area ~14×11):

```
┌───────────────────────────────────────────────────────────┐
│           O CRONISTA INDUSTRIAL                           │
│           ───────────────────────                         │   ← masthead + thin rule
│              Edição 12                                    │   ← italic edition line
├───────────────────────────────────────────────────────────┤
│  LEAD HEADLINE TITLE                                      │
│  Two-line snippet of the lead story body...               │   ← lead, full-width
│                                                           │
├───────────────┬───────────────┬───────────────────────────┤
│ Item 2 title  │ Item 3 title  │ Item 4 title              │
│ snippet line  │ snippet line  │ snippet line              │
├───────────────┼───────────────┼───────────────────────────┤
│ Item 5 title  │ Item 6 title  │                           │
│ snippet line  │ snippet line  │                           │
└───────────────────────────────────────────────────────────┘
```

Implementation notes:
- One `<group>` at world origin, `rotation=[-π/2, 0, 0]`, `y = BOARD.tileDepth/2 + 0.025`.
- Four thin `<mesh>` planes form the **frame**: top, bottom, left, right rules at `colors.ink`, opacity 0.7. Width chosen so they sit just inside the inner-area edge.
- One thin `<mesh>` plane forms the **masthead rule** below the title.
- One thin `<mesh>` plane separates the lead from the secondary grid.
- Two thin vertical `<mesh>` planes separate the 3 columns of the secondary grid.
- Item count is 6: index 0 = lead, indices 1–5 = secondary in row-major across the 3 columns.
- Snippet trim: lead ~140 chars, secondary ~70 chars (shorter to fit narrower columns).
- Typography:
  - Masthead: size 0.7, `colors.ink`, `outlineWidth=0.012`, no italic.
  - Edition line: size 0.28, italic, `colors.inkSoft`.
  - Lead title: size 0.36, `colors.ink`, no italic, with a small outline for weight.
  - Lead snippet: size 0.22, `colors.inkSoft`.
  - Secondary title: size 0.22, `colors.ink`.
  - Secondary snippet: size 0.16, `colors.inkSoft`, lineHeight 1.25.
- Every `<Text>` and `<mesh>` in the panel sets `raycast={() => null}` for the texts and `pointerEvents` is moot on meshes since we don't add handlers. (drei `<Text>` requires the explicit raycast override; native `<mesh>` without `onPointer*` already does not capture.)
- All 6 stories resolved via `getStoryById`; if any is missing (corpus drift / undefined id), render the slot empty without crashing.

### Decision 7: `pickIssue` callers updated to count = 6

Both call sites (`init.ts` and `handleEndTurn`) bump from 3 to 6. The avoid set still defaults to the previous issue's headline ids — collision space grows from 3/68 to 6/68 of the corpus, still trivially satisfiable.

### Decision 8: HUD modal length is fine as-is

The `StoryModal` already iterates over `headlineIds` and renders each as an `<article>`. With 6 items and full bodies, the modal is taller — that's fine, it scrolls (Modal base already does `maxHeight: 80vh; overflow: auto`). Title bar wording is a one-line tweak.

## Risks / Trade-offs

- **Players can get stuck on a hard tile.** If a player parks on a tile with a question they consistently miss, they could spend several turns there. *Mitigation:* questions rotate (if a tile has multiple questions in `QUESTIONS[id]`); the Hint Shop is available; the player can buy hints to brute-force through. Long-term: author 2–3 questions per tile rather than 1 to enrich the rotation. Not part of this change.
- **First-turn skip might feel like the quiz isn't there.** Everyone starts on a corner so no quiz fires until their second turn. *Mitigation:* the first turn after landing on a real tile is when the loop kicks in; document briefly in the README.
- **Wrong answer + doubles** — currently doubles re-roll is preempted by wrong answers, and that stays true. The new flow makes this even cleaner since the wrong-answer transition happens *before* we'd ever know the player rolled doubles for a follow-up turn.
- **Animation hooks** — `GameScreen` reads `state.turnPhase === 'moving'` and `state.lastRoll` to time the dice / token animations. We must clear `lastRoll` on wrong-answer transitions to prevent a stale dice readout, and we must NOT clear it on correct (the moving phase needs the total). Tested below.
- **Newspaper density vs legibility on the 3D plane** — 6 items in 3 columns is denser; some snippets will read as visual texture from the default camera angle. The HUD modal compensates. Acceptable.
- **Frame and column rules add ~5 thin meshes.** Negligible perf impact. drei `<Text>` is the heavier cost and has not changed materially.
- **`startQuizForTile` rename** — there is exactly one caller; renaming risks no churn. Skipping the rename is also fine; we'll keep the name to minimise diff and document the new semantics in a JSDoc.

## Migration Plan

1. Reducer: rewire `handleRoll` to enter quiz when current tile has a question; remove the quiz-trigger from `handleResolveMovement`. Update `handleAnswerQuestion`'s wrong-branch to clear `lastRoll`, leave `position` alone, and drop the now-impossible "post-landing wrong" cases.
2. Init: bump `pickIssue(_, 6)`.
3. Reducer: bump `pickIssue(_, 6)` in `handleEndTurn`.
4. UI: rewrite `QuestionModal.tsx` copy (helper line removal + sub-header + result body wording + "Lembrete" panel title).
5. UI: rebuild `NewspaperPanel.tsx` for 3-column + frame + 6 items.
6. Tests: update reducer tests in `engine quiz flow` group — replace `enterQuizAt` helper to also exercise the new "ROLL_DICE on a current tile triggers the quiz" path; add corner-start no-quiz test; add wrong-answer position-unchanged + lastRoll-cleared test.
7. Tests: bump newspaper tests from 3 to 6 distinct ids.
8. Docs: README sentence on "you're tested before you can leave a tile".

## Open Questions

- **Edition line wording**: keep `Edição N` (default) or add a faux Industrial-era date suffix like "Edição 12 · Verão de 1789"? Default is plain `Edição N` for honesty.
- **Should the masthead include a small pictorial flourish (e.g., a tiny cog mesh)?** Default: no, keep it text-only in v1.
- **Should missed-question count surface anywhere besides `quizStats.wrong`?** E.g., a tooltip on the player's HUD chip showing how many turns they've been parked. Default: no, the visible "I haven't moved in 3 turns" pressure is enough.
