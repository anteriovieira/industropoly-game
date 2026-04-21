## Why

Today the only signal in the HUD that a player owns *anything* is their cash and the colored band painted under their token on the board. There's no list view: a player can't ask "what do I actually own?" without panning the camera around the perimeter and reading every tile. That breaks two things:

1. **Strategic play** — deciding whether to upgrade, mortgage, or push for a sector monopoly requires seeing your portfolio at a glance: which tiles, which sectors, current tier, mortgaged status, and the rent each is producing. None of that is surfaced.
2. **The educational loop** — properties are the artefacts the player has "earned" in the historical world. The Facts Journal logs *what they've read about*; there's no equivalent for *what they've acquired*. The acquisitions list is a natural place to revisit the title/date/blurb of each owned tile.

The acquisitions panel also sets up future affordances (mortgage / redeem / upgrade-from-list) that today require landing back on the tile to access.

## What Changes

- **New "Aquisições" HUD button** next to "Diário (J)" / "Jornal (H)" with shortcut **A**, opening a modal that lists the active player's owned tiles grouped by sector (industries) and by category (transports, utilities).
- **Per-tile row** shows: tile name, sector swatch, current tier (industries: 0–5, rendered as Base / Oficina / Fábrica / Cooperativa / Estaleiro / Império using existing labels), mortgaged badge, current rent (computed via existing `computeRent` selector with `diceTotal=7` for utilities so the figure is meaningful), and the educational title + date.
- **Sector grouping for industries** displays whether the player holds the full **monopoly** for that sector (existing `ownsSector` selector). Monopoly sectors get a visible "Monopólio" badge — this is a strategic cue and also explains why a base-tier rent is doubled.
- **Portfolio summary header** at the top of the modal: total tile count, total mortgage value available, total current rent income (sum of `computeRent` across owned tiles), plus the player's cash.
- **Player switcher** — by default the modal shows the **active** player's portfolio, with a tab strip at the top to switch to other (non-bankrupt) players' portfolios for opponent-scouting. Switching is read-only; ownership data is already public on the board.
- **Empty state** — when the active player owns nothing, render an italic "Nenhuma aquisição ainda — compre uma indústria, transporte ou utilidade pública para começar seu portfólio."
- **Read-only in this change.** No mortgage / redeem / upgrade actions yet — the panel is purely a view. The existing landing-time buy/upgrade flow is unchanged.

## Capabilities

### New Capabilities

- `player-acquisitions-view`: a HUD-accessible read-only panel that lists what each non-bankrupt player owns, grouped, with per-tile state (tier, mortgaged, rent) and a portfolio summary.

### Modified Capabilities

- *(none — this is purely additive UI on top of existing engine state. No reducer changes, no new actions, no save-schema changes.)*

## Impact

- **Code (additive)**:
  - `src/ui/modals/AcquisitionsModal.tsx` — new component, mirrors structure of [FactsJournal.tsx](src/ui/modals/FactsJournal.tsx).
  - `src/state/uiStore.ts` — add `acquisitionsOpen` boolean + setter, mirroring `journalOpen` / `storyOpen`.
  - `src/ui/Hud.tsx` — add the "Aquisições (A)" button alongside "Diário (J)" / "Jornal (H)".
  - `src/app/GameScreen.tsx` — mount `<AcquisitionsModal />` when `acquisitionsOpen`, register `A` keybinding parallel to the existing `J` / `H` shortcuts.
  - `src/engine/selectors.ts` — add a small `playerHoldings(state, playerId)` selector that returns owned tile ids grouped by role/sector. Pure, unit-testable.
- **Tests**:
  - `tests/engine/selectors.test.ts` (or new file) — `playerHoldings` returns correct grouping; respects mortgaged / sold tiles.
  - `tests/ui/AcquisitionsModal.test.tsx` — renders empty state when nothing owned; renders rows + monopoly badge for a player who owns a full sector; player switcher tab swaps the displayed portfolio.
- **Engine**: no change. No new actions, no reducer paths, no `GameState` fields.
- **Persistence**: no schema change.
- **No new dependencies.**
- **Behavior visible to the player**: a new panel they can open at any time to see and reason about their portfolio (and scout opponents'); strategic decisions stop requiring camera-panning the board.
