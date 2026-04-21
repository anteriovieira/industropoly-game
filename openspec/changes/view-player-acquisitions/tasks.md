## 1. Engine selector

- [x] 1.1 Add `playerHoldings(state, playerId)` to [src/engine/selectors.ts](src/engine/selectors.ts) returning `{ industriesBySector, transports, utilities, totals }` per the design's shape. Group industries by `SectorId`, sort tile rows by `tileId` ascending, mark each sector group with `monopoly` via the existing `ownsSector` helper, and compute `totals` (`tileCount`, `mortgageValueAvailable` summing `mortgage` for unmortgaged tiles only, `rentIncome` summing `computeRent` with `diceTotal = 7`).
- [x] 1.2 Export the `PlayerHoldings` interface alongside the function so the modal can type its props.
- [x] 1.3 Add unit tests in [tests/engine/selectors.test.ts](tests/engine/selectors.test.ts) (or new `playerHoldings.test.ts`) covering: empty portfolio returns zeroed totals; partial sector ownership leaves `monopoly = false`; full sector ownership flips `monopoly = true`; mortgaged tiles are excluded from `mortgageValueAvailable` and contribute 0 to `rentIncome`; transport rent scales with the count of transports the player owns; utility rent uses `diceTotal = 7`.

## 2. UI store wiring

- [x] 2.1 In [src/state/uiStore.ts](src/state/uiStore.ts) add `acquisitionsOpen: boolean` and `setAcquisitionsOpen: (open: boolean) => void`, mirroring `journalOpen` / `setJournalOpen`.

## 3. Acquisitions modal component

- [x] 3.1 Create `src/ui/modals/AcquisitionsModal.tsx`. Use the existing `Modal` shell and follow the visual conventions in [FactsJournal.tsx](src/ui/modals/FactsJournal.tsx) (parchment, sectioned articles, sector swatches via `sectorPalette`).
- [x] 3.2 Local state `selectedPlayerId`, defaulting to `activePlayer(state).id` on mount. Compute holdings via `playerHoldings(state, selectedPlayerId)`.
- [x] 3.3 Render a sticky tab strip at the top with one tab per `nonBankruptPlayers(state)`. Active tab uses the player's HUD color (reuse the `PLAYER_COLORS` palette from [Hud.tsx](src/ui/Hud.tsx#L12) — extract to a shared module if convenient, otherwise duplicate the constant). Non-self tabs render a "👁" prefix.
- [x] 3.4 Render the sticky **summary header** showing player name, cash, total tile count, total mortgage value available, total rent income.
- [x] 3.5 Render the **Indústrias** section: one group per sector the player owns at least one tile in, with sector name + swatch + `owned/total tiles` + optional **Monopólio** badge. Tile rows show name, educational title + date, tier label (`Base`/`Oficina`/`Fábrica`/`Cooperativa`/`Estaleiro`/`Império`), `Hipotecado` badge when applicable, and the rent figure.
- [x] 3.6 Render the **Transportes** section (only when non-empty). Tile rows show name, educational title + date, mortgaged badge, and current rent (which depends on how many transports the player owns — already handled by `computeRent`).
- [x] 3.7 Render the **Utilidades públicas** section (only when non-empty). Tile rows show the rent figure with `×4` / `×10` multiplier and the caption "estimativa para soma dos dados = 7". Add a `title` tooltip with the same wording.
- [x] 3.8 Render the **empty state** italic line when `holdings.totals.tileCount === 0`.
- [x] 3.9 The modal must dispatch nothing — only `setAcquisitionsOpen(false)` on close.

## 4. HUD integration

- [x] 4.1 In [src/ui/Hud.tsx](src/ui/Hud.tsx) read `setAcquisitionsOpen` from `useUiStore`, add a button "Aquisições (A)" next to "Diário (J)" / "Jornal (H)" that plays the `click` audio cue and calls `setAcquisitionsOpen(true)`.
- [x] 4.2 In `src/app/GameScreen.tsx` mount `<AcquisitionsModal />` when `acquisitionsOpen` is true (mirroring how the journal/story modals are mounted).
- [x] 4.3 Register the `A` keybinding in `GameScreen.tsx` next to the existing `J` / `H` shortcuts. Suppress when any other modal is open (`state.modal !== null`, `journalOpen`, `storyOpen`, or the new `acquisitionsOpen`) and when the active element is an input/textarea, matching the precedent.

## 5. Component & integration tests

- [x] 5.1 Add `tests/ui/AcquisitionsModal.test.tsx`: renders empty state when the active player owns nothing.
- [x] 5.2 Renders sector groups, monopoly badge, mortgaged badge, and tier labels for a seeded state where `p1` owns the full Textiles sector with mixed tiers and one mortgaged tile.
- [x] 5.3 Tab switching: clicking another player's tab swaps the rendered portfolio without dispatching to the game store (assert via a spied `dispatch`).
- [x] 5.4 Keyboard test: pressing `A` opens the modal in `game` phase; pressing `A` again with the modal open is a no-op (or closes — match the precedent set by `J` in `GameScreen.tsx`).

## 6. Verification

- [x] 6.1 `npm run lint && npm run typecheck && npm test` all pass. (Note: `npm run lint` fails with a *pre-existing* repo issue — ESLint v9 doesn't pick up the legacy `.eslintrc.cjs`. Typecheck and full test suite pass.)
- [ ] 6.2 Manual smoke in dev (`npm run dev`): start a 2-player game, buy a couple of tiles, open the panel with the button and with `A`, switch tabs, verify totals match the visible board state. Confirm the panel scrolls when content overflows and that the summary header stays sticky. *(Manual step — not run in this session; please verify locally.)*
- [x] 6.3 Run `openspec validate view-player-acquisitions --strict` and confirm clean.
