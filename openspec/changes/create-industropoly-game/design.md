## Context

Industropoly is a greenfield, client-only educational board game. There is no existing code to integrate with. The project will be delivered as a static SPA with a true 3D board rendered by Three.js and a framework-free game engine underneath. The stylistic anchor is the provided parchment background reference: weathered sepia paper, ink-drawn borders, a compass rose in one corner, subdued palette.

Key constraints:
- **No Next.js, no backend, no accounts.** Everything runs in the browser.
- **Educational first.** Teaching is the primary product function, gameplay is the vehicle.
- **Classroom-friendly.** Must load fast over modest networks, run on mid-range laptops, and degrade gracefully.

Primary users: a pair or small group of players (students, hobbyists, self-learners) sharing one device hot-seat style.

## Goals / Non-Goals

**Goals:**
- Monopoly-equivalent gameplay depth (40 tiles, sectors, upgrades, rent, cards, jail, bankruptcy) reskinned for the Industrial Revolution.
- Genuine 3D board and animated tokens using Three.js (`@react-three/fiber`).
- Parchment/cartographic visual identity that matches the reference image.
- Every tile and card carries factual, sourced educational content surfaced automatically in play.
- Game state survives reloads without a backend.
- Engine is testable in pure Node (no DOM).
- Fully keyboard-playable HUD so 3D is not a barrier to accessibility.

**Non-Goals:**
- Online multiplayer, lobbies, or matchmaking.
- User accounts, cloud saves, analytics.
- Native mobile apps, app-store distribution.
- Server-side rendering (explicitly ruled out — no Next.js).
- Monetization, micro-transactions, ads.
- Professional-studio-grade 3D art (models will be low-poly, primitive-composed or light `.glb`).
- Localization beyond English in v1 (structure will allow adding later).

## Decisions

### Stack: Vite + React 18 + TypeScript, no Next.js
**Why:** The user explicitly excluded Next.js. Vite gives fast dev iteration, tiny prod bundles, static output, and first-class TS. React 18 is the de-facto pairing for `@react-three/fiber`.
**Alternatives considered:** CRA (deprecated, slow), Parcel (less ecosystem for R3F), plain HTML + vanilla Three.js (loses component ergonomics for tile/token tree).

### 3D layer: `@react-three/fiber` + `@react-three/drei`
**Why:** Lets us express the scene graph declaratively in React components (tiles as JSX), matches how the rest of the app is built, and drei supplies `OrbitControls`, `Text`, `useGLTF`, shadow helpers — saving weeks of glue code. This is "Three.js" as requested, just via its React binding.
**Alternatives considered:** Raw `three` + imperative scene management (more code, harder to interleave with React state), Babylon.js (heavier, less React ecosystem), PlayCanvas (proprietary editor).

### State: Zustand for UI/session state, pure reducer for engine
**Why:** The engine is a pure `(state, action) => state` reducer so it's trivial to test in Node. Zustand wraps it with a subscribe-able store for React, avoids Context re-render storms, and is tiny (~1 KB). UI-ephemeral state (modals, hovered tile) also lives in Zustand but in a separate slice.
**Alternatives considered:** Redux Toolkit (more boilerplate for a solo app), React Context alone (re-render performance), XState (overkill for this state shape, though tempting for turn phases).

### Turn state as an explicit finite state machine (inside the reducer)
**Why:** Monopoly's turn has distinct phases (`awaiting-roll`, `moving`, `awaiting-land-action`, `drawing-card`, `in-prison`, `awaiting-end-turn`, `game-over`). Making phases explicit prevents bugs where, e.g., a player tries to end turn before paying rent. We encode this as a discriminated union on `state.turnPhase`.
**Alternatives considered:** Implicit booleans (brittle), XState (extra dep for a fixed 7-node FSM).

### RNG: seedable PRNG (mulberry32) stored in engine state
**Why:** Deterministic replays, snapshot-testable engine, reproducible bug reports.
**Alternatives considered:** `Math.random()` (non-deterministic, untestable), crypto RNG (unnecessary, not seedable).

### Tile/card content as data, not code
**Why:** 40 tiles + ~32 cards of factual content will iterate frequently. Keeping it as typed JSON/TS objects under `src/content/` lets educators or reviewers submit PRs without touching gameplay code, and lets a CI linter enforce content quality (word count, date, source). Types guarantee structure.
**Alternatives considered:** Markdown files (richer but needs parsing), CMS (violates "no backend"), hard-coding into components (worst for iteration).

### Animations: drei `<Float>` + spring interpolation (`maath` / `@react-spring/three`)
**Why:** Idle bob is trivial with `<Float>`. Movement between tiles is a tween along a computed waypoint polyline; spring-based tweening composes cleanly with R3F. Avoids pulling in a full animation editor.
**Alternatives considered:** GSAP (commercial paid license for some features, another dep), hand-rolled `useFrame` everywhere (works but noisy).

### Tokens: procedurally-composed primitives first, `.glb` upgrade later
**Why:** Ship v1 fast with a `<Locomotive>` component built from boxes/cylinders — no modeling pipeline needed, still 3D, still animatable. If art bandwidth appears later, swap to `.glb` through `useGLTF` without changing the engine.
**Alternatives considered:** `.glb`-from-day-one (blocks ship on 3D art), sprites-in-3D (violates the "3D pieces" requirement).

### Parchment background: one texture + procedural vignette
**Why:** Use the reference-style parchment as a tiled texture on the board-top plane, overlaid with an `ink-border` ring mesh for the ticks-and-lines edge. Compass rose is a separate decal on the central area. Keeps a single 1024×1024 parchment texture that doubles as the scene background plane.

### Board geometry as one "deck" plane with 40 child tile meshes
**Why:** Clean hierarchy — transforming the deck transforms everything. Each tile is a thin box with its own face texture (color band + icon + name + price baked via Canvas-to-texture at load time).
**Alternatives considered:** 40 independent meshes in world space (positioning math duplicated), one giant merged mesh with baked tile faces (kills ability to highlight/interact per tile).

### Persistence: single `localStorage` key, versioned JSON
**Why:** Simplest possible mechanism that satisfies the resume-on-reload spec. Version field enables graceful handling of schema changes post-launch.
**Alternatives considered:** IndexedDB (overkill for <200 KB), SessionStorage (doesn't survive tab close — violates intent), URL hash (unwieldy for this payload).

### Testing: Vitest for engine, Playwright for a thin smoke e2e
**Why:** Engine is the correctness-critical part — it deserves a full unit-test suite. Everything visual is hard to unit test, so one Playwright happy-path script (intro → setup → roll → buy → end turn) is enough to catch regressions without investing in visual-regression tooling early.

## Risks / Trade-offs

- **3D performance on low-end devices** → Detect WebGL2 + GPU tier via drei's `<Perf>` helpers or a simple benchmark on first load; expose a "Low quality" toggle (disable shadows, reduce pixel ratio). Keep animations affordable (≤ ~6 active meshes animating).
- **Learning curve / tall build** → Scope is large (engine + 3D + content). Mitigate by landing vertical slices: first a playable 2D-debug board with engine, then swap in the 3D scene. Keep the engine decoupled so the 3D layer can lag behind.
- **Content accuracy burden** → Every tile and card is a factual claim. Mitigate with (a) a source field required in the schema, (b) a CI lint that rejects missing sources / out-of-range word counts, (c) a review pass before publishing.
- **"Monopoly" trademark perception** → Avoid direct assets, names, and tile wording from Hasbro's game. Use era-appropriate renames (Debtors' Prison, Parliament Tax, Invention/Edict cards). Document in README.
- **Hot-seat UX is single-device** → Multiple players sharing a mouse/keyboard is fine for classrooms but limits sessions. Document as a known constraint in v1; the engine is already designed so adding networked play later is possible without rewriting.
- **`localStorage` quota / corruption** → Enforce the 2 MB guard; on parse failure, discard the save with a non-blocking notice instead of crashing.
- **Accessibility** → Color-coded sectors plus icon + name on every tile ensures color isn't the only signal. All engine actions exposed through keyboardable HUD. Screen-reader labels on HUD controls; the 3D scene itself is marked `aria-hidden` with an equivalent text HUD.
- **Bundle size** → `three` + r3f + drei is ~300–400 KB gzip. Mitigate with Vite code-splitting: lazy-load the game route so the intro screen paints fast.

## Migration Plan

This is a greenfield app — there is nothing to migrate from. Rollout:
1. Land an initial repository skeleton (Vite + TS + lint + test + CI) before any feature code.
2. Ship internally behind a `?debug` flag while the engine stabilizes; flip to the default view once the golden-path flow is complete.
3. First public release targets `gh-pages` for zero-cost hosting.
**Rollback:** N/A — static asset redeploy reverts instantly.

## Open Questions

- **Final tile roster**: the exact 22 industries and their prices/rents need to be tuned via playtesting. A first-cut dataset will ship so the engine can be exercised end-to-end; numbers will change.
- **Token roster**: should the catalogue include historical figures (e.g., Watt, Stephenson) in addition to object tokens? Trade-off between reverence and identifiability; default is objects only in v1.
- **How long is a game?** Target a ~45-minute session for classroom use. May need to tune starting cash, upgrade costs, or introduce an optional turn cap.
- **Sound**: in-scope later (dice clack, steam whistle on train tiles) but not in v1.
- **Persistence of Facts Journal across games**: right now the journal resets with each new game. Worth discussing whether a durable cross-session log is useful pedagogy.
