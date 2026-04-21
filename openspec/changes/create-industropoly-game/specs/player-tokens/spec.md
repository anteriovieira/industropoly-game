## ADDED Requirements

### Requirement: Industrial-Revolution-themed 3D tokens
The game SHALL provide at least 6 distinct 3D player tokens, each characterized by Industrial Revolution iconography (e.g., steam locomotive, top hat, cotton bobbin, pickaxe, pocket watch, factory chimney). Tokens MUST be represented as 3D meshes (primitive-composed or `.glb`), not 2D sprites.

#### Scenario: Token catalogue available at setup
- **WHEN** the player opens the setup screen
- **THEN** at least 6 distinct 3D tokens are selectable, each with a unique name and preview thumbnail

### Requirement: Idle animation
Each token on the board SHALL play a subtle idle animation (e.g., slow vertical bob, gentle rotation, or part-specific motion such as locomotive wheels turning) while it is not the active-moving token.

#### Scenario: Idle animation while waiting
- **WHEN** it is not a given token's turn and the token is stationary on a tile
- **THEN** the token plays a looping idle animation with an amplitude small enough not to leave its tile footprint

### Requirement: Movement animation between tiles
When a token moves, it SHALL animate along the tile path step-by-step (hop, slide, or ride) rather than teleport. The animation MUST traverse every intermediate tile in order and conclude at the destination tile's anchor point.

#### Scenario: Moving 6 spaces
- **WHEN** a player rolls a total of 6 and the engine advances that token 6 tiles
- **THEN** the token visibly animates through each of the 6 intermediate tile positions in sequence before stopping at the 6th tile

#### Scenario: Passing the starting tile
- **WHEN** a token's movement crosses the "Start"/"Go"-equivalent corner
- **THEN** the token animates past it (not around it) and the engine triggers the pass-start bonus exactly once per pass

### Requirement: Arrival/celebration animation on purchase
When a player purchases the industry tile the token is standing on, the token SHALL play a brief (≤ 1.5 s) celebratory animation (e.g., hop, puff of steam, tip of hat) before returning to idle.

#### Scenario: Celebration on purchase
- **WHEN** the active player confirms purchase of an unowned industry
- **THEN** the token plays its celebration animation once and only once, after which control returns to the turn flow

### Requirement: Facing direction of travel
A moving token SHALL rotate to face the direction of travel before moving along an edge of the board and turn to face the new direction at corners.

#### Scenario: Corner turn
- **WHEN** a token's path crosses a corner tile
- **THEN** the token visibly rotates 90° to face the new edge before continuing movement

### Requirement: Unique per-tile positioning for multiple tokens
When more than one token occupies the same tile, tokens SHALL be positioned at distinct anchor points within that tile (e.g., a small grid of up to 4 slots) so no token is fully occluded by another.

#### Scenario: Multiple tokens on one tile
- **WHEN** 2, 3, or 4 tokens occupy the same tile
- **THEN** each token is placed at a distinct slot within the tile and all tokens remain at least partially visible from the default camera angle
