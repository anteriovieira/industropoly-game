## MODIFIED Requirements

### Requirement: Quiz prompt on tile landing
When `ROLL_DICE` is dispatched and the active player is currently parked on a tile that has at least one authored question (industry / transport / utility / tax / card-draw — i.e. not a corner), the engine SHALL enter an `awaiting-quiz-answer` phase about the **current** tile and surface a multiple-choice question tied to that tile's educational content. Movement (`RESOLVE_MOVEMENT`) MUST NOT execute until the quiz is resolved correctly. Corner tiles, including everyone's first turn at the starting tile, SHALL skip the quiz and transition straight to `moving`.

#### Scenario: Quiz opens after roll on a current gameplay tile
- **WHEN** `ROLL_DICE` is dispatched while the active player's `position` references an industry/transport/utility/tax/card-draw tile that has at least one authored question
- **THEN** the engine transitions `turnPhase` from `awaiting-roll` to `awaiting-quiz-answer`, sets `currentQuiz` to a question for that tile, and does NOT advance the token

#### Scenario: Corner tiles skip the quiz on roll
- **WHEN** `ROLL_DICE` is dispatched while the active player is parked on a corner (`start`, `public-square`, `prison` as visitor)
- **THEN** the engine transitions directly to `moving` and `currentQuiz` remains null

#### Scenario: First turn skips the quiz for everyone
- **WHEN** any player rolls on their very first turn (everyone starts at tile 0, the `start` corner)
- **THEN** no quiz is shown and the token moves normally

### Requirement: Wrong answer ends the turn
When the active player submits an incorrect option to the current quiz, the engine SHALL skip movement entirely, leave the player's `position` unchanged, clear `lastRoll` so no movement animation triggers, transition to `awaiting-end-turn`, and increment the player's `quizStats.wrong`. No buy offer, rent, tax, card draw, or pass-Start bonus MUST occur this turn. The doubles streak MUST reset to 0.

#### Scenario: Wrong answer keeps the player parked
- **WHEN** the active player at tile T answers incorrectly
- **THEN** their `position` is still T, `lastRoll` is null, `turnPhase` is `awaiting-end-turn`, and `quizStats.wrong` increased by 1

#### Scenario: Wrong answer ends doubles streak
- **WHEN** the player rolled doubles and answers incorrectly on the pre-move quiz
- **THEN** the turn ends and the player does NOT get an additional roll for that turn, regardless of doubles

#### Scenario: Wrong answer applies no economic side-effects
- **WHEN** the player answers incorrectly with cash C
- **THEN** their cash remains exactly C and no other player's cash changes

### Requirement: Correct answer unlocks the tile rule
When the player submits the correct option, the engine SHALL transition to `moving` so the dice/movement pipeline runs as today (`RESOLVE_MOVEMENT` → `RESOLVE_LANDING` → buy offer / rent / card / tax / etc.), and SHALL increment the player's `quizStats.correct`. The post-answer "Lembrete" panel for the current (parked) tile is shown, then "Continuar" advances into `moving`.

#### Scenario: Correct answer triggers movement
- **WHEN** the active player on tile T answers correctly with `lastRoll.total = N`
- **THEN** `turnPhase` becomes `moving`, `currentQuiz` is cleared, the next auto-dispatch of `RESOLVE_MOVEMENT` advances the token by N tiles, and `quizStats.correct` increased by 1

#### Scenario: Correct then landing rule applies as today
- **WHEN** the player answers correctly and the resulting movement lands on an unowned industry tile
- **THEN** the buy offer modal opens at the landed tile, exactly as today's landing flow

### Requirement: Post-answer educational reveal
After any answer (correct or wrong), the engine SHALL attach the **current** tile's `EducationalPayload` to the result so the UI can render a panel labelled **"Lembrete"** (rather than "Você sabia?", since the player has already been on this tile). The Facts Journal MUST append exactly one entry per `(tileId, questionId)` pair per game, carrying the `answerOutcome`.

#### Scenario: Lembrete panel content
- **WHEN** the player has answered the pre-move quiz
- **THEN** the result panel renders the current tile's title, date, blurb, and source under the header "Lembrete"

#### Scenario: Journal entry on first answer
- **WHEN** the player answers a question on a tile whose `(tileId, questionId)` pair has not yet been logged this game
- **THEN** a `factsJournal` entry is appended with `questionId` and `answerOutcome`

#### Scenario: No duplicate journal entry
- **WHEN** the same `(tileId, questionId)` pair is answered again later in the same game (e.g. the player parked on the same tile via a wrong answer)
- **THEN** no duplicate `factsJournal` entry is appended
