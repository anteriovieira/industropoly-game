## MODIFIED Requirements

### Requirement: Ambient story panel at board center
The 3D scene SHALL render a **newspaper issue** at the geometric center of the board, displaying a masthead, an edition line with the current issue number, and a set of short headlines (title + snippet) drawn from the existing tile and card educational corpus. The panel MUST be readable from a neutral camera angle using legible serif typography at full ink opacity, and MUST sit behind tokens and the dice in render order so it never blocks gameplay interaction.

#### Scenario: Newspaper visible from initial camera
- **WHEN** the player enters the game scene at the default camera tilt
- **THEN** a masthead, an edition line showing `Edição <issueNumber>`, and three short headlines (title + snippet) are visible on the inner board, using a clear serif (not italic, not low-opacity)

#### Scenario: Dice and tokens render above the panel
- **WHEN** the dice are mid-tumble or a token sits on a corner of the inner area near the panel
- **THEN** the dice and token meshes occlude the newspaper text where they overlap, never the other way around

### Requirement: Per-turn newspaper rotation
The newspaper SHALL rotate exactly once per accepted `END_TURN`. Each rotation MUST increment `issueNumber` by 1 and select a new set of distinct `headlineIds` from the corpus. The newspaper MUST NOT change while a single player's turn is in progress.

#### Scenario: Rotates on successful END_TURN
- **WHEN** `END_TURN` is accepted in a phase that allows it (e.g. `awaiting-end-turn` with `pendingLandingResolved`)
- **THEN** `currentNewspaper.issueNumber` increases by 1, `currentNewspaper.headlineIds` changes, and `rngState` advances

#### Scenario: Stable across in-turn actions
- **WHEN** the active player rolls, answers a quiz, buys a tile, or interacts with any modal during their turn
- **THEN** `currentNewspaper` does NOT change

#### Scenario: Rejected END_TURN does not rotate
- **WHEN** `END_TURN` is dispatched while the engine rejects it (e.g. landing not resolved, or in `awaiting-quiz-answer`)
- **THEN** `currentNewspaper` is unchanged

### Requirement: Headline selection — distinct, no quiz exclusion
Each issue SHALL contain exactly 3 distinct `headlineIds`. The selection MUST draw uniformly from the full `STORIES` corpus, avoiding only the previous issue's `headlineIds` to minimise back-to-back repeats within a rotation. The selection MUST NOT exclude the current quiz tile, the most recently resolved tile, or any other quiz-related content — ambient overlap with upcoming questions is intentional.

#### Scenario: 3 distinct headlines per issue
- **WHEN** an issue is picked
- **THEN** its `headlineIds` has length 3 and all ids are pairwise distinct

#### Scenario: Previous issue's headlines avoided
- **WHEN** an issue rotates to a new issue
- **THEN** the new `headlineIds` share as few ids as possible with the previous issue — with the 68-entry corpus used today, the new issue MUST NOT repeat any id from the previous issue

#### Scenario: Quiz-related content not excluded
- **WHEN** the active player has a `currentQuiz` open for tile X or has just resolved a landing on tile X
- **THEN** the next issue's `headlineIds` MAY include `tile:X` (the engine does NOT filter it out)

### Requirement: Newspaper exposed via HUD modal
The HUD SHALL provide a control (labelled "📰 Jornal" or equivalent, with keyboard shortcut `H`) that opens a modal showing the full current issue: masthead, edition number, and every headline's full title, body, and citation. The modal MUST be screen-reader accessible and MUST close without changing engine state.

#### Scenario: HUD button opens issue modal
- **WHEN** the player clicks the HUD's newspaper control or presses `H`
- **THEN** a modal opens showing the current issue's edition number and every headline with its title, body, and citation

#### Scenario: Modal close is read-only
- **WHEN** the player closes the newspaper modal (Esc, click-outside, or close button)
- **THEN** no engine action is dispatched and `currentNewspaper` is unchanged
