## ADDED Requirements

### Requirement: Quiz-gated turn phase
The engine SHALL add an `awaiting-quiz-answer` turn phase that sits between `moving` and `awaiting-land-action`. Any tile landing that has a gameplay rule MUST pass through this phase; the phase MUST end in exactly one of two transitions: to `awaiting-land-action` on a correct answer, or to `awaiting-end-turn` on a wrong answer.

#### Scenario: Phase entered after movement
- **WHEN** movement resolves onto a tile that has a gameplay rule
- **THEN** `turnPhase` becomes `awaiting-quiz-answer` and `currentQuiz` is populated with the selected question

#### Scenario: Correct transitions to land action
- **WHEN** the player submits the correct option while `turnPhase === 'awaiting-quiz-answer'`
- **THEN** `turnPhase` transitions to `awaiting-land-action` and `currentQuiz` is cleared

#### Scenario: Wrong transitions to end turn
- **WHEN** the player submits an incorrect option while `turnPhase === 'awaiting-quiz-answer'`
- **THEN** `turnPhase` transitions to `awaiting-end-turn`, `currentQuiz` is cleared, and no tile-rule side effects are applied for this landing

### Requirement: Engine actions for quiz resolution
The reducer SHALL accept `ANSWER_QUESTION { optionId }` and `BUY_HINT { hintId }` actions only while `turnPhase === 'awaiting-quiz-answer'`; both actions MUST be rejected (no state change) in any other phase. Non-quiz actions that depend on tile-rule phases (e.g., `BUY_TILE`, `APPLY_CARD`) MUST also be rejected while `turnPhase === 'awaiting-quiz-answer'`.

#### Scenario: Answer accepted only in quiz phase
- **WHEN** `ANSWER_QUESTION` is dispatched while `turnPhase !== 'awaiting-quiz-answer'`
- **THEN** state is unchanged

#### Scenario: Buy blocked during quiz
- **WHEN** `BUY_TILE` is dispatched while `turnPhase === 'awaiting-quiz-answer'`
- **THEN** state is unchanged and no purchase occurs

### Requirement: Wrong answer overrides doubles re-roll
Even if the player rolled doubles on the current turn, a wrong answer on the landing quiz SHALL end the turn. The engine MUST NOT grant another roll after a wrong answer.

#### Scenario: Doubles + wrong answer ends turn
- **WHEN** the active player rolled doubles, is not being sent to prison by streak, and answers the landing quiz incorrectly
- **THEN** `turnPhase` becomes `awaiting-end-turn` and, on `END_TURN`, the turn passes to the next player without another roll

### Requirement: Save schema bump for quiz state
The engine's persisted `schemaVersion` SHALL be bumped from 1 to 2 to reflect the addition of `currentQuiz`, per-player `quizStats`, and the new phase. On load, saves with `schemaVersion < 2` MUST be rejected; the loader MUST start a fresh game and surface a user-visible notice.

#### Scenario: Old save rejected
- **WHEN** a persisted state with `schemaVersion === 1` is loaded
- **THEN** the loader discards it, initializes a new game state at `schemaVersion === 2`, and signals "save format updated" to the UI
