// Industropoly visual theme. Parchment + inked-map aesthetic with sector colors.

export const colors = {
  parchment: '#e8d6a8',
  parchmentDeep: '#c9a96b',
  parchmentLight: '#f3e7c1',
  ink: '#3b2b18',
  inkSoft: '#5a4226',
  sepia: '#7a5a2f',
  accent: '#a0410d',
  accentSoft: '#c86a2d',
  danger: '#8a2a1b',
  shadow: 'rgba(59, 43, 24, 0.35)',
  highlight: '#fff7d6',
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
} as const;

// Board dimensions in scene units (meters). Tile count is fixed.
export const BOARD = {
  size: 20, // edge length of the whole board
  tileDepth: 0.2,
  tilesPerSide: 11, // includes shared corners
  totalTiles: 40,
} as const;
