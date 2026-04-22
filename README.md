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

## Online multiplayer (optional)

The hot-seat mode runs as a static SPA with no backend. The online mode adds a hosted Supabase project for rooms, realtime sync, and anonymous auth.

To enable it locally:

```bash
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project
npm run dev
```

Then open the app, click "Jogar online", and create a room. Open another browser window and join with the displayed code.

### Migrations

Schema lives under `supabase/migrations/`. To apply them to your linked project:

```bash
supabase link --project-ref <your-project-ref>   # one-time
supabase db push                                  # each new migration
```

For full setup notes (cloud project provisioning, env vars, cron), see [`scripts/supabase-init.md`](scripts/supabase-init.md).

### Online E2E

`tests/e2e/online-multiplayer.spec.ts` is a two-browser smoke test that hits the configured Supabase project. It is skipped by default (creates real rows). Run explicitly with:

```bash
RUN_SUPABASE_E2E=1 npx playwright test online-multiplayer
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

## Progressive Web App

Industropoly ships as an installable PWA. On Chrome/Edge/Android a subtle **Install app** button appears on the intro screen once the browser signals installability (`beforeinstallprompt`). On iOS Safari, where that event isn't supported, the intro screen offers **Adicionar à tela de início** which opens a short guide for the Share → Add to Home Screen flow. Once installed, the game launches in standalone mode (no browser chrome), and the app shell plus previously loaded fonts, images, and 3D assets are served from the Workbox cache — the game boots offline on subsequent visits.

### Updates

A non-blocking **Nova versão disponível** pill appears in the bottom-right when a new service worker is waiting to activate, so mid-game sessions aren't interrupted. Click **Recarregar** to swap to the new build, or dismiss to finish the current turn and let the next launch auto-update.

### Env flags

- `VITE_PWA_DEV=1 npm run dev` — enable the service worker in development (off by default so HMR isn't confused by stale caches).
- `VITE_PWA_DISABLE=1 npm run build` — emit a no-op build without the service worker or manifest registration. Useful as a rollback knob.

### Regenerating icons

The PWA icon set is rendered from source SVGs:

```bash
npm run icons
```

- Source SVGs: `assets/icon/industropoly-icon.svg`, `industropoly-icon-maskable.svg`, `industropoly-favicon.svg`.
- Outputs (committed): `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-touch-icon.png`, `public/favicon.svg`.

Edit the SVGs, rerun `npm run icons`, and commit the regenerated PNGs.

## Deploy

Any static host works (GitHub Pages, Netlify, Vercel static, S3). Build output in `dist/` is self-contained. Set `VITE_BASE=/industropoly/` when hosting under a subpath. Note: the PWA manifest uses `start_url: "/"` and `scope: "/"`; if you deploy under a subpath, override them via the manifest block in `vite.config.ts` to match `VITE_BASE`.

## Status

Early development. See `openspec/changes/create-industropoly-game/` for the active proposal, specs, and task list.
