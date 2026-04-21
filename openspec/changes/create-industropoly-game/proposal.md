## Why

Board games are a proven medium for teaching complex systems. The Industrial Revolution (c. 1760–1840) is a high-impact historical topic whose core dynamics — capital, factories, railways, labor, patents, resources — map remarkably well to Monopoly-style mechanics (property acquisition, rent, movement, chance). Building an educational, browser-playable reimagining called **Industropoly** lets players learn the era's key inventions, figures, and economic forces by operating inside them, not by reading about them. Delivering it as a pure React + Three.js web app (no Next.js, no backend) keeps the project shippable as a static site and easy for classrooms and self-learners to access.

## What Changes

- Bootstrap a new client-only React 18 + Vite application (no Next.js, no SSR, no server) under the repository root, written in TypeScript.
- Render the game board as a **true 3D board** (not a 2D overlay) using Three.js via `@react-three/fiber` and `@react-three/drei`, styled with an aged-parchment/cartographic aesthetic matching the provided reference image (weathered paper texture, compass rose, inked grid borders).
- Implement Monopoly-equivalent gameplay loop reskinned for the Industrial Revolution: 40 tiles arranged around a square board, 2–4 players, dice roll, movement, purchasable "industries" grouped by color/sector, rent, upgrade levels (Workshop → Factory → Mill → Foundry → Empire), two special-card decks, a starting bonus on pass, and a jail-equivalent ("Debtors' Prison").
- Characterize tiles and tokens with Industrial Revolution themes: locomotives, steam engines, textile mills, coal mines, patents, ironworks, canals, telegraphs; player tokens are animated 3D pieces (e.g., steam locomotive, top hat, cotton bobbin, pickaxe, pocket watch, factory chimney).
- Include a narrative intro screen ("Manchester, 1785 — the age of steam is dawning…") that frames the game and its learning goals before play begins.
- Attach **educational content** to every purchasable tile and every card: a short historical fact, a date, and a "Did you know?" blurb shown in a modal when the tile is landed on or bought — this is the teaching mechanism.
- Animate game pieces: idle bobbing, hop-along movement between tiles, turn-to-face direction of travel, and celebratory animation on purchase; animate the dice roll in 3D.
- Persist game state to `localStorage` so an in-progress game survives a reload. No accounts, no network calls.

## Capabilities

### New Capabilities
- `game-shell`: Top-level React application shell, routing between narrative intro → setup (player count, token choice) → game → end-game summary; theme and global parchment/industrial styling.
- `board-3d`: Three.js 3D board scene — 40 tiles, center logo, parchment background, camera controls, lighting, and visual theming of each sector.
- `player-tokens`: 3D animated player pieces (idle + movement + arrival animations), token selection, and per-tile positioning on the board.
- `game-engine`: Pure, framework-free gameplay logic — turn order, dice, movement, property ownership, rent calculation, upgrade tiers, bankruptcy, win condition, RNG seeding, and reducer-based state.
- `tiles-and-cards`: Data + rendering for all 40 tiles (industries, utilities, railways, taxes, corners) and the two special-card decks ("Chance"-equivalent `Invention` and "Community Chest"-equivalent `Edict`), each with themed art and an educational payload.
- `education-layer`: Educational modal/overlay system that surfaces the historical fact, date, and short explanation whenever a player interacts with a tile or draws a card, plus an end-of-game recap of facts encountered.
- `persistence`: Save/load the full game state to `localStorage`; resume-on-reload; "New game" clears it.

### Modified Capabilities
<!-- None — this is a greenfield project. -->

## Impact

- **Code**: Entire new codebase under the repo root. No existing code is affected.
- **Dependencies**: `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`, `zustand` (state), `vite`, `typescript`, `vitest` (engine tests). No server, no database, no auth.
- **Build / deploy**: Static SPA — any static host (GitHub Pages, Netlify, Vercel static, S3) works. No Node runtime required in production.
- **Assets**: Adds a small set of textures (parchment background matching the reference image, tile iconography) and optionally a few `.glb` models for tokens; everything ships inside `/public` or `/src/assets`.
- **Performance**: Target 60 fps on a mid-range laptop with up to 4 animated tokens visible; degrade gracefully on low-end devices by reducing shadow quality.
- **Accessibility**: 3D board is the primary view, but all game actions (roll, buy, upgrade, end turn) must also be operable via keyboard and a 2D HUD so the game is playable without relying on 3D interaction alone.
- **Out of scope**: Multiplayer over the network, user accounts, mobile-native builds, Next.js, server-rendered content, monetization.
