// Mulberry32 — a small, fast, seedable PRNG with excellent distribution for games.
// We store the current 32-bit state inline in GameState so the reducer remains pure.

export function nextUint32(state: number): { state: number; value: number } {
  let s = (state + 0x6d2b79f5) | 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = (t ^ (t >>> 14)) >>> 0;
  return { state: s >>> 0, value };
}

export function nextFloat(state: number): { state: number; value: number } {
  const r = nextUint32(state);
  return { state: r.state, value: r.value / 0x1_0000_0000 };
}

// Roll a d6 using the given state. Returns the new state and face 1..6.
export function rollD6(state: number): { state: number; face: number } {
  const r = nextFloat(state);
  return { state: r.state, face: 1 + Math.floor(r.value * 6) };
}

// Fisher–Yates shuffle using the PRNG. Pure: returns a new array and the advanced state.
export function shuffle<T>(input: readonly T[], state: number): { state: number; out: T[] } {
  const out = input.slice();
  let s = state;
  for (let i = out.length - 1; i > 0; i--) {
    const r = nextFloat(s);
    s = r.state;
    const j = Math.floor(r.value * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return { state: s, out };
}

// Seed normalization: any 32-bit unsigned integer.
export function normalizeSeed(seed: number): number {
  return (seed >>> 0) || 0x9e3779b1;
}
