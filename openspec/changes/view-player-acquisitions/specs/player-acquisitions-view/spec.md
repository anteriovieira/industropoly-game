## ADDED Requirements

### Requirement: Acquisitions panel is HUD-accessible

The HUD SHALL expose an "Aquisições (A)" button alongside the existing "Diário (J)" and "Jornal (H)" buttons. Pressing the **A** key while in the `game` UI phase, or clicking the button, SHALL toggle a modal that displays player ownership. The keybinding MUST NOT fire while another modal is open or while a text input has focus, mirroring the existing journal/story shortcuts.

#### Scenario: Button opens the acquisitions modal

- **WHEN** the player clicks the "Aquisições (A)" button in the HUD
- **THEN** the acquisitions modal opens with the active player's portfolio shown by default

#### Scenario: A key opens the acquisitions modal

- **WHEN** the player presses `A` while in the `game` UI phase and no other modal is open
- **THEN** the acquisitions modal opens

#### Scenario: A key is suppressed when a modal is already open

- **WHEN** the player presses `A` while the Facts Journal, Newspaper modal, or any engine modal (`tile-info`, `card`, `rent`, `tax`, `prison`) is open
- **THEN** the acquisitions modal does NOT open

### Requirement: Modal lists owned tiles grouped by sector and category

For the selected player, the modal SHALL render three sections in order: **Indústrias** (grouped by sector), **Transportes**, and **Utilidades públicas**. Each industry sector group SHALL render a header showing the sector name, sector color swatch, an `owned/total` count of tiles in that sector, and — if the player owns every tile in the sector — a **"Monopólio"** badge. Sectors in which the selected player owns zero tiles MUST NOT render. Transports and utilities sections MUST NOT render when the selected player owns none.

#### Scenario: Industries grouped by sector

- **WHEN** the selected player owns 2 of 3 textile tiles and 1 of 2 banking tiles
- **THEN** the Indústrias section renders a Textiles group with 2 tile rows and a "2/3 tiles" count, and a Banking group with 1 tile row and a "1/2 tiles" count, in tile-id order within each group

#### Scenario: Monopoly badge

- **WHEN** the selected player owns every tile in a sector
- **THEN** that sector's group header renders a "Monopólio" badge

#### Scenario: Empty section is hidden

- **WHEN** the selected player owns no transport tiles
- **THEN** the Transportes section is not rendered at all (no empty header)

### Requirement: Per-tile row shows tier, mortgage, rent, and educational summary

Each owned-tile row SHALL display: tile name, sector swatch (industries) or category color (transports/utilities), educational title and date, tier label for industries (`Base`, `Oficina`, `Fábrica`, `Cooperativa`, `Estaleiro`, `Império` for tiers 0–5), a "Hipotecado" badge when the tile's `mortgaged` flag is true, and the current rent figure computed via the engine's `computeRent` selector. For utility tiles the rent figure SHALL use a representative `diceTotal` of 7 and the row SHALL include a caption noting "estimativa para soma dos dados = 7" along with the active multiplier (×4 or ×10).

#### Scenario: Industry tier label

- **WHEN** an owned industry tile has `tier = 3`
- **THEN** its row renders the label "Cooperativa"

#### Scenario: Mortgaged tile

- **WHEN** an owned tile has `mortgaged = true`
- **THEN** its row renders a "Hipotecado" badge and the rent figure shown is `0` (matching `computeRent` behavior for mortgaged tiles)

#### Scenario: Utility rent caption

- **WHEN** the selected player owns one utility tile
- **THEN** the row renders the rent computed at `diceTotal = 7`, includes the "×4" multiplier label, and shows the caption "estimativa para soma dos dados = 7"

#### Scenario: Monopoly base-rent doubling is reflected

- **WHEN** the selected player owns the entire sector and every tile in it has `tier = 0`
- **THEN** each tile row's rent figure reflects the `× 2` monopoly bonus (matching `computeRent`)

### Requirement: Portfolio summary header

The modal SHALL render a sticky summary header above the per-tile sections containing: the selected player's name, current cash, total tile count owned, total mortgage value still available (sum of `mortgage` for unmortgaged tiles only), and total current rent income (sum of `computeRent` across all owned tiles, with `diceTotal = 7` for utilities).

#### Scenario: Summary totals

- **WHEN** the selected player owns 4 unmortgaged industries with mortgage values [50, 60, 70, 80] and 1 mortgaged industry with mortgage value 90
- **THEN** the summary's "valor de hipoteca disponível" reads £260 (sum of unmortgaged mortgage values, excluding the already-mortgaged tile)

#### Scenario: Summary cash matches player state

- **WHEN** the selected player has cash = £450
- **THEN** the summary header renders "£450" for cash

### Requirement: Player switcher shows non-bankrupt players read-only

The modal SHALL display a tab strip with one tab per non-bankrupt player. The active player's tab SHALL be selected by default when the modal opens. Selecting a different tab SHALL switch the rendered portfolio to that player's holdings without dispatching any engine action. Bankrupt players MUST NOT appear in the tab strip. Non-self tabs SHALL render with a visual indicator (e.g. "👁") to make clear the view is read-only.

#### Scenario: Default selection is the active player

- **WHEN** the player opens the modal while it is `p2`'s turn
- **THEN** the `p2` tab is selected and the body shows `p2`'s holdings

#### Scenario: Switching tabs does not affect engine state

- **WHEN** the player clicks a different player's tab
- **THEN** no engine action is dispatched; the modal body re-renders to show that player's holdings; the active player in `GameState` is unchanged

#### Scenario: Bankrupt player excluded

- **WHEN** any player has `bankrupt = true`
- **THEN** that player's tab is not present in the strip

### Requirement: Empty state for players with no acquisitions

When the selected player owns zero tiles, the modal body SHALL render a single italic line: **"Nenhuma aquisição ainda — compre uma indústria, transporte ou utilidade pública para começar seu portfólio."** The summary header SHALL still render with `tileCount = 0`, `mortgageValueAvailable = £0`, and `rentIncome = £0`.

#### Scenario: Empty portfolio rendering

- **WHEN** the selected player owns no tiles
- **THEN** the body renders only the italic empty-state line, with no section headers; the summary header still renders with zeros

### Requirement: Modal is read-only and engine-inert

The acquisitions modal MUST NOT render mortgage, redeem, upgrade, sell, or trade controls in this capability. Opening or closing the modal MUST NOT dispatch any reducer action; only `acquisitionsOpen` in the UI store changes. The engine `GameState` MUST remain unchanged across modal open/close cycles.

#### Scenario: No engine actions on open or close

- **WHEN** the modal is opened, a tab is switched, and the modal is closed
- **THEN** no `Action` is dispatched to the game store and `GameState` is byte-identical before and after
