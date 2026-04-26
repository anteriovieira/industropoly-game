// Shared animation timings so the scene and the phase-driver in GameScreen agree.
// All values are in milliseconds.

export const DICE_TUMBLE_MS = 1000; // dice roll → visible tumble duration (matches Dice.tsx)
export const DICE_SETTLE_BUFFER_MS = 100; // tiny extra wait before resolving movement
export const HOP_DURATION_MS = 220; // per-tile token hop (matches Tokens.tsx)
export const LANDING_SETTLE_MS = 350; // pause after the token arrives before showing the modal

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
