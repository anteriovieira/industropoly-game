## MODIFIED Requirements

### Requirement: GameState carries currentStoryId and lastResolvedTileId
The engine `GameState` SHALL include `currentNewspaper: Newspaper | null` (replacing the previous `currentStoryId`) and `lastResolvedTileId: TileId | null`. `createInitialState` MUST seed `currentNewspaper` with `issueNumber: 1` and 3 deterministically-picked `headlineIds` drawn from the RNG, and MUST leave `lastResolvedTileId` as `null`.

The `Newspaper` type SHALL be:
```ts
interface Newspaper {
  issueNumber: number;
  headlineIds: string[]; // currently exactly 3, pairwise distinct
}
```

#### Scenario: Initial state has a first issue
- **WHEN** `createInitialState(players, seed)` is called
- **THEN** the returned state has `currentNewspaper.issueNumber === 1` and `currentNewspaper.headlineIds.length === 3` with pairwise-distinct ids, and `lastResolvedTileId === null`

#### Scenario: Same seed picks the same first issue
- **WHEN** two games are created from the same seed
- **THEN** their initial `currentNewspaper.headlineIds` arrays are equal

### Requirement: END_TURN rotates currentStoryId deterministically
A successful `END_TURN` (one that advances the active player or grants a same-player re-roll on doubles) SHALL pick a new 3-headline issue via a pure RNG step that avoids the previous issue's `headlineIds`. It MUST increment `issueNumber` and advance `rngState`. A rejected `END_TURN` MUST NOT change `currentNewspaper` or `rngState`.

The selection MUST NOT consult `currentQuiz.tileId` or `lastResolvedTileId` — ambient overlap with the quiz corpus is intentional.

#### Scenario: Successful END_TURN rotates and advances RNG
- **WHEN** `END_TURN` is accepted in `awaiting-end-turn` with `pendingLandingResolved`
- **THEN** `currentNewspaper.issueNumber` increases by 1, `currentNewspaper.headlineIds` differs from the prior array, and `rngState` advances

#### Scenario: Rejected END_TURN is a no-op
- **WHEN** `END_TURN` is dispatched in a phase where it is rejected (e.g. `awaiting-quiz-answer`)
- **THEN** the returned state is the same reference (`prev === next`) and `currentNewspaper` is unchanged

#### Scenario: Quiz-related exclusions are NOT applied
- **WHEN** rotation runs with a non-null `currentQuiz` (tile X) and/or a non-null `lastResolvedTileId` (tile Y)
- **THEN** the next issue's `headlineIds` MAY include `tile:X` and `tile:Y`

### Requirement: Save format hydrates new fields without a schema bump
The save loader SHALL hydrate `currentNewspaper` to `null` when loading a state that pre-dates this change. It MUST also hydrate `lastResolvedTileId` to `null`. Any legacy `currentStoryId` field on the loaded JSON MUST be ignored. `schemaVersion` MUST remain at `2`.

#### Scenario: Old v2 save loads cleanly
- **WHEN** a persisted state with `schemaVersion === 2` and no `currentNewspaper` field is loaded
- **THEN** the loader returns a `GameState` with `currentNewspaper: null` and `lastResolvedTileId: null`, no migration notice is surfaced

#### Scenario: Legacy currentStoryId ignored
- **WHEN** a persisted state carries a `currentStoryId` string (from before this change) but no `currentNewspaper`
- **THEN** the loader produces a state with `currentNewspaper: null` and does NOT surface the stale `currentStoryId` anywhere in the returned object
