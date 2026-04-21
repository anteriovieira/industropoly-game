// Pure geometry helpers for the 40-tile square board. No Three.js imports — Node-safe.
//
// Tile indexing goes clockwise from the "Start" corner at the bottom-right when viewed
// from the default camera angle. Indices 0..39:
//   0    — bottom-right corner (Start)
//   1..9 — bottom edge, right→left
//  10    — bottom-left corner (Debtors' Prison)
//  11..19— left edge, bottom→top
//  20    — top-left corner (Public Square)
//  21..29— top edge, left→right
//  30    — top-right corner (Go-To-Prison)
//  31..39— right edge, top→bottom

import { BOARD } from '@/ui/theme';

export interface TileAnchor {
  x: number;
  z: number;
  rotationY: number; // radians; face points inward
  edge: 'bottom' | 'left' | 'top' | 'right' | 'corner';
  isCorner: boolean;
}

const half = BOARD.size / 2;
// side length excluding corners = 9 tiles; corner spans its own width at the end.
// Tile width along the edge = BOARD.size / 11 (tilesPerSide includes shared corners).
const step = BOARD.size / BOARD.tilesPerSide;

export function anchorForTile(id: number): TileAnchor {
  if (id < 0 || id >= 40 || !Number.isInteger(id)) {
    throw new Error(`Bad tile id: ${id}`);
  }
  // Corners:
  if (id === 0) return corner(half - step / 2, half - step / 2, 'corner');
  if (id === 10) return corner(-half + step / 2, half - step / 2, 'corner');
  if (id === 20) return corner(-half + step / 2, -half + step / 2, 'corner');
  if (id === 30) return corner(half - step / 2, -half + step / 2, 'corner');

  if (id >= 1 && id <= 9) {
    // Bottom edge, moving from Start leftward.
    const k = id; // 1..9
    const x = half - step / 2 - step * k;
    const z = half - step / 2;
    return { x, z, rotationY: 0, edge: 'bottom', isCorner: false };
  }
  if (id >= 11 && id <= 19) {
    // Left edge, moving upward.
    const k = id - 10; // 1..9
    const x = -half + step / 2;
    const z = half - step / 2 - step * k;
    return { x, z, rotationY: Math.PI / 2, edge: 'left', isCorner: false };
  }
  if (id >= 21 && id <= 29) {
    // Top edge, moving rightward.
    const k = id - 20; // 1..9
    const x = -half + step / 2 + step * k;
    const z = -half + step / 2;
    return { x, z, rotationY: Math.PI, edge: 'top', isCorner: false };
  }
  // id 31..39 right edge, moving downward.
  const k = id - 30; // 1..9
  const x = half - step / 2;
  const z = -half + step / 2 + step * k;
  return { x, z, rotationY: -Math.PI / 2, edge: 'right', isCorner: false };
}

function corner(x: number, z: number, _tag: 'corner'): TileAnchor {
  return { x, z, rotationY: 0, edge: 'corner', isCorner: true };
}

// Up to 4 slot offsets within a tile so multiple tokens remain visible.
export function tokenSlot(anchor: TileAnchor, slotIndex: number): { x: number; z: number } {
  const inset = step * 0.18;
  const offsets: Array<[number, number]> = [
    [-inset, -inset],
    [inset, -inset],
    [-inset, inset],
    [inset, inset],
  ];
  const [ox, oz] = offsets[slotIndex % 4]!;
  return { x: anchor.x + ox, z: anchor.z + oz };
}

export function tileSize(): { w: number; d: number; h: number } {
  return { w: step * 0.95, d: step * 0.95, h: BOARD.tileDepth };
}

export function boardStep(): number {
  return step;
}

// Projects a tile's world [x, z] into SVG viewBox coordinates for the minimap.
// World origin is the board centre; SVG origin is the top-left, with y increasing downward.
// The board spans [-half, +half] in world X and Z; we map to [0, viewBoxSize] with a small padding.
export function toMinimapPoint(
  tileId: number,
  viewBoxSize: number,
  padding = 0,
): { x: number; y: number } {
  const a = anchorForTile(tileId);
  const usable = viewBoxSize - padding * 2;
  const scale = usable / BOARD.size;
  const x = padding + (a.x + half) * scale;
  // World z increases "toward the camera" (forward); on the minimap we want the bottom-row
  // tiles (positive z) to appear at the bottom, so y grows with z.
  const y = padding + (a.z + half) * scale;
  return { x, y };
}
