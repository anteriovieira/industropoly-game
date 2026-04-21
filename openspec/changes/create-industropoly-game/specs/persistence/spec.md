## ADDED Requirements

### Requirement: Autosave to localStorage
The app SHALL persist the complete game state (players, cash, tile ownership and tier, decks, turn state, RNG seed, Facts Journal) to `localStorage` after every accepted engine action under a single well-known key (e.g., `industropoly:savegame:v1`).

#### Scenario: State persists across reloads
- **WHEN** a player takes an action (e.g., rolls dice, buys a tile), then reloads the page
- **THEN** on reload the app detects the saved state and resumes from the exact same turn and state

### Requirement: Resume vs new game prompt
When a saved game exists on startup, the app SHALL offer the user a choice between "Resume" and "New Game" before showing the intro or setup screens.

#### Scenario: Offer resume on startup
- **WHEN** the app loads and a valid save exists
- **THEN** the user is shown a dialog with "Resume" and "New Game" options and no game action occurs until they choose

#### Scenario: New game clears save
- **WHEN** the user chooses "New Game" while a save exists
- **THEN** the save is deleted and the app transitions to the intro screen

### Requirement: Save schema versioning
Saved states SHALL include a `schemaVersion` integer. On load, if the save's `schemaVersion` is older than the current app version and no migration is available, the app MUST discard the save rather than crash.

#### Scenario: Incompatible save discarded
- **WHEN** a save with an unknown or older-unmigratable `schemaVersion` is loaded
- **THEN** the app shows a non-blocking notice ("Previous save incompatible — starting fresh"), removes the save from `localStorage`, and proceeds to the intro screen

### Requirement: No network persistence
The persistence layer MUST NOT make any network requests, and MUST NOT store user data anywhere other than the browser's `localStorage`.

#### Scenario: Offline play
- **WHEN** the app is used with the network disabled after initial asset load
- **THEN** save and load continue to work and no network errors are surfaced

### Requirement: Save size guard
The persistence layer SHALL verify that serialized state stays below 2 MB. If a serialized state would exceed the limit, the layer MUST log a warning and omit non-essential fields (e.g., Facts Journal cached text) while preserving authoritative engine state.

#### Scenario: Oversized state trimmed
- **WHEN** a prospective serialized save exceeds 2 MB
- **THEN** the persistence layer drops non-essential fields, re-serializes, and writes the trimmed payload; engine-authoritative state MUST still round-trip correctly
