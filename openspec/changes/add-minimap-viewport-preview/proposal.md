## Why

When the active player's token moves, the main camera doesn't follow it, so the player may need to pan/zoom the 3D board to confirm where they landed — especially when the destination is outside the current viewport. This breaks the flow between rolling dice and resolving the tile, and is particularly painful on smaller screens where the 40-tile loop rarely fits entirely on screen.

## What Changes

- Add a small minimap/viewport-preview panel fixed to the bottom-left of the HUD that schematically renders the full 40-tile board loop at a glance.
- Highlight the active player's current tile (post-move) on the minimap with a marker matching their color, so the player immediately sees where they stopped without panning the 3D view.
- Render all player tokens on the minimap as small colored dots so relative positions stay readable.
- Update the highlight/dots reactively whenever player positions or the active player change.
- Pan the 3D camera to the landing tile when the minimap marker updates (or when the user clicks the minimap), so a quick glance is enough to see the tile in detail.

## Capabilities

### New Capabilities
- `minimap-viewport`: a HUD overlay that displays a schematic top-down view of the board loop, marks tile positions for all tokens, emphasises the active player's landing tile, and provides a click-to-recenter affordance for the 3D camera.

### Modified Capabilities
<!-- No existing spec-level behaviour is changing; only new UI is being introduced. -->

## Impact

- New UI component under `src/ui/` (e.g. `Minimap.tsx`) wired into `src/ui/Hud.tsx` at the bottom-left, coexisting with the existing bottom control bar.
- Reads from `useGameStore` (player positions, active player) and reuses `PLAYER_COLORS` / sector palette from `src/ui/theme.ts` for visual consistency.
- Reuses the existing camera reset affordance in `src/state/uiStore.ts` (or introduces a focused variant) to pan/center the 3D camera on a specific tile when requested.
- No changes to the game engine, reducer, persistence, or existing spec behaviour.
- Bundle impact: a single small React/SVG component; no new dependencies.
