## ADDED Requirements

### Requirement: Framework-independent engine module
The core gameplay logic (turn state, dice, movement, ownership, rent, upgrades, bankruptcy, win condition) SHALL live in a pure TypeScript module with no imports from React, Three.js, or DOM APIs. The engine MUST be invokable from a Node test environment.

#### Scenario: Engine runs under Vitest without a DOM
- **WHEN** the engine module is imported by a Vitest test file that runs in Node (no `jsdom`)
- **THEN** all engine functions execute without throwing due to missing browser globals

### Requirement: Deterministic reducer-style state transitions
All engine state changes SHALL be expressed as a pure reducer `(state, action) => state` with no side effects. Given the same prior state and action (including any RNG seed carried in state), the output MUST be identical across runs.

#### Scenario: Replayability from a seed
- **WHEN** two runs start from the same initial state with the same seed and apply the same action sequence
- **THEN** both runs produce byte-identical resulting states

### Requirement: Turn order and dice
The engine SHALL manage 2–4 players in a fixed turn order set at game start. Each turn begins with a dice roll of two six-sided dice; rolling doubles grants an additional roll, and three consecutive doubles in the same turn sends the player to Debtors' Prison.

#### Scenario: Doubles grant another roll
- **WHEN** the active player rolls doubles and is not already on their third consecutive double
- **THEN** after resolving movement, the engine keeps the same active player and sets the turn state to `awaiting-roll`

#### Scenario: Three doubles to prison
- **WHEN** the active player rolls doubles for the third consecutive time in the same turn
- **THEN** the engine moves that player directly to Debtors' Prison without resolving the third roll's movement and ends their turn

### Requirement: Movement and pass-start bonus
On a non-jailed roll, the engine SHALL advance the active player's token forward by the sum of the two dice around the 40-tile loop. Each time the player passes or lands on the starting tile, they receive a fixed pass-start bonus (e.g., £200 in-game currency).

#### Scenario: Passing start awards bonus
- **WHEN** a player's movement crosses index 0 (starting tile) one or more times
- **THEN** their cash increases by the pass-start bonus exactly once per pass

### Requirement: Industry purchase and rent
When an active player lands on an unowned industry tile, the engine SHALL offer purchase at the tile's listed cost. When a player lands on an industry owned by another player, the engine MUST charge rent from the lander to the owner at the tier-appropriate amount defined in tile data.

#### Scenario: Purchase when unowned
- **WHEN** the active player lands on an unowned industry tile and has cash ≥ its cost and confirms purchase
- **THEN** ownership transfers to that player and their cash decreases by the tile's cost

#### Scenario: Rent paid to owner
- **WHEN** a player lands on an industry owned by another (non-bankrupt) player and the tile is not mortgaged
- **THEN** the lander's cash decreases and the owner's cash increases by the rent amount for the tile's current upgrade tier

### Requirement: Upgrade tiers
Each purchasable industry SHALL support up to 5 upgrade tiers (Workshop → Factory → Mill → Foundry → Empire) that progressively increase its rent. Upgrades MUST require the owner to control every tile in that sector and MUST be purchased at the tile's upgrade cost.

#### Scenario: Upgrade requires full sector
- **WHEN** an owner attempts to upgrade a tile while not owning every tile in its sector
- **THEN** the engine rejects the upgrade and leaves the tile's tier unchanged

#### Scenario: Upgrade increases rent
- **WHEN** a tile is upgraded from tier N to tier N+1
- **THEN** subsequent rent collections on that tile use the tier-N+1 amount

### Requirement: Debtors' Prison mechanics
The engine SHALL model a prison state equivalent to Monopoly's "Jail". A jailed player cannot collect rent movement bonuses; they escape by (a) rolling doubles on their turn, (b) paying a fixed fee, or (c) after three failed roll attempts being forced to pay the fee.

#### Scenario: Escape on doubles
- **WHEN** a jailed player rolls doubles on their turn
- **THEN** they leave prison and move forward by the rolled sum that turn, without an additional doubles roll

### Requirement: Bankruptcy and elimination
When a player cannot pay a debt (rent, tax, or card penalty) even after selling/mortgaging all assets, the engine SHALL mark them bankrupt and remove them from the turn order. Their owned tiles MUST become unowned (returned to the pool) for simplicity.

#### Scenario: Forced bankruptcy
- **WHEN** a player owes more than their total liquidatable worth
- **THEN** the engine marks them bankrupt, releases their tiles, and skips their seat in all future turn rotations

### Requirement: Win condition
The engine SHALL declare the last non-bankrupt player as the winner and transition the state to a terminal `game-over` status. No further actions MUST be accepted after `game-over`.

#### Scenario: Last player standing wins
- **WHEN** all but one player have been marked bankrupt
- **THEN** the engine sets status to `game-over`, records the surviving player as winner, and rejects any subsequent action with no state change
