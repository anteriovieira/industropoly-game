import { describe, expect, it } from 'vitest';
import { toMinimapPoint } from '@/scene/layout';

const SIZE = 100;
const EPS = 0.001;

describe('toMinimapPoint', () => {
  // Corners sit one half-tile in from the outer edge. With BOARD.size=20 and tilesPerSide=11,
  // step = 20/11 and the corner centre is at half - step/2 ≈ 9.091 in world units.
  // Scaled to viewBoxSize=100, that maps to ~50 + 45.45 = 95.45 on the "outer" axis.
  const OUTER = (SIZE / 20) * (20 / 2 - 20 / 11 / 2);
  const CENTRE = SIZE / 2;

  it('places the Start (tile 0) at bottom-right', () => {
    const p = toMinimapPoint(0, SIZE);
    expect(p.x).toBeCloseTo(CENTRE + OUTER, 3);
    expect(p.y).toBeCloseTo(CENTRE + OUTER, 3);
  });

  it('places Debtors Prison (tile 10) at bottom-left', () => {
    const p = toMinimapPoint(10, SIZE);
    expect(p.x).toBeCloseTo(CENTRE - OUTER, 3);
    expect(p.y).toBeCloseTo(CENTRE + OUTER, 3);
  });

  it('places Public Square (tile 20) at top-left', () => {
    const p = toMinimapPoint(20, SIZE);
    expect(p.x).toBeCloseTo(CENTRE - OUTER, 3);
    expect(p.y).toBeCloseTo(CENTRE - OUTER, 3);
  });

  it('places Go-To-Prison (tile 30) at top-right', () => {
    const p = toMinimapPoint(30, SIZE);
    expect(p.x).toBeCloseTo(CENTRE + OUTER, 3);
    expect(p.y).toBeCloseTo(CENTRE - OUTER, 3);
  });

  it('places a mid-bottom tile (tile 3) on the bottom edge, right of centre', () => {
    const p = toMinimapPoint(3, SIZE);
    expect(p.y).toBeCloseTo(CENTRE + OUTER, 3);
    expect(p.x).toBeGreaterThan(CENTRE);
    expect(p.x).toBeLessThan(CENTRE + OUTER);
  });

  it('honours the padding argument', () => {
    const pad = 10;
    const p0 = toMinimapPoint(0, SIZE);
    const pPad = toMinimapPoint(0, SIZE, pad);
    const usable = SIZE - pad * 2;
    expect(pPad.x).toBeCloseTo(pad + ((p0.x / SIZE) * usable), 3);
    expect(pPad.y).toBeCloseTo(pad + ((p0.y / SIZE) * usable), 3);
    expect(Math.abs(pPad.x - p0.x)).toBeGreaterThan(EPS);
  });
});
