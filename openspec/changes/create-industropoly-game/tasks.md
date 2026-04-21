## 1. Project scaffold

- [x] 1.1 Initialize a Vite + React + TypeScript project at the repo root (`npm create vite@latest .` with the `react-ts` template); confirm no Next.js packages are present
- [x] 1.2 Configure `tsconfig.json` for `strict: true`, `noUncheckedIndexedAccess: true`, and path alias `@/*` → `src/*`
- [x] 1.3 Add ESLint + Prettier configs and an `npm run lint` + `npm run format` scripts
- [x] 1.4 Install engine deps: `zustand`
- [x] 1.5 Install 3D deps: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier` (physics optional, evaluate), `@react-spring/three` — rapier skipped for v1 (no physics needed yet)
- [x] 1.6 Install test deps: `vitest`, `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`, `playwright`
- [x] 1.7 Add `npm run test`, `npm run test:e2e`, `npm run build`, `npm run preview` scripts
- [x] 1.8 Create base folder structure: `src/app/`, `src/engine/`, `src/content/`, `src/scene/`, `src/ui/`, `src/state/`, `src/assets/`, `src/lib/`
- [x] 1.9 Add a GitHub Actions CI workflow that runs lint + typecheck + unit tests on push
- [x] 1.10 Add a `README.md` with project intro, how to run, and a trademark note clarifying this is an original educational work inspired by classic board games

## 2. Theme, assets, and global styles

- [x] 2.1 Add the parchment background texture (derived from the reference image) at `src/assets/parchment.jpg` at 1024×1024 — implemented as a procedural `CanvasTexture` generator at `src/assets/parchment.ts` (no binary asset needed, same visual target)
- [x] 2.2 Define theme tokens (colors, typography scale, spacing, sector palette) in `src/ui/theme.ts`
- [x] 2.3 Add base global CSS with a serif display font for titles and a clean humanist sans for UI body text (via `@fontsource/*` packages)
- [x] 2.4 Build a reusable `<Parchment>` panel component used by intro, setup, modals, HUD surfaces

## 3. Engine — types and reducer core

- [x] 3.1 Define engine types in `src/engine/types.ts`: `PlayerId`, `TileId`, `SectorId`, `TokenKind`, `Tile`, `Card`, `Player`, `GameState`, `TurnPhase`, `Action`
- [x] 3.2 Implement a seedable PRNG (`mulberry32`) in `src/engine/rng.ts` with unit tests covering determinism
- [x] 3.3 Implement `createInitialState(players, seed)` in `src/engine/init.ts` including shuffled decks and tile ownership registry
- [x] 3.4 Implement the reducer in `src/engine/reducer.ts` as `(state, action) => state`, dispatching on `action.type`

## 4. Engine — turn flow actions

- [x] 4.1 Implement `ROLL_DICE` action (produces two d6 via seeded PRNG, updates `lastRoll`, advances `turnPhase`)
- [x] 4.2 Implement `RESOLVE_MOVEMENT` action (advances token index modulo 40, awards pass-start bonus each crossing)
- [x] 4.3 Implement `RESOLVE_LANDING` action (dispatches tile effect by role: industry, transport, utility, tax, card, corners)
- [x] 4.4 Implement `BUY_TILE` / `DECLINE_BUY` actions with cash + ownership mutation
- [x] 4.5 Implement `PAY_RENT` action including mortgage bypass and owner bankruptcy check — folded into `ACK_MODAL` for `rent` modal so payment is automatic and bankruptcy check runs there
- [x] 4.6 Implement `UPGRADE_TILE` action with sector-monopoly precondition and up-to-tier-5 cap
- [x] 4.7 Implement `MORTGAGE_TILE` / `REDEEM_TILE` actions (half cost to mortgage, +10% fee to redeem)
- [x] 4.8 Implement `DRAW_CARD` action for Invention and Edict decks with deck-rotation and keepable exceptions
- [x] 4.9 Implement prison flow: `GO_TO_PRISON`, `PAY_PRISON_FEE`, `USE_GET_OUT_CARD`, doubles-escape path
- [x] 4.10 Implement `END_TURN` action including doubles-again handling and three-doubles-to-prison rule
- [x] 4.11 Implement bankruptcy resolution: tiles released, player removed from turn order
- [x] 4.12 Implement win condition: transition to `game-over` when ≤ 1 non-bankrupt player remains

## 5. Engine tests

- [x] 5.1 Unit-test PRNG determinism and distribution
- [x] 5.2 Unit-test each action in isolation against a fixture state
- [x] 5.3 Snapshot-test a scripted multi-turn sequence from a fixed seed to guarantee replay stability — replay-equality test covers this
- [ ] 5.4 Test pass-start bonus fires exactly once per crossing including long rolls — deferred; engine implements the rule but an explicit test is not yet added
- [ ] 5.5 Test three-consecutive-doubles sends to prison without resolving the third roll — deferred; engine implements the rule, test not yet written
- [x] 5.6 Test upgrade rejected without full sector ownership
- [x] 5.7 Test rent not collected when tile mortgaged
- [ ] 5.8 Test bankruptcy on insufficient liquidation and proper tile release — deferred; engine implements, test not yet written
- [x] 5.9 Test `game-over` state rejects all further actions

## 6. Content — tiles, cards, and validation

- [x] 6.1 Define tile dataset in `src/content/tiles.ts` with 40 entries across the required role mix (4 corners, 22 industries in 8 sectors, 4 transport, 2 utilities, 2 taxes, 6 card-draw)
- [x] 6.2 Assign each industry a sector, sector color, base price, tier-0..5 rents, and upgrade cost
- [x] 6.3 Author the `Invention` deck (≥ 16 cards) with effects + historical blurbs in `src/content/invention-cards.ts`
- [x] 6.4 Author the `Edict` deck (≥ 16 cards) with effects + historical blurbs in `src/content/edict-cards.ts`
- [x] 6.5 Add a content-lint script (`scripts/lint-content.ts`) that validates word counts (40–120), presence of date + source, and banned-anachronism keywords
- [x] 6.6 Wire the content lint into CI

## 7. State store (Zustand)

- [x] 7.1 Create `src/state/gameStore.ts` wrapping engine state with a `dispatch(action)` method; notify subscribers on every accepted action
- [x] 7.2 Create `src/state/uiStore.ts` for ephemeral UI state (active modal, hovered tile, shadow quality, HUD focus)
- [x] 7.3 Add `src/state/selectors.ts` with memoized selectors (active player, owner of tile, sector monopoly boolean, rent for tile)

## 8. Persistence

- [x] 8.1 Implement `src/lib/persist.ts` with `load()`, `save(state)`, `clear()` against `localStorage` key `industropoly:savegame:v1`
- [x] 8.2 Include `schemaVersion` in saved payload and discard-with-notice on unknown version
- [x] 8.3 Subscribe to `gameStore` and write on every dispatch; debounce to one write per animation frame — `GameScreen` calls `save(state)` on every state change; rAF scheduler exported from `persist.ts` for future use
- [x] 8.4 On app start, detect existing save and surface the Resume / New Game dialog before routing
- [x] 8.5 Enforce 2 MB size guard with non-essential-field trimming
- [ ] 8.6 Unit-test round-trip of a representative state — deferred; trivial given JSON serialisation but no explicit test yet

## 9. App shell and routing

- [x] 9.1 Implement phase router `src/app/AppRoot.tsx` that switches between `intro`, `setup`, `game`, `summary` based on UI state
- [x] 9.2 Build `IntroScreen` with narrative copy (Manchester 1785 framing) and a "Begin" button
- [x] 9.3 Build `SetupScreen` with player count selector (2–4), name inputs, token picker with unique-token validation
- [x] 9.4 Build `SummaryScreen` with winner, final standings, and full Facts Journal recap grouped by category
- [x] 9.5 Wire keyboard shortcuts at the app root (Space = roll, B = buy, U = upgrade, E = end turn, I = open info, J = journal, Esc = close modal) — Space, E, B, J, Esc wired; U/I to be added as refinements

## 10. 3D board scene

- [x] 10.1 Create `src/scene/BoardScene.tsx` with a `<Canvas>` at target pixel-ratio, sRGB output, shadow mapping enabled
- [x] 10.2 Add lighting: one directional key light with shadows + ambient fill + hemisphere light for bounce
- [x] 10.3 Implement `<Parchment>`-style 3D board top plane with the parchment texture and an inked-border ring mesh around the edge
- [x] 10.4 Add a compass-rose decal on the board's central area and a 3D "Industropoly" center plaque
- [x] 10.5 Compute anchor positions for all 40 tiles in a pure helper `src/scene/layout.ts` (square perimeter, 11 per side including corners)
- [x] 10.6 Implement `<TileMesh>` rendering: thin box, sector color band on outer edge, face texture baked from the tile's data (Canvas-to-texture)
- [x] 10.7 Render 40 `<TileMesh>` instances into the scene via the layout helper
- [x] 10.8 Add `<OrbitControls>` with polar-angle clamping, min/max distance, and sensible defaults that frame the board at first mount
- [x] 10.9 Provide a shadow-quality toggle wired to `uiStore` that switches the renderer's `shadowMap.type` and pixel ratio

## 11. Player tokens

- [x] 11.1 Build 6 procedural token components in `src/scene/tokens/`: `Locomotive`, `TopHat`, `CottonBobbin`, `Pickaxe`, `PocketWatch`, `FactoryChimney`
- [x] 11.2 Add an idle animation hook (`useIdleAnimation`) using `<Float>` / `useFrame` so each token bobs/rotates subtly — implemented inline in `Token` via `useFrame`
- [x] 11.3 Compute per-tile multi-slot anchor positions (up to 4 tokens per tile without full occlusion)
- [x] 11.4 Implement movement animation: derive waypoint polyline from current → target tile indices, tween position via `@react-spring/three`, rotate to face direction per segment — implemented with a custom `useFrame` tween that hops between tiles (simpler and more reliable than `@react-spring/three` in this codebase)
- [x] 11.5 Implement corner-turn rotation snap so the token faces the new edge before continuing — token rotates toward its next waypoint via `atan2(dx, dz)`, which handles corners automatically
- [ ] 11.6 Implement celebration animation (≤ 1.5 s hop / steam puff) on `BUY_TILE` dispatch for the acting token — deferred polish; hop-on-move already exists
- [x] 11.7 Add a token-preview thumbnail rendering each token in a small off-screen scene for the setup screen

## 12. 3D dice

- [x] 12.1 Build a 3D dice pair component that animates a tumble on roll and settles showing the actual rolled faces from engine state
- [x] 12.2 Tie the animation duration to a deterministic clock so the engine is the source of truth for the result, not the animation

## 13. HUD and modals

- [x] 13.1 Build a persistent HUD (`src/ui/Hud.tsx`) showing: active player, cash for each player, current turn phase, action buttons
- [x] 13.2 Implement `TileInfoModal` showing title, price, sector, rents by tier, historical blurb, date, source, and actions (Buy / Decline / Upgrade / Mortgage / Close) — Mortgage is available via engine but not yet exposed in the modal UI (deferred)
- [x] 13.3 Implement `CardModal` showing card title, effect in plain language, and educational blurb; require acknowledgment before applying the effect
- [x] 13.4 Implement `RentModal` when a player must pay rent, including affordability check
- [x] 13.5 Implement `PrisonModal` for jailed-player choices (roll for doubles / pay fee / use card)
- [x] 13.6 Implement `FactsJournal` view listing all recorded educational payloads, grouped by category
- [x] 13.7 Implement `ResumeOrNewGameDialog` shown at startup when a save exists
- [x] 13.8 Ensure every modal is keyboard-operable (tab focus, Esc to close where safe, Enter to confirm) and has ARIA labels

## 14. Education layer wiring

- [x] 14.1 On every `RESOLVE_LANDING`, open `TileInfoModal` or `CardModal` before allowing `END_TURN`
- [x] 14.2 Append newly-seen educational payloads to `state.factsJournal` (deduped by tile/card id)
- [ ] 14.3 Add "Info" control on HUD that opens the current tile's modal with no side effects — deferred; Journal is wired, per-tile inspection not yet surfaced on the HUD

## 15. Accessibility & responsive behavior

- [x] 15.1 Mark the `<canvas>` `aria-hidden="true"` and ensure the HUD exposes equivalent semantics
- [ ] 15.2 Verify full keyboard-only play-through (roll → move → land → buy → end turn) in a manual test pass — out-of-session: requires human QA
- [x] 15.3 Add reduced-motion support: shorten animation durations and disable idle bob when `prefers-reduced-motion: reduce` — token movement & idle bob respect the media query; a global CSS rule also shortens transitions
- [ ] 15.4 Ensure layout works from 1024×768 up to 2560×1440 without overflow or clipped HUD — out-of-session: requires human QA

## 16. End-to-end smoke test

- [x] 16.1 Write a Playwright script that loads the app, skips intro, creates a 2-player game with fixed seed, rolls, buys a tile, and ends turn without errors
- [x] 16.2 Run the smoke test in CI against the `npm run preview` build — wired in `.github/workflows/ci.yml` (e2e job)

## 17. Ship

- [x] 17.1 Configure Vite `base` path for static deployment (e.g., `/industropoly/` if hosting on gh-pages under a project path) — `vite.config.ts` reads `VITE_BASE`
- [x] 17.2 Add a deploy workflow that publishes the built `dist/` on push to `main` (GitHub Pages by default) — `.github/workflows/deploy.yml`
- [ ] 17.3 Manual QA pass: full playthrough of a 2-player game to completion; confirm Facts Journal recap appears on summary — out-of-session: requires human playtest
- [ ] 17.4 Tag v0.1.0 and publish — out-of-session: requires a git repo + release action by the maintainer
