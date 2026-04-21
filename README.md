# Industropoly

An educational, browser-playable board game inspired by the Monopoly genre, reskinned for the Industrial Revolution (c. 1760–1840). Two to four players share a device hot-seat style, roll 3D dice, move animated tokens around a true 3D board rendered with Three.js, and learn the era's key inventions, industries, and edicts as they play.

> **Trademark note.** Industropoly is an original educational work. It is not affiliated with, endorsed by, or sponsored by Hasbro, Parker Brothers, or any rights-holder of the MONOPOLY® board game. Gameplay mechanics are common to the board-game genre and have been reimagined with original tile roster, artwork, cards, and historical content.

## Tech stack

- **Vite + React 18 + TypeScript** — no Next.js, no server, ships as a static SPA.
- **Three.js** via `@react-three/fiber` and `@react-three/drei` for the 3D board and animated tokens.
- **Zustand** for state; the core game engine is a pure `(state, action) => state` reducer testable under Node.
- **Vitest** for unit tests, **Playwright** for a thin smoke e2e.

## Getting started

```bash
npm install
npm run dev          # start dev server
npm run test         # run engine unit tests
npm run lint         # lint
npm run typecheck    # type-check
npm run build        # produce static dist/
npm run preview      # preview the built site
npm run test:e2e     # run Playwright smoke test against preview
npm run lint:content # validate tile + card educational content
```

## Repository layout

```
src/
  app/        Top-level app shell and phase routing
  scene/      Three.js scene: board, tokens, dice
  ui/         HUD, modals, theming
  engine/     Pure game engine (no React, no DOM)
  content/    Tiles + cards (data, not code)
  state/      Zustand stores + selectors
  lib/        Small utilities (persistence, helpers)
  assets/     Textures + fonts
tests/
  unit/       Vitest
  e2e/        Playwright
scripts/      Dev scripts (content lint, etc.)
openspec/     Specs and change proposals (source of truth for requirements)
```

## How the game teaches

Every purchasable tile and every card carries a short, sourced historical blurb. Landing on a tile or drawing a card opens an educational modal before the play effect resolves. A per-game **Facts Journal** records every unique payload the table has seen, and the end-of-game summary recaps the full journal. See `openspec/changes/create-industropoly-game/specs/education-layer/spec.md` for the behavioral contract.

## Deploy

Any static host works (GitHub Pages, Netlify, Vercel static, S3). Build output in `dist/` is self-contained. Set `VITE_BASE=/industropoly/` when hosting under a subpath.

## Status

Early development. See `openspec/changes/create-industropoly-game/` for the active proposal, specs, and task list.
