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

Every tile and every card carries a short, sourced historical blurb. The quiz now gates **movement**, not landing: when you roll the dice, if you're parked on a real tile (industry, transport, utility, tax, card-draw), a **multiple-choice question** about that tile pops up *before* your token moves:

- **Right answer** → your token advances by the dice roll, and the landing rule (buy offer, rent, tax, card draw) resolves normally at the destination.
- **Wrong answer** → you stay parked on the same tile, your turn ends, and the dice are discarded. No movement, no rent, no card.
- **Loja de Dicas** → mid-quiz, the player can spend cash to eliminate a wrong option, reveal a clue sentence, or expose the first letter of the correct answer. Hints are content-authored per question.
- **Corner tiles** (Início, Praça Pública, Visitando Prisão) have no questions, so rolling on a corner — including everyone's first turn at Manchester — moves the token without a quiz.

After every answer the game shows a **"Lembrete"** panel with the parked tile's full historical blurb and source — you've been here, this is what you saw. The HUD's **Info (I)** button still opens the standalone tile-info modal for out-of-turn browsing (no quiz). A per-game **Facts Journal** records every question seen and whether it was answered correctly. The end-of-game recap shows per-player quiz stats (acertos / erros / dicas / £ gastas em dicas) alongside the journal.

At the **center of the 3D board** a denser newspaper called **"O Cronista Industrial"** rotates one new edition per turn, laid out as a **3-column framed front page**: masthead with horizontal rule, edition line, a full-width lead headline, and 5 secondary items in a 3-column grid underneath. The 6 headlines per issue are drawn from the same tile/card blurb corpus (no separate authoring) and **deliberately overlap with the quiz corpus** — keeping up with the paper between turns is your ambient cheat sheet. The HUD's **📰 Jornal (H)** button opens a screen-reader-friendly modal listing every headline of the current edition with full body and citation.

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
