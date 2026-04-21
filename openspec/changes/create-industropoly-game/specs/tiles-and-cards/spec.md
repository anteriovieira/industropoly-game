## ADDED Requirements

### Requirement: 40 tiles with themed roles
The board SHALL define exactly 40 tiles with roles mapped to Industrial Revolution themes: 4 corners (Start, Debtors' Prison, Free Parking / "Public Square", Go-To-Prison), 22 industries in 8 sector groups, 4 railway/transport tiles (canals and railways), 2 utility tiles (Coal Mine, Waterworks), 2 tax tiles (Parliament Tax, Crown Levy), and 6 card-draw tiles (3 Invention, 3 Edict).

#### Scenario: Tile totals match
- **WHEN** the tile dataset is loaded
- **THEN** it contains exactly 40 entries with the exact role counts: 4 corners, 22 industries, 4 transport, 2 utilities, 2 taxes, 6 card-draw

### Requirement: Sector groupings
Industry tiles SHALL be organized into 8 sector groups of varying size (matching Monopoly's 2–3 tiles per group), each with a distinct sector color and historical theme (e.g., Textiles, Coal & Iron, Shipyards, Chemicals, Railways-Industries, Publishing, Banking, Empire Finance).

#### Scenario: Sector membership
- **WHEN** any industry tile is inspected
- **THEN** it reports a sector name, a sector color (hex), and the list of all tile ids in that sector matches every other tile in that sector

### Requirement: Educational payload per tile
Every tile (all 40) SHALL carry an educational payload consisting of: a historical title, an approximate date or date range, a 40–120 word factual blurb, and a citation-style source reference (can be a book or reputable URL string).

#### Scenario: Educational payload completeness
- **WHEN** the tile dataset is validated
- **THEN** every tile has non-empty values for `title`, `date`, `blurb` (40–120 words), and `source`

### Requirement: Two card decks with educational payload
The game SHALL include two shuffled decks: `Invention` (equivalent to Chance) and `Edict` (equivalent to Community Chest). Each deck MUST contain at least 16 unique cards. Every card MUST specify a game effect (move, pay, receive, get-out-of-prison, etc.) AND an educational blurb tied to a real invention or decree from the Industrial Revolution era.

#### Scenario: Deck sizes and payloads
- **WHEN** the card datasets are loaded
- **THEN** the Invention deck contains ≥ 16 cards and the Edict deck contains ≥ 16 cards, and every card has both a machine-readable `effect` and a non-empty educational `blurb`

### Requirement: Card draw flow
When a player lands on a card-draw tile, the engine SHALL draw the top card of the corresponding deck, apply its effect, then move that card to the bottom of the deck. "Get out of Debtors' Prison" cards are the exception and MUST be retained by the drawing player until used.

#### Scenario: Ordinary card returns to deck
- **WHEN** a non-keepable card is drawn and its effect resolved
- **THEN** the card is placed at the bottom of its deck and the draw pointer advances

#### Scenario: Keep "Get out of Prison"
- **WHEN** a "Get out of Debtors' Prison" card is drawn
- **THEN** it is held by the drawing player and removed from the deck until they use or trade it

### Requirement: Tile visual characterization
Every tile SHALL be visually characterized on the 3D board with: a sector color band (for industries), a themed icon (e.g., loom for textiles, locomotive for railway), the tile's short name, and its price (for purchasable tiles). Iconography MUST reflect Industrial Revolution era motifs, not modern ones.

#### Scenario: Tile face displays required info
- **WHEN** the camera is at the default angle
- **THEN** each purchasable tile clearly shows its name, its price, and its themed icon; each corner and card-draw tile shows its name and icon

### Requirement: Mortgaging
Each industry, transport, and utility tile SHALL support a mortgage action that pays the owner half the tile's cost, disables rent collection, and blocks further upgrades until redeemed for the mortgage value plus a 10% fee.

#### Scenario: Mortgaged tile collects no rent
- **WHEN** a player lands on a mortgaged tile owned by another player
- **THEN** no rent is transferred
