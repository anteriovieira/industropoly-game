## 1. Projection utility

- [x] 1.1 Add a `toMinimapPoint(tileId, viewBoxSize)` helper (colocate with or next to `src/scene/layout.ts`) that maps a tile's world `[x, z]` into SVG viewBox coordinates, so the minimap reuses the 3D layout as source of truth.
- [x] 1.2 Add a unit test covering the four corner tiles and one mid-side tile to lock in the projection (extend `tests/unit/` with a small `minimap.test.ts`).

## 2. Camera focus plumbing

- [x] 2.1 Extend `src/state/uiStore.ts` with `cameraFocusTileId: number | null` and `cameraFocusNonce: number` (plus a `focusCameraOnTile(tileId)` action that sets the id and bumps the nonce).
- [x] 2.2 In `src/scene/BoardScene.tsx`, subscribe to `cameraFocusNonce` and pan `controls.current.target` to the focused tile's `[x, 0, z]`, respecting the existing `PAN_LIMIT` clamp (no zoom change).
- [x] 2.3 Make sure `resetCamera` and `focusCameraOnTile` don't fight: the latest action wins on any given frame.

## 3. Minimap component

- [x] 3.1 Create `src/ui/Minimap.tsx` that reads `state.players` and `activePlayer` from `useGameStore` and renders a 140×140 inline SVG.
- [x] 3.2 Render 40 tile markers using the projection helper; keep them monochrome/parchment-toned for v1.
- [x] 3.3 Render one colored dot per non-bankrupt player at their current tile, using `PLAYER_COLORS` from `src/ui/theme.ts`; when multiple players share a tile, offset their dots angularly around the tile centre.
- [x] 3.4 Draw a pulsing ring around the active player's current tile using the active player's color (ring size + pulse so emphasis is not color-only).
- [x] 3.5 Wrap the SVG in a `<button>` with an aria-label ("Centralizar câmera na casa atual"); on click/Enter/Space, call `focusCameraOnTile(activePlayer.position)` and `audio.play('click')`.

## 4. HUD integration

- [x] 4.1 Import and mount `<Minimap />` inside `src/ui/Hud.tsx`, positioned `fixed`/`absolute` bottom-left, above the existing bottom control bar.
- [x] 4.2 Ensure the surrounding HUD container keeps `pointerEvents: 'none'` while the minimap itself re-enables `pointerEvents: 'auto'`, so it doesn't block clicks on the 3D board outside its footprint.
- [x] 4.3 Hide the minimap at narrow viewport widths (e.g. `@media (max-width: 480px)`) rather than shrinking it below legibility.

## 5. Verification

- [ ] 5.1 Run the dev server and verify: token dots track movement; active player's tile is highlighted after landing; clicking the minimap pans the 3D camera to the active player's tile; dots for players on the same tile remain distinguishable.
- [ ] 5.2 Verify keyboard operability: tab to the minimap, press Enter/Space, and confirm the camera focuses.
- [ ] 5.3 Verify a bankrupt player's dot disappears from the minimap (simulate via test game or bankruptcy action).
- [ ] 5.4 Run `npm run lint` and `npm test` and fix any issues the new files introduce.
