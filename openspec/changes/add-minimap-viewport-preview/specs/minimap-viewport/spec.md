## ADDED Requirements

### Requirement: Minimap overlay is rendered in the HUD

The HUD SHALL render a minimap overlay that displays a top-down schematic of the full board loop. The overlay MUST be anchored to the bottom-left of the viewport and MUST NOT block pointer events outside its own footprint.

#### Scenario: Minimap is visible while a game is in progress
- **WHEN** a game is active and the HUD is mounted
- **THEN** the minimap overlay is visible in the bottom-left of the viewport
- **AND** its footprint is a compact square (roughly 140×140 CSS pixels) above the bottom control bar

#### Scenario: Minimap does not intercept clicks outside itself
- **WHEN** the user clicks the 3D board outside the minimap's footprint
- **THEN** the click reaches the 3D scene and is not captured by the minimap overlay

### Requirement: Minimap mirrors the physical board layout

The minimap SHALL render one marker per board tile, in the same ring order and relative position as the 3D board, so that corner tiles appear at corners and side tiles between them.

#### Scenario: All 40 tiles are represented
- **WHEN** the minimap is rendered
- **THEN** exactly 40 tile markers are present
- **AND** the four corner tiles sit at the four corners of the minimap's square viewport

### Requirement: Active player's landing tile is emphasised

The minimap SHALL emphasise the tile currently occupied by the active player so the user can identify where their token stopped without panning the 3D view.

#### Scenario: Highlight follows the active player after movement
- **WHEN** the active player's token finishes moving to a new tile
- **THEN** the marker for that tile on the minimap is visually emphasised (e.g. a ring or glow) using the active player's color
- **AND** no other tile is emphasised

#### Scenario: Highlight updates when turn passes to another player
- **WHEN** the active player changes (turn ends)
- **THEN** the emphasis moves to the new active player's current tile

### Requirement: All players are visible on the minimap

The minimap SHALL render each non-bankrupt player's position as a small dot using that player's color, so relative positions remain readable.

#### Scenario: Player dots render at their current tile
- **WHEN** the minimap is rendered
- **THEN** each non-bankrupt player appears as a colored dot at the minimap marker for their current tile
- **AND** the dot uses the same color as the player's HUD card

#### Scenario: Multiple players on the same tile remain distinguishable
- **WHEN** two or more players occupy the same tile
- **THEN** their dots are arranged so each player's color is visible (e.g. stacked or angularly offset around the tile centre)

#### Scenario: Bankrupt players are not shown
- **WHEN** a player is bankrupt
- **THEN** no dot is rendered for that player on the minimap

### Requirement: Clicking the minimap focuses the 3D camera on the active player's tile

The minimap SHALL act as a click-to-focus control. Activating it MUST pan the 3D camera so the active player's current tile is centred in the viewport, without resetting zoom level to default if the user has intentionally zoomed.

#### Scenario: Click centres the 3D camera on the active player's tile
- **WHEN** the user clicks (or taps) the minimap
- **THEN** the 3D camera's pan target moves to the world position of the active player's current tile
- **AND** the minimap highlight and the 3D view now show the same tile in frame

#### Scenario: Keyboard activation is supported
- **WHEN** the minimap control has keyboard focus and the user presses Enter or Space
- **THEN** the 3D camera focuses on the active player's tile as if the control were clicked

### Requirement: Minimap updates reactively

The minimap SHALL reflect state changes from the game store without requiring a manual refresh.

#### Scenario: Token dots move as the active player advances
- **WHEN** the active player's position changes during movement resolution
- **THEN** the minimap's dot for that player updates to the new tile on the next render

#### Scenario: Highlight updates across turns
- **WHEN** the turn advances to another player
- **THEN** the emphasised tile on the minimap is the new active player's tile

### Requirement: Minimap is accessible

The minimap SHALL be exposed to assistive technologies with a descriptive label and keyboard operability, and MUST NOT rely on color alone to convey the active player's position.

#### Scenario: Minimap has an accessible label
- **WHEN** a screen reader inspects the minimap control
- **THEN** it reads an accessible name that identifies the control as a board minimap / focus control (e.g. "Centralizar câmera na casa atual")

#### Scenario: Active tile is conveyed without relying solely on color
- **WHEN** the active player's tile is emphasised
- **THEN** the emphasis uses at least one non-color cue (e.g. a ring, pulse, or size change) in addition to color
