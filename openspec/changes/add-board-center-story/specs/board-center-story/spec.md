## ADDED Requirements

### Requirement: Ambient story panel at board center
The 3D scene SHALL render a static, low-contrast text block at the geometric center of the board, displaying a short historical story (title and body) drawn from the existing tile and card educational corpus. The panel MUST be readable from a neutral camera angle and MUST sit behind tokens and the dice in render order so it never blocks gameplay interaction.

#### Scenario: Panel visible from initial camera
- **WHEN** the player enters the game scene at the default camera tilt
- **THEN** a paragraph-sized story (≤ 6 lines after wrap) is visible at the inner-board center, with sepia "handwritten letter" styling

#### Scenario: Dice and tokens render above the panel
- **WHEN** the dice are mid-tumble or a token sits on a corner of the inner area near the panel
- **THEN** the dice and token meshes occlude the text where they overlap, never the other way around

### Requirement: Per-turn story rotation
The story SHALL change exactly once per turn boundary. When `END_TURN` is dispatched and successfully advances the active player, the engine MUST select a new `currentStoryId` deterministically from the RNG. The story MUST NOT change while a single player's turn is in progress (rolling, quiz, landing, modals).

#### Scenario: Rotates on successful END_TURN
- **WHEN** `END_TURN` is dispatched in a phase that allows it (e.g. `awaiting-end-turn` with `pendingLandingResolved`)
- **THEN** `currentStoryId` is set to a different story id than before, and `rngState` advances

#### Scenario: Stable across in-turn actions
- **WHEN** the active player rolls, answers a quiz, buys a tile, or interacts with any modal during their turn
- **THEN** `currentStoryId` does NOT change

#### Scenario: Rejected END_TURN does not rotate
- **WHEN** `END_TURN` is dispatched while the engine rejects it (e.g. landing not resolved, or in `awaiting-quiz-answer`)
- **THEN** `currentStoryId` remains unchanged

### Requirement: Story selection excludes the current and just-resolved tile
The story selection SHALL exclude any story whose `sourceRefId` matches `currentQuiz.tileId` (if a quiz is open) or `lastResolvedTileId` (the tile from the most recent landing). The selection MUST also exclude the previous `currentStoryId` so the panel never repeats back-to-back.

#### Scenario: Just-quizzed tile cannot be the next story
- **WHEN** a player has just been quizzed on tile X and ends the turn
- **THEN** the new `currentStoryId` does NOT correspond to tile X

#### Scenario: No immediate repeat
- **WHEN** rotation runs
- **THEN** the new `currentStoryId` differs from the previous one (unless the corpus has been exhausted by exclusions, in which case the engine MAY repeat)

### Requirement: Story panel exposed via HUD modal
The HUD SHALL provide a control (button or shortcut) that opens a modal showing the current story's title, body, and citation as plain text. The modal MUST be screen-reader accessible and MUST close without changing engine state.

#### Scenario: HUD button opens story modal
- **WHEN** the player clicks the HUD's "História" control
- **THEN** a modal opens displaying the title, body, and citation of the story matching `currentStoryId`

#### Scenario: Modal close is read-only
- **WHEN** the player closes the story modal (Esc, click-outside, or close button)
- **THEN** no engine action is dispatched and `currentStoryId` is unchanged

### Requirement: Story corpus derived from existing content
The story corpus SHALL be derived at build time from the existing tile educational payloads (excluding corner tiles) and from both card decks. Each story entry MUST carry a stable id, a title, a body of at least 40 words, and a citation. The derivation MUST NOT introduce duplicate ids.

#### Scenario: Corpus has at least 50 entries
- **WHEN** the `STORIES` array is built
- **THEN** it contains at least 50 unique entries combining non-corner tiles and both card decks

#### Scenario: Stable ids
- **WHEN** the corpus is built twice across runs
- **THEN** the set of ids is identical (e.g. `tile:1`, `card:invention-rocket`)
