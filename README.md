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

Every tile and every card carries a short, sourced historical blurb. When a player's token lands on a tile, the game shows a **multiple-choice question** drawn from that tile's content before the rule (buy offer, rent, tax, card draw) runs:

- **Right answer** → the rule resolves normally and the player keeps acting on the tile.
- **Wrong answer** → the tile's rule is skipped and the turn ends. No buy offer, no rent collected, no card drawn.
- **Loja de Dicas** → mid-quiz, the player can spend cash to eliminate a wrong option, reveal a clue sentence, or expose the first letter of the correct answer. Hints are content-authored per question.

After every answer the game shows a **"Você sabia?"** panel with the tile's full historical blurb and source — the teach moment lands with the answer in mind. The HUD's **Info (I)** button still opens the standalone tile-info modal for out-of-turn browsing (no quiz). A per-game **Facts Journal** records every question seen and whether it was answered correctly. The end-of-game recap shows per-player quiz stats (acertos / erros / dicas / £ gastas em dicas) alongside the journal. See `openspec/changes/add-tile-quiz-gameplay/specs/tile-quiz-gameplay/spec.md` for the behavioral contract.

At the **center of the 3D board** a faded sepia "letter" rotates one story per turn, so non-active players have something to read while waiting. The story is drawn from the same tile/card blurb corpus (no separate authoring), excludes the tile tied to the current or most recent quiz so it never becomes a cheat sheet, and is also exposed via the HUD's **📜 História (H)** button, which opens a fully readable, screen-reader-friendly modal. See `openspec/changes/add-board-center-story/specs/board-center-story/spec.md`.

### Adding a question

Question content lives in `src/content/questions.ts`, keyed by `tileId`. Every gameplay-rule tile (industry, transport, utility, tax, card-draw) needs at least one entry:

```ts
1: [
  {
    id: 'q-cromford-1',
    prompt: 'Quem construiu a tecelagem de Cromford…?',
    options: [
      { id: 'a', text: 'James Watt' },
      { id: 'b', text: 'Richard Arkwright' },
      { id: 'c', text: 'Edmund Cartwright' },
    ],
    correctOptionId: 'b',
    hints: [
      { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'a' },
      { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O sobrenome virou nome de tear.' },
    ],
    source: 'R. Fitton, "The Arkwrights: Spinners of Fortune" (1989)',
  },
],
```

Then run `npm run lint:content` — the lint enforces that every gameplay tile has a question, options are 2..4, `correctOptionId` matches an option, sources are present, and `eliminate-option` hints don't target the correct answer.

## Deploy

Any static host works (GitHub Pages, Netlify, Vercel static, S3). Build output in `dist/` is self-contained. Set `VITE_BASE=/industropoly/` when hosting under a subpath.

## Status

Early development. See `openspec/changes/create-industropoly-game/` for the active proposal, specs, and task list.
