## ADDED Requirements

### Requirement: Quiz prompt on tile landing
When the active player's movement resolves on a tile that has a gameplay rule (industry, transport, utility, tax, card-draw), the engine SHALL enter an `awaiting-quiz-answer` phase and surface a multiple-choice question tied to that tile's educational content. The tile's rule (buy offer, rent, tax charge, card draw) MUST NOT execute until the quiz is resolved.

#### Scenario: Quiz opens after movement resolves
- **WHEN** a player's token finishes moving onto an industry, transport, utility, tax, or card-draw tile
- **THEN** the engine transitions `turnPhase` from `moving` to `awaiting-quiz-answer` and sets `currentQuiz` to a selected question for that tile; no rent, buy offer, tax, or card draw is applied yet

#### Scenario: Corner tiles skip the quiz
- **WHEN** the player lands on a corner tile (`start`, `public-square`, or `prison` as a visitor) that has no gameplay rule to gate
- **THEN** the engine skips the `awaiting-quiz-answer` phase and transitions directly to `awaiting-end-turn`

#### Scenario: Go-to-prison applies before quiz
- **WHEN** the player lands on the `go-to-prison` corner
- **THEN** the prison movement consequence applies and the turn ends, regardless of quiz (no question is shown)

### Requirement: Multiple-choice question content
Each question SHALL have a prompt, 2 to 4 options, exactly one correct option, a citation source, and a reference to the tile it belongs to. Every tile with a gameplay rule MUST have at least one question authored; CI content lint MUST fail if a tile is missing a question or a question is missing a source.

#### Scenario: Author-defined question shape
- **WHEN** a question is loaded from content
- **THEN** it has: a non-empty prompt, between 2 and 4 options each with a stable id and non-empty text, a `correctOptionId` matching one of the option ids, and a non-empty source string

#### Scenario: Lint rejects missing content
- **WHEN** the content lint runs in CI and finds a tile with a gameplay rule but no associated question, or a question without a source
- **THEN** the lint exits non-zero and names the offending tile or question id

### Requirement: Deterministic question selection
Question selection SHALL be a pure function of the game's `rngState` and the landed `tileId`. Two runs from the same seed with the same action sequence MUST select the same question id on the same landing.

#### Scenario: Seeded replay selects the same question
- **WHEN** two games start from the same seed and apply the same action sequence
- **THEN** on every quiz-triggering landing they select identical question ids and advance the RNG identically

### Requirement: Correct answer unlocks the tile rule
When the player submits the correct option, the engine SHALL transition to `awaiting-land-action` and resolve the tile's normal rule (offer to buy, collect rent, charge tax, draw card, etc.), and SHALL increment the player's `quizStats.correct`.

#### Scenario: Correct answer on unowned industry
- **WHEN** the player answers correctly on an unowned industry tile
- **THEN** the engine transitions to `awaiting-land-action` and exposes a buy offer for that tile, and the player's `quizStats.correct` increases by 1

#### Scenario: Correct answer on rent-owed industry
- **WHEN** the player answers correctly on an industry owned by another non-bankrupt player at a non-mortgaged tile
- **THEN** rent is collected at the tier-appropriate amount, and `quizStats.correct` increases by 1

### Requirement: Wrong answer ends the turn
When the player submits an incorrect option, the engine SHALL skip the tile's rule entirely, transition to `awaiting-end-turn`, and increment the player's `quizStats.wrong`. No buy offer, rent, tax, card draw, or prison-entry-from-rule MUST occur.

#### Scenario: Wrong answer on unowned industry
- **WHEN** the player answers incorrectly on an unowned industry tile
- **THEN** no buy offer is shown, no cash changes hands, the engine transitions to `awaiting-end-turn`, and `quizStats.wrong` increases by 1

#### Scenario: Wrong answer on owned industry waives rent
- **WHEN** the player answers incorrectly on an industry owned by another player
- **THEN** the owner does not receive rent for that landing, the engine transitions to `awaiting-end-turn`, and `quizStats.wrong` increases by 1

#### Scenario: Wrong answer on card tile skips draw
- **WHEN** the player answers incorrectly on a card-draw tile
- **THEN** no card is drawn and the turn ends

#### Scenario: Wrong answer ends doubles streak
- **WHEN** the player rolled doubles and answers incorrectly on the landing
- **THEN** the turn ends and the player does NOT get an additional roll for that turn

### Requirement: Hint purchase during a quiz
While `turnPhase` is `awaiting-quiz-answer`, the engine SHALL accept a `BUY_HINT { hintId }` action that deducts the hint's `priceCash` from the active player's cash and records the hint as revealed on `currentQuiz.revealedHints`. Hints already revealed MUST NOT be purchasable a second time. The engine MUST reject the action if the player cannot afford the hint.

#### Scenario: Successful hint purchase
- **WHEN** the active player dispatches `BUY_HINT { hintId }` for a hint priced at P and has cash ≥ P, and that hint id is not yet in `revealedHints`
- **THEN** cash decreases by P, `revealedHints` gains that hint id, and `quizStats.hintsBought` increases by 1

#### Scenario: Insufficient cash rejects purchase
- **WHEN** the active player dispatches `BUY_HINT { hintId }` for a hint whose price exceeds their cash
- **THEN** state is unchanged and no hint is revealed

#### Scenario: Duplicate hint rejected
- **WHEN** a hint id is already in `revealedHints` and the player dispatches `BUY_HINT` for it again
- **THEN** state is unchanged and cash is not deducted a second time

### Requirement: Hint types
The engine SHALL support three hint kinds in v1: `eliminate-option` (content specifies which option id is eliminated), `clue-text` (content-authored extra context string), and `first-letter` (UI reveals the first character of the correct option's text). Eliminating an option MUST add that option's id to `currentQuiz.eliminatedOptionIds` so the UI can grey it out.

#### Scenario: Eliminate-option hint
- **WHEN** the player buys an `eliminate-option` hint whose payload references option id X
- **THEN** `eliminatedOptionIds` includes X, and the player may still submit any option (including X) but the UI treats X as visually eliminated

#### Scenario: Clue-text and first-letter hints
- **WHEN** the player buys a `clue-text` or `first-letter` hint
- **THEN** the hint id appears in `revealedHints` and the UI renders the authored payload (or derives the first letter of the correct option) alongside the question

### Requirement: Post-answer educational reveal
After any answer (correct or wrong) on a tile that has educational content, the engine SHALL attach the tile's `EducationalPayload` to the result so the UI can render a "Did you know?" panel alongside the outcome. The payload MUST be appended to the `factsJournal` exactly once per game per tile-question pair.

#### Scenario: Journal entry on first answer
- **WHEN** the player answers a question on a tile whose `(tileId, questionId)` pair has not yet been logged this game
- **THEN** a `factsJournal` entry is appended carrying the tile's educational payload, the question id, and `answerOutcome: 'correct' | 'wrong'`

#### Scenario: No duplicate journal entry
- **WHEN** the same `(tileId, questionId)` pair is answered again later in the same game
- **THEN** no duplicate `factsJournal` entry is appended

### Requirement: Per-player quiz stats
The engine SHALL track per-player counters: `correct`, `wrong`, `hintsBought`, and `cashSpentOnHints`. These counters MUST be exposed to the end-of-game recap.

#### Scenario: Recap includes quiz stats
- **WHEN** the game enters `game-over`
- **THEN** the recap surface exposes, for every non-bankrupt player and bankrupt player alike, their final `quizStats`
