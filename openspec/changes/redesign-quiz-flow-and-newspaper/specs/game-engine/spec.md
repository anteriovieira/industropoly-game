## MODIFIED Requirements

### Requirement: Quiz-gated turn phase
The engine SHALL gate movement (not landing) behind the quiz. The phase machine SHALL be: `awaiting-roll` → on `ROLL_DICE`, branch to `awaiting-quiz-answer` if the active player is currently on a tile that has at least one authored question, otherwise `moving`. From `awaiting-quiz-answer`: correct → `moving`; wrong → `awaiting-end-turn`. `RESOLVE_MOVEMENT` MUST NOT initiate the quiz; that responsibility moves to `ROLL_DICE`.

#### Scenario: Phase entered after roll on quiz-eligible current tile
- **WHEN** `ROLL_DICE` is dispatched while the active player's current tile has authored questions
- **THEN** `turnPhase` becomes `awaiting-quiz-answer` and `currentQuiz` is populated for the **current** tile (the player's `position` at the moment of the roll)

#### Scenario: Phase skipped after roll on a corner
- **WHEN** `ROLL_DICE` is dispatched while the active player is on a corner tile
- **THEN** `turnPhase` becomes `moving` directly and `currentQuiz` stays null

#### Scenario: Correct transitions to moving
- **WHEN** the player submits the correct option while `turnPhase === 'awaiting-quiz-answer'`
- **THEN** `turnPhase` transitions to `moving` and `currentQuiz` is cleared

#### Scenario: Wrong transitions to end turn with no movement
- **WHEN** the player submits an incorrect option while `turnPhase === 'awaiting-quiz-answer'`
- **THEN** `turnPhase` transitions to `awaiting-end-turn`, `currentQuiz` is cleared, `position` is unchanged, and `lastRoll` is null

### Requirement: Engine actions for quiz resolution
The reducer SHALL accept `ANSWER_QUESTION { optionId }` and `BUY_HINT { hintId }` actions only while `turnPhase === 'awaiting-quiz-answer'`; both MUST be rejected (no state change) in any other phase. `BUY_TILE`, `DECLINE_BUY`, `APPLY_CARD`, `DRAW_CARD`, `RESOLVE_MOVEMENT`, `RESOLVE_LANDING`, and `END_TURN` MUST be rejected while `turnPhase === 'awaiting-quiz-answer'`.

#### Scenario: Movement blocked during quiz
- **WHEN** `RESOLVE_MOVEMENT` is dispatched while `turnPhase === 'awaiting-quiz-answer'`
- **THEN** state is unchanged

#### Scenario: Buy blocked during quiz
- **WHEN** `BUY_TILE` is dispatched while `turnPhase === 'awaiting-quiz-answer'`
- **THEN** state is unchanged and no purchase occurs

### Requirement: Wrong answer overrides doubles re-roll
A wrong answer on the pre-move quiz SHALL end the turn even if the player rolled doubles. The engine MUST clear `lastRoll`, reset `doublesStreak` to 0, and ensure the next `END_TURN` rotates to the next non-bankrupt player without granting another roll to the current player.

#### Scenario: Doubles + wrong answer ends turn
- **WHEN** the active player rolled doubles on `ROLL_DICE`, then answered the resulting quiz incorrectly
- **THEN** `turnPhase` becomes `awaiting-end-turn`, `lastRoll` is null, `doublesStreak` is 0, and `END_TURN` rotates the active player

### Requirement: Movement no longer triggers a quiz
`RESOLVE_MOVEMENT` SHALL only advance the active player's token, award the pass-Start bonus when applicable, and route to `awaiting-land-action` (or end the turn early for the `go-to-prison` corner). It MUST NOT enter `awaiting-quiz-answer` and MUST NOT consume RNG for question selection. The post-landing flow (rent / buy offer / tax / card draw) at the landed tile is unchanged.

#### Scenario: Movement resolves directly to landing
- **WHEN** the active player passed the pre-move quiz and `RESOLVE_MOVEMENT` runs
- **THEN** the token advances by `lastRoll.total`, any pass-Start bonus is applied, and `turnPhase` becomes `awaiting-land-action` (or `awaiting-end-turn` for the `go-to-prison` corner)
