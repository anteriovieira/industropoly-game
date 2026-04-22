// Industropoly visual theme. Premium Victorian boardgame — stained oak, aged
// parchment, polished brass, and inked engravings. Every token has a CSS
// variable equivalent in global.css so runtime styles and static CSS stay in sync.

export const colors = {
  // Parchment tiers — light to burnt
  parchmentLight: '#f4e6bc',
  parchment: '#e8d2a0',
  parchmentDeep: '#caa560',
  parchmentBurnt: '#9d7a3b',

  // Ink tiers
  ink: '#2a1d10',
  inkSoft: '#4a331d',
  inkMuted: '#6b4c2c',

  // Wood tiers
  woodDark: '#2a1d10',
  woodMid: '#4a2e17',
  woodGrain: '#5c3d1f',

  // Brass tiers
  brass: '#c9943a',
  brassLight: '#e8c26a',
  brassDark: '#8a6422',
  brassShine: '#fae2a0',

  // Accents
  copper: '#8a4a1c',
  copperHot: '#b85d22',
  verdigris: '#3f5a48',
  danger: '#8a2a1b',
  highlight: '#fff7d6',

  // Sector & player colors legacy names preserved
  accent: '#b85d22',
  accentSoft: '#e28a3f',
  sepia: '#7a5a2f',
  shadow: 'rgba(26, 14, 6, 0.55)',
} as const;

export type SectorId =
  | 'textiles'
  | 'coal-iron'
  | 'shipyards'
  | 'chemicals'
  | 'railways-industries'
  | 'publishing'
  | 'banking'
  | 'empire';

// Muted, era-appropriate palette. Each sector is distinct enough under sepia lighting.
export const sectorPalette: Record<SectorId, { base: string; label: string }> = {
  textiles: { base: '#7f9db9', label: 'Têxteis' },
  'coal-iron': { base: '#2b2b2b', label: 'Carvão e Ferro' },
  shipyards: { base: '#1f3e52', label: 'Estaleiros' },
  chemicals: { base: '#6b8e4e', label: 'Química' },
  'railways-industries': { base: '#6a2d1f', label: 'Ferrovias' },
  publishing: { base: '#b88a3e', label: 'Imprensa' },
  banking: { base: '#1f5c3e', label: 'Bancos' },
  empire: { base: '#5a2a68', label: 'Finanças Imperiais' },
};

// Per-player accent colors, indexed by player order (0..3).
export const PLAYER_COLORS = ['#e5624a', '#5aa0c8', '#b174c7', '#a8cf68'] as const;

export const typography = {
  display: `'IM Fell English', 'Book Antiqua', Georgia, serif`,
  body: `'Inter', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif`,
  mono: `'IBM Plex Mono', ui-monospace, Menlo, monospace`,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 14,
  pill: 999,
} as const;

// Layered elevation shadows. Each is meant to stack: ambient + contact.
export const elevation = {
  none: 'none',
  // Subtle rest state for inline chips and input
  low: '0 1px 0 rgba(250, 226, 160, 0.25) inset, 0 1px 2px rgba(26, 14, 6, 0.25)',
  // Cards, panels at rest
  mid: '0 1px 0 rgba(250, 226, 160, 0.28) inset, 0 6px 16px rgba(10, 6, 2, 0.45), 0 1px 3px rgba(10, 6, 2, 0.35)',
  // Hover / floating
  high: '0 2px 0 rgba(250, 226, 160, 0.32) inset, 0 18px 40px rgba(10, 6, 2, 0.6), 0 6px 12px rgba(10, 6, 2, 0.4)',
  // Modal / hero CTA
  hero: '0 2px 0 rgba(250, 226, 160, 0.35) inset, 0 30px 70px rgba(10, 6, 2, 0.75), 0 10px 20px rgba(10, 6, 2, 0.45)',
  // Inner bevel for engraved look
  engraved: 'inset 0 1px 0 rgba(250, 226, 160, 0.35), inset 0 -1px 0 rgba(10, 6, 2, 0.35)',
} as const;

// Motion tokens. All micro-interactions should pull from here so timings feel consistent.
export const motion = {
  fast: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '220ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '360ms cubic-bezier(0.34, 1.56, 0.64, 1)', // subtle overshoot
} as const;

// Board dimensions in scene units (meters). Tile count is fixed.
export const BOARD = {
  size: 20, // edge length of the whole board
  tileDepth: 0.2,
  tilesPerSide: 11, // includes shared corners
  totalTiles: 40,
} as const;
