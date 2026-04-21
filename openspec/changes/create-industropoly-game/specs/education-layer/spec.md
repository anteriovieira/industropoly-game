## ADDED Requirements

### Requirement: Educational modal on tile interaction
When a player lands on any tile or opens a tile's info view, the app SHALL display an educational modal containing the tile's historical title, date, blurb, and source, in addition to any gameplay choices (buy, upgrade, pay rent).

#### Scenario: Modal on landing
- **WHEN** a token's movement resolves onto any tile
- **THEN** an educational modal appears for that tile showing title, date, blurb, and source before the turn is allowed to end

#### Scenario: Modal from inspection
- **WHEN** a player clicks/taps/focuses a tile and invokes "Info"
- **THEN** the same educational modal is shown, with no gameplay side effects

### Requirement: Educational content on card draw
When a card is drawn from either deck, the app SHALL display a card modal that shows the gameplay effect AND the educational blurb tied to the real historical event, invention, or decree represented by that card.

#### Scenario: Card modal contents
- **WHEN** a card is drawn
- **THEN** the modal shows the card's title, its gameplay effect in plain language, and its educational blurb; the player must acknowledge before the effect applies

### Requirement: Facts journal
The app SHALL maintain a per-game "Facts Journal" that records every unique educational payload the players have seen (tile lands and card draws). Players MUST be able to open the journal at any time during the game.

#### Scenario: Journal updates on first exposure
- **WHEN** any player lands on a tile or draws a card whose educational payload has not yet been recorded in this game
- **THEN** that payload is appended to the Facts Journal

#### Scenario: Journal accessible during game
- **WHEN** a player opens the HUD's "Journal" control during any turn phase
- **THEN** the journal view shows all recorded entries grouped by category (Industries, Inventions, Edicts, Transport) in chronological order

### Requirement: End-of-game recap
When the game ends, the summary screen SHALL present a recap of every entry in the Facts Journal, so players leave with a consolidated view of what they learned.

#### Scenario: Recap on win
- **WHEN** the `game-over` state is entered
- **THEN** the summary screen renders, among other info, the full contents of this game's Facts Journal grouped by category

### Requirement: Content quality constraints
All educational blurbs SHALL be factually accurate about the Industrial Revolution period, cite a source, and be written for a non-expert audience at roughly a middle-school reading level. Blurbs MUST NOT contain anachronisms (e.g., post-1900 technology references) unless explicitly marked as a later influence.

#### Scenario: Blurb validation
- **WHEN** the content dataset is linted in CI
- **THEN** every blurb passes checks for word-count range, presence of a date and source, and absence of banned anachronism keywords defined in the validator
