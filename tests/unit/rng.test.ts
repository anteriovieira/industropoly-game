import { describe, expect, it } from 'vitest';
import { normalizeSeed, rollD6, shuffle, nextFloat } from '@/engine/rng';

describe('rng', () => {
  it('is deterministic for a given seed', () => {
    const s = normalizeSeed(42);
    const a = [];
    const b = [];
    let x = s;
    let y = s;
    for (let i = 0; i < 10; i++) {
      const r1 = rollD6(x);
      const r2 = rollD6(y);
      a.push(r1.face);
      b.push(r2.face);
      x = r1.state;
      y = r2.state;
    }
    expect(a).toEqual(b);
  });

  it('produces d6 faces in 1..6', () => {
    let s = normalizeSeed(123);
    for (let i = 0; i < 500; i++) {
      const r = rollD6(s);
      s = r.state;
      expect(r.face).toBeGreaterThanOrEqual(1);
      expect(r.face).toBeLessThanOrEqual(6);
    }
  });

  it('nextFloat is in [0, 1)', () => {
    let s = normalizeSeed(7);
    for (let i = 0; i < 100; i++) {
      const r = nextFloat(s);
      s = r.state;
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(1);
    }
  });

  it('shuffle produces a permutation', () => {
    const input = Array.from({ length: 20 }, (_, i) => i);
    const { out } = shuffle(input, normalizeSeed(1));
    expect(out.sort((a, b) => a - b)).toEqual(input);
  });

  it('shuffle is deterministic', () => {
    const input = Array.from({ length: 20 }, (_, i) => `x${i}`);
    const a = shuffle(input, normalizeSeed(5)).out;
    const b = shuffle(input, normalizeSeed(5)).out;
    expect(a).toEqual(b);
  });

  it('distribution is roughly uniform over many rolls', () => {
    let s = normalizeSeed(99);
    const counts = [0, 0, 0, 0, 0, 0];
    const N = 6000;
    for (let i = 0; i < N; i++) {
      const r = rollD6(s);
      s = r.state;
      counts[r.face - 1]! += 1;
    }
    // Each face should land within +/-20% of N/6.
    for (const c of counts) {
      expect(c).toBeGreaterThan((N / 6) * 0.8);
      expect(c).toBeLessThan((N / 6) * 1.2);
    }
  });
});
