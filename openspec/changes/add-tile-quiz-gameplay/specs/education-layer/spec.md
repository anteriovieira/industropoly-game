## MODIFIED Requirements

### Requirement: Educational modal on tile interaction
When a player lands on any tile with educational content, the app SHALL surface that content **after** the tile's quiz resolves (as a "Did you know?" panel attached to the quiz result) rather than before the tile's rule runs. When a player invokes "Info" on a tile from the HUD or board (out-of-turn inspection), the app SHALL still display the standalone educational modal (title, date, blurb, source) with no quiz and no gameplay side effects.

#### Scenario: Content shown after landing quiz
- **WHEN** a player has just submitted an answer (correct or wrong) to a landing-triggered quiz
- **THEN** the result view renders the landed tile's title, date, blurb, and source next to the outcome, before the player proceeds to the tile rule (on correct) or to end-turn (on wrong)

#### Scenario: HUD inspection still shows info modal
- **WHEN** a player clicks/taps/focuses a tile and invokes "Info" outside of a landing flow
- **THEN** the standalone educational modal is shown unchanged, with no quiz and no gameplay side effects

### Requirement: Facts journal
The app SHALL maintain a per-game "Facts Journal" that records every unique educational payload the players have interacted with. An entry is recorded on the event that produced it: tile quiz answered (right or wrong), card drawn, or HUD inspection acknowledged. Tile-landing entries MUST carry the `questionId` and `answerOutcome` (`'correct' | 'wrong'`). Players MUST be able to open the journal at any time during the game.

#### Scenario: Journal updates on first quiz answer
- **WHEN** a player answers a question on a tile whose `(tileId, questionId)` pair has not yet been recorded in this game
- **THEN** the payload is appended to the Facts Journal with `questionId` and `answerOutcome`

#### Scenario: Journal updates on first card draw
- **WHEN** any player draws a card whose educational payload has not yet been recorded in this game
- **THEN** that payload is appended to the Facts Journal

#### Scenario: Journal accessible during game
- **WHEN** a player opens the HUD's "Journal" control during any turn phase
- **THEN** the journal view shows all recorded entries grouped by category (Industries, Inventions, Edicts, Transport) in chronological order, with quiz entries marked by their outcome

### Requirement: End-of-game recap
When the game ends, the summary screen SHALL present a recap of every entry in the Facts Journal AND each player's quiz stats (`correct`, `wrong`, `hintsBought`, `cashSpentOnHints`), so players leave with a consolidated view of what they learned and how they performed.

#### Scenario: Recap on win
- **WHEN** the `game-over` state is entered
- **THEN** the summary screen renders the full Facts Journal grouped by category and, for every player (including bankrupts), their final quiz stats
