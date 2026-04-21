## ADDED Requirements

### Requirement: Title plaque repositioned to make room
The 3D board's central title ("INDUSTROPOLY / A Era do Vapor") SHALL be moved to the top edge of the inner area and reduced in size so that the geometric center of the board is free for the story panel. The title MUST remain readable as a header.

#### Scenario: Title sits at the top of the inner area
- **WHEN** the `Board` component renders
- **THEN** the title text is positioned along the top edge of the inner board (closer to the row of tiles than to the geometric center) at a smaller font size than today

### Requirement: Story panel renders below tokens and dice
The new story panel SHALL render at the geometric center of the board, lying flat on the parchment surface with low opacity sepia text. Its draw order MUST keep it visually behind tokens and the dice meshes — overlap MUST show the token/dice on top of the text, not vice versa.

#### Scenario: Token over panel
- **WHEN** a token's tile happens to overlap the panel's bounds
- **THEN** the token mesh is rendered visibly on top of the text

#### Scenario: Dice tumble across panel
- **WHEN** the dice are mid-tumble above the central area
- **THEN** the dice are rendered above the text without z-fighting artifacts

### Requirement: Panel ignores pointer events
The story panel MUST NOT capture pointer or touch events. Clicks and touches in its area MUST pass through to whatever 3D object (e.g. a corner-tile or an empty board area) sits behind it.

#### Scenario: Click-through
- **WHEN** the player clicks on the central area where the story text is rendered
- **THEN** no story-related interaction fires; the click reaches the underlying 3D layer (e.g., board background) as it does today
