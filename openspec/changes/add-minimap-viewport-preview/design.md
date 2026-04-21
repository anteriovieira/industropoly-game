## Context

The board is rendered in `src/scene/BoardScene.tsx` as a 3D `@react-three/fiber` canvas with `MapControls` (pan/zoom). The 40-tile loop is laid out horizontally in a square ring — its bounds are large enough that typical viewport/zoom combinations don't show every tile, so players frequently need to pan after a move to confirm their destination. Tile positions are already known at the data layer (see `src/scene/layout.ts`), and player positions are held in the game store (`useGameStore`, `state.players[n].position`).

Existing HUD overlays (`src/ui/Hud.tsx`) occupy the top row and a centered bottom bar. The bottom-left corner is free and, on landscape screens, unlikely to obscure tiles the player needs to inspect. A camera-reset mechanism already exists on `useUiStore` (`resetCamera` / `cameraResetNonce`).

## Goals / Non-Goals

**Goals:**
- Show the active player's landing tile at a glance without panning the 3D view.
- Keep the minimap compact (a small square in the bottom-left) and non-intrusive.
- Reuse existing theme/colors for player dots and sector hints so it feels native to the HUD.
- Make the minimap click-to-focus: tapping it pans the 3D camera to the active player's tile.
- Stay performant: re-renders must be cheap when token positions change during animation.

**Non-Goals:**
- No full-fidelity rendering of tiles (no 3D models, no labels, no ownership marks in this change).
- No interactive tile-selection from the minimap (no opening tile info by clicking a specific tile).
- No drag-to-pan / minimap-as-viewport-rectangle behaviour.
- No configuration UI for minimap size/position (fixed placement and size).
- No changes to the 3D scene, reducer, or persistence layer.

## Decisions

### Decision: Render the minimap with inline SVG (not canvas or a second R3F scene)
Forty tiles fit comfortably in a single SVG with rects + circles. SVG gives us crisp edges at any DPR, trivial hit-testing (`<button>` wrapper), and avoids spinning up a second WebGL context (mobile-sensitive per `BoardScene.tsx` comments). Alternatives: HTML/CSS grid (awkward for rotated ring layouts) and `<canvas>` (no accessibility, more boilerplate). SVG wins on simplicity.

### Decision: Derive minimap tile positions from a 2D projection of `layout.ts`
Reuse the same ring indexing used by the 3D board so the minimap mirrors the physical layout (corners at corners, side tiles in between). Project each tile's `[x, z]` world position into the minimap's viewBox via a single linear scale. Alternatives: hand-authoring a 2D ring — rejected, it duplicates the source of truth and will drift.

### Decision: Place the minimap fixed bottom-left, ~140×140px, above the bottom control bar
Bottom-left is empty today. 140px keeps 40 tiles legible (~3–4px per tile edge) without pushing into the central action bar. On narrow screens (< 480px) we hide it with a media query rather than shrinking further, because sub-100px minimaps are unreadable.

### Decision: Highlight the active player's current tile with a pulsing ring
When the turn's movement animation completes (`turnPhase` transitions to `awaiting-land-action`), the ring is drawn at the active player's position to draw the eye. Other players remain as plain dots. Alternatives: only highlight after landing resolution — rejected because the point is to see the *landing* immediately.

### Decision: Clicking the minimap pans the 3D camera to the active player's landing tile
Leverage `useUiStore` by adding a focused variant (`focusCameraOnTile(tileId)`) that `BoardScene.tsx` consumes analogously to `cameraResetNonce`. The camera target lerps/snaps to the tile's `[x, 0, z]` position, respecting the existing `PAN_LIMIT` clamp. Alternative: only recentre — rejected, that defeats the purpose on zoomed-in views.

### Decision: The minimap is presentational and reads directly from stores
No new engine events or actions; it subscribes to `useGameStore` for positions and `useUiStore` for focus. Keeps the reducer and persisted state unchanged and simplifies rollback.

## Risks / Trade-offs

- [Visual clutter with 4 overlapping tokens on the same tile] → Stack dots with a small angular offset around the tile centre; document the pattern in the component.
- [Minimap obscures the corner tile in the 3D view when panned to the extreme bottom-left] → Keep it within the existing HUD `pointerEvents: 'none'` wrapper with `pointerEvents: 'auto'` only on the minimap itself, and size it so the 3D canvas remains largely visible behind it.
- [Re-renders during the move animation could be costly if every 16ms frame triggers a full React tree update] → Select only `state.players` position slices and memoise tile-to-screen projection; SVG updates are cheap in practice.
- [Adding a second "camera focus" action to `uiStore` risks conflicting with `resetCamera`] → Treat focus and reset as separate intents; when focus fires, it overrides any pending reset for that frame, and neither mutates engine state.
- [Small tap target on touch devices] → Ensure the clickable surface is the full 140×140 button plus a small hit-slop, not just the dot.

## Migration Plan

- Pure additive UI feature; no data migration, no feature flag required.
- Rollback: delete the minimap component, its import in `Hud.tsx`, and the `focusCameraOnTile` helper in `uiStore`/`BoardScene`.

## Open Questions

- Should the minimap hint at tile ownership via sector color strips, or stay monochrome in this first iteration? Default: monochrome parchment tones for v1; sector colors can follow in a later change if playtesting shows demand.
- Should clicking on the minimap when the player is *not* moving still focus the camera on their current tile? Default: yes — same click action regardless of phase, for consistency.
