## ADDED Requirements

### Requirement: Client-only React application
The application SHALL be a client-only React 18 single-page application built with Vite and TypeScript. It MUST NOT depend on Next.js, any server-side rendering framework, or any backend service to function.

#### Scenario: Launching from a static host
- **WHEN** the built `dist/` output is served from any static file host and a user opens the root URL
- **THEN** the game loads and is fully playable without any network calls other than fetching static assets

#### Scenario: No Next.js dependency
- **WHEN** a developer inspects `package.json`
- **THEN** neither `next` nor `@next/*` packages appear in dependencies or devDependencies

### Requirement: Narrative intro screen
The application SHALL present a narrative intro screen as the first view a new player sees, contextualizing the game within the Industrial Revolution (c. 1760–1840) and stating the educational goal before gameplay begins.

#### Scenario: First visit shows the narrative
- **WHEN** a user opens the app with no existing saved game
- **THEN** the intro screen is displayed with at least one paragraph of story text (e.g., set in Manchester, 1785) and a "Begin" call-to-action

#### Scenario: Skipping to setup
- **WHEN** the user clicks "Begin" on the intro screen
- **THEN** the app advances to the setup screen and does not re-show the narrative unless the user returns to it explicitly

### Requirement: Game setup flow
The application SHALL provide a setup screen where a human configures the game before play: number of players (2–4), a display name per player, and a unique 3D token choice per player.

#### Scenario: Choosing players and tokens
- **WHEN** the user selects 2–4 players, enters a name for each, and picks a distinct token for each
- **THEN** the "Start Game" button becomes enabled and clicking it transitions to the game view with those players seeded

#### Scenario: Preventing duplicate tokens
- **WHEN** the user tries to assign a token already chosen by another player
- **THEN** the duplicate selection is rejected and the UI indicates the token is taken

### Requirement: Top-level routing between phases
The app SHALL route between four phases — `intro`, `setup`, `game`, `summary` — using client-side state only (no server routing). Phase transitions MUST be driven by explicit user actions or game-engine events.

#### Scenario: Advancing to summary on game end
- **WHEN** the game engine reports a winner (all other players bankrupt)
- **THEN** the app transitions to the `summary` phase showing the winner, final standings, and a recap of historical facts encountered

### Requirement: Parchment/industrial visual theme
The app SHALL apply a consistent visual theme evoking aged parchment and Industrial Revolution iconography across all screens (intro, setup, game HUD, summary), including a weathered paper texture on large background surfaces, serif display fonts for titles, and muted sepia/ink color palette.

#### Scenario: Theme presence on every screen
- **WHEN** a user navigates through intro → setup → game → summary
- **THEN** each screen uses the shared theme tokens (colors, typography, background texture) defined in a single theme module

### Requirement: Keyboard and HUD operability
Every core game action (roll dice, buy tile, upgrade tile, end turn, draw card acknowledgment, open tile info) SHALL be reachable via an on-screen 2D HUD control and via a keyboard shortcut, so players can play without interacting with the 3D scene directly.

#### Scenario: Keyboard-only turn
- **WHEN** a player takes a full turn using only keyboard shortcuts
- **THEN** the game advances correctly through roll → move → optional action → end turn with no mouse input required
