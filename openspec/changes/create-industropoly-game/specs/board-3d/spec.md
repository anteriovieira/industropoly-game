## ADDED Requirements

### Requirement: 3D board rendered with Three.js
The game board SHALL be rendered as a true 3D scene using Three.js via `@react-three/fiber`, not as a 2D canvas or CSS layout. The board MUST be a physical 3D mesh (extruded plane or similar) with tiles that exist as child 3D objects placed on its surface.

#### Scenario: Scene is 3D
- **WHEN** a developer inspects the mounted board view
- **THEN** the rendered DOM contains a `<canvas>` element owned by `@react-three/fiber`, and the scene graph includes a board mesh plus one mesh per tile in 3D space

#### Scenario: No 2D fallback as the primary board
- **WHEN** the game is in the `game` phase and WebGL is available
- **THEN** the primary board view is the 3D scene, not a 2D grid

### Requirement: 40-tile square layout
The board SHALL arrange exactly 40 tiles around the perimeter of a square: 11 tiles per edge including shared corners (i.e., 4 corner tiles + 9 side tiles × 4 sides = 40).

#### Scenario: Tile count and shape
- **WHEN** the board is initialized
- **THEN** the scene contains exactly 40 tile meshes, with 4 corner tiles positioned at the square's corners and 9 tiles evenly spaced along each side

### Requirement: Parchment background aesthetic
The board's top surface and the scene's background plane SHALL use an aged-parchment texture consistent with the reference image: weathered sepia paper, ink-drawn grid borders at the edges, and a compass rose in one corner of the central area. The style MUST NOT use bright saturated colors for the base board surface.

#### Scenario: Parchment texture applied
- **WHEN** the board renders
- **THEN** the central board surface shows the parchment texture, the outer frame renders inked border ticks along the edges, and a compass rose is visible on the board's central region

### Requirement: Sector color bands on tile groups
Purchasable industry tiles SHALL be grouped into color-coded sectors (e.g., Textiles, Coal & Iron, Railways, Chemicals, Finance). Each tile in a group MUST display a distinct color band along its outer edge so players can see group membership at a glance.

#### Scenario: Color band visible per group
- **WHEN** the camera is at the default angle
- **THEN** each purchasable tile displays a colored band matching its sector, and all tiles in the same sector share the exact same color

### Requirement: Camera controls
The scene SHALL provide an orbit-style camera with sensible defaults for a top-down-angled view of the full board and constraints that prevent disorienting rotations (no upside-down, polar-angle clamped) plus zoom limits.

#### Scenario: Default camera frames the board
- **WHEN** the game view mounts
- **THEN** the camera is positioned so the entire 40-tile board is visible within the viewport on a 1280×720 canvas

#### Scenario: Camera cannot flip upside-down
- **WHEN** the user drags to rotate the camera past vertical
- **THEN** rotation is clamped so the board remains right-side-up

### Requirement: Scene lighting and shadows
The scene SHALL include at least one directional/key light plus ambient fill, and tokens and tile upgrades MUST cast soft shadows onto the board surface when shadow quality is set to medium or higher.

#### Scenario: Shadow cast on board
- **WHEN** a token is placed on any tile at medium+ shadow quality
- **THEN** a soft shadow from the token is visible on the board surface

### Requirement: Center label and scene chrome
The center of the board SHALL display the game title "Industropoly" rendered as 3D text or a textured plaque, along with era-appropriate decorative iconography (e.g., cogs, smokestack silhouette). The center MUST NOT overlap or obscure the 40 perimeter tiles.

#### Scenario: Center label visible
- **WHEN** the board renders
- **THEN** the title "Industropoly" is readable in the center of the board, oriented to be legible from the default camera angle
