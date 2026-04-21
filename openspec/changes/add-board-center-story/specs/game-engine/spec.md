## ADDED Requirements

### Requirement: GameState carries currentStoryId and lastResolvedTileId
The engine `GameState` SHALL include `currentStoryId: string | null` and `lastResolvedTileId: TileId | null`. `createInitialState` MUST seed `currentStoryId` to a deterministic story drawn from the RNG and leave `lastResolvedTileId` as `null`.

#### Scenario: Initial state has a story
- **WHEN** `createInitialState(players, seed)` is called
- **THEN** the returned state has a non-null `currentStoryId` and a `lastResolvedTileId` of `null`

#### Scenario: Same seed picks the same initial story
- **WHEN** two games are created from the same seed
- **THEN** their initial `currentStoryId` values are equal

### Requirement: Landing on a quiz-eligible tile updates lastResolvedTileId
When the engine begins the quiz phase for a landed tile, it SHALL set `lastResolvedTileId` to that tile's id so the next story rotation can exclude it.

#### Scenario: Quiz start records the resolved tile
- **WHEN** `RESOLVE_MOVEMENT` finishes with the player on a gameplay tile and the engine transitions to `awaiting-quiz-answer`
- **THEN** `lastResolvedTileId` equals that tile's id

### Requirement: END_TURN rotates currentStoryId deterministically
A successful `END_TURN` (one that advances the active player or grants a same-player re-roll on doubles) SHALL pick a new `currentStoryId` via a pure RNG step that excludes the just-resolved tile, the open quiz tile (if any), and the previous `currentStoryId`. A rejected `END_TURN` MUST NOT change `currentStoryId` or `rngState`.

#### Scenario: Successful END_TURN rotates and advances RNG
- **WHEN** `END_TURN` is accepted in `awaiting-end-turn` with `pendingLandingResolved`
- **THEN** `currentStoryId` differs from its prior value AND `rngState` advances

#### Scenario: Rejected END_TURN is a no-op
- **WHEN** `END_TURN` is dispatched in a phase where it is rejected (e.g. `awaiting-quiz-answer`)
- **THEN** the returned state is the same reference (`prev === next`)

### Requirement: Story rotation respects exclusions
The story chosen on rotation MUST satisfy: `id !== prevCurrentStoryId` AND `sourceRefId` does not equal the just-resolved tile's id (when present) AND does not equal `currentQuiz?.tileId` (when present). If exclusions empty the candidate set, the engine MAY pick any story.

#### Scenario: Just-quizzed tile is excluded
- **WHEN** the player just finished a turn whose landing was tile X, then dispatches `END_TURN`
- **THEN** the new `currentStoryId` is not the story whose `sourceRefId` is `tile:X` style id

### Requirement: Save format hydrates new fields without a schema bump
The save loader SHALL hydrate `currentStoryId` to `null` and `lastResolvedTileId` to `null` when loading a state that pre-dates this change. `schemaVersion` MUST remain at `2`.

#### Scenario: Old v2 save loads cleanly
- **WHEN** a persisted state with `schemaVersion === 2` and no `currentStoryId` field is loaded
- **THEN** the loader returns a `GameState` with `currentStoryId: null` and `lastResolvedTileId: null`, with no migration notice
