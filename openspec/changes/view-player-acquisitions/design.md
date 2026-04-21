## Context

The game's HUD currently shows per-player cash, name, and quiz stats — nothing about *what each player owns*. The board itself is the only ownership view: tiles get a colored band when bought, and the player must visually scan the perimeter to reconstruct their portfolio. With 22 purchasable tiles spread across 8 sectors plus 4 transports plus 2 utilities, that's a lot of cognitive overhead for a routine question ("do I own the full Textiles sector yet?").

Existing pieces we can lean on:

- [computeRent](src/engine/selectors.ts#L32) — pure, already accounts for tier, mortgage, monopoly bonus, transport count, and utility multiplier.
- [ownsSector](src/engine/selectors.ts#L24) — pure, returns true when a player holds every tile in a sector.
- [netWorth](src/engine/selectors.ts#L60) — already sums cash + mortgage value.
- [Modal](src/ui/modals/Modal.tsx) + [Parchment](src/ui/Parchment.tsx) + [sectorPalette](src/ui/theme.ts) — the visual vocabulary is established; the new modal must match (see [FactsJournal.tsx](src/ui/modals/FactsJournal.tsx) for the closest precedent — same modal shell, grouped sections, no actions).
- [uiStore](src/state/uiStore.ts) — `journalOpen` / `storyOpen` flags are the precedent for an open-flag pattern; we follow it verbatim for `acquisitionsOpen`.
- Keybinding: `J` (Diário) and `H` (Jornal) are wired in `GameScreen.tsx` (per the recent commit history); `A` is unused and will be the new shortcut.

This is a **read-only UI capability**. No engine state, no actions, no save migration.

## Goals / Non-Goals

**Goals:**

- Give the player a one-keystroke (`A`) overview of *what they own*, grouped by sector/category, with rent and tier visible.
- Surface monopoly status per sector (already a hidden engine signal that doubles base rent).
- Allow scouting opponents' portfolios — ownership is already public on the board, so a tab strip is just an ergonomic shortcut, not an information leak.
- Keep the panel pure-view in this change so it ships small. Mortgage/redeem/upgrade affordances are a clean follow-up.

**Non-Goals:**

- No mortgage / redeem / upgrade actions from this panel (deferred — keeps reducer untouched).
- No history view ("when did I buy this?") — the engine doesn't track acquisition turn today, and adding it would require a `GameState` field, which is out of scope.
- No bankruptcy projection / "if X lands here you owe Y" what-if calculator.
- No drag-to-reorder or filter UI — content density doesn't justify it.

## Decisions

### Decision 1: Add a pure selector `playerHoldings(state, playerId)` rather than computing groupings inline in the component

The component could iterate `state.tiles` and `TILES` directly, but that puts engine semantics in the UI layer (which sectors exist, how to group transports vs utilities, what counts as "owned"). A selector keeps the rule in one place, mirrors the existing pattern (`ownsSector`, `netWorth`, `computeRent`), and is unit-testable without React.

**Shape**:

```ts
interface PlayerHoldings {
  industriesBySector: Array<{
    sector: SectorId;
    tiles: Array<{ tileId: TileId; tier: number; mortgaged: boolean }>;
    monopoly: boolean;
  }>;
  transports: Array<{ tileId: TileId; mortgaged: boolean }>;
  utilities: Array<{ tileId: TileId; mortgaged: boolean }>;
  totals: { tileCount: number; mortgageValueAvailable: number; rentIncome: number };
}
```

**Rent income** is summed using `computeRent(state, tileId, /*diceTotal*/ 7)` — utility rent depends on the dice, so we pick the expected value of 2d6 (≈7) as a representative figure. The UI labels the column "Aluguel atual" and the utility row carries a tooltip "depende dos dados; estimado em 7" so the player isn't misled.

**Alternatives considered**:

- Component-side computation — rejected (couples UI to engine taxonomy).
- Add a memoized hook in `state/selectors.ts` — works, but the engine selector is the canonical home for tile-ownership questions; the UI selectors file is for store-shaped derivations (subscription patterns), not pure data shape. Pick the closer fit.

### Decision 2: Player switcher as tab strip at the top of the modal, defaulting to the active player

The same modal can scout opponents instead of needing four entry points. Defaulting to the active player matches the typical reason for opening it ("what should *I* do next?"). Bankrupt players are excluded (`nonBankruptPlayers` already exists).

**Alternatives considered**:

- One modal per player, opened via per-player buttons in the player strip — busier HUD; redundant with a tab inside the modal.
- A combined "all players" wide table — denser, but harder to read on smaller screens and removes the per-player monopoly/income summary header.

### Decision 3: Group industries by sector even when the player owns only one tile in the sector

Single-tile sectors still get a header row (sector name + swatch + "1/N tiles") so the path-to-monopoly is always visible. This makes the panel useful early in the game, when most sectors are partially owned.

### Decision 4: Mount the modal in `GameScreen.tsx`, not `AppRoot.tsx`

Modal lifetime should match the game phase. `GameScreen` already mounts the other game-only modals (Journal, Story, etc.); follow precedent. The `A` keybinding should also be registered in `GameScreen` for the same reason — opening the panel during `intro` / `setup` would have nothing to render.

### Decision 5: Empty state is a single italic line, not a "go buy something" CTA

The HUD already nudges players to land on tiles to buy them; an empty-state CTA inside this read-only panel would be aspirational filler. One italic line keeps the panel honest and quiet.

## Risks / Trade-offs

- **Risk**: Rent column for utilities ("£X with diceTotal=7") could mislead players into expecting that rent.
  → **Mitigation**: Caption + tooltip "estimativa para soma dos dados = 7" on utility rows; render the multiplier (×4 / ×10) alongside.

- **Risk**: Tab strip for player switcher could be mistaken for "I can act as that player".
  → **Mitigation**: Inactive-player tabs render with an "👁" icon and "(visualização)" suffix on the player tab label; the modal's monopoly badges and rent figures are the only things shown — no buttons render in the body.

- **Risk**: Modal becomes long when one player owns many tiles.
  → **Mitigation**: Modal already scrolls (`maxHeight: 80vh, overflow: auto` in [Modal.tsx](src/ui/modals/Modal.tsx#L54)). Sticky header (player tabs + summary) keeps the totals visible while scrolling.

- **Trade-off**: Adding a dedicated selector grows the engine surface by one function. Worth it for testability and reuse (a future "summary screen" could show end-game holdings using the same selector).

- **Trade-off**: Read-only in this change means the player still has to land on a tile to mortgage/upgrade. Acceptable — the panel solves the *information* problem, which is the bigger pain. Mortgage-from-list is a discrete follow-up change with its own engine-action work.

## Migration Plan

No data migration. The new modal/selector/keybinding ship together; rollback is `git revert`. Existing saves load unchanged because `GameState` is untouched.

## Open Questions

- *(none — all decisions above are concrete enough to implement.)*
