import type { CSSProperties, ReactNode } from 'react';

type ParchmentTone = 'default' | 'light' | 'warm';
type ParchmentElevation = 'flat' | 'low' | 'mid' | 'high' | 'hero';

type ParchmentProps = {
  children: ReactNode;
  padding?: number | string;
  style?: CSSProperties;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
  tone?: ParchmentTone;
  elevation?: ParchmentElevation;
  /** Wrap with a polished brass bezel. */
  framed?: boolean;
};

// Layered parchment gradients per tone. Radial highlight at top-left + 45° fiber
// pattern multiplied in gives the aged-paper feel without requiring an asset.
const TONE_BG: Record<ParchmentTone, string> = {
  default:
    'radial-gradient(ellipse at 30% 20%, #f6e7bf 0%, #e8d2a0 55%, #caa560 100%),' +
    'repeating-linear-gradient(45deg, rgba(121, 85, 42, 0.05) 0px, rgba(121, 85, 42, 0.05) 2px, transparent 2px, transparent 4px)',
  light:
    'radial-gradient(ellipse at 30% 20%, #fbf2d2 0%, #f0e0b0 55%, #d8b878 100%),' +
    'repeating-linear-gradient(45deg, rgba(121, 85, 42, 0.04) 0px, rgba(121, 85, 42, 0.04) 2px, transparent 2px, transparent 4px)',
  warm:
    'radial-gradient(ellipse at 30% 20%, #e8cf8a 0%, #caa560 55%, #9d7a3b 100%),' +
    'repeating-linear-gradient(45deg, rgba(60, 35, 15, 0.08) 0px, rgba(60, 35, 15, 0.08) 2px, transparent 2px, transparent 4px)',
};

const ELEVATION_SHADOW: Record<ParchmentElevation, string> = {
  flat: 'inset 0 1px 0 rgba(255, 247, 214, 0.4), inset 0 -1px 0 rgba(26, 14, 6, 0.15), inset 0 0 40px rgba(121, 85, 42, 0.18)',
  low:
    'inset 0 1px 0 rgba(255, 247, 214, 0.45), inset 0 -1px 0 rgba(26, 14, 6, 0.2), inset 0 0 50px rgba(121, 85, 42, 0.22),' +
    '0 2px 8px rgba(10, 6, 2, 0.35)',
  mid:
    'inset 0 1px 0 rgba(255, 247, 214, 0.5), inset 0 -1px 0 rgba(26, 14, 6, 0.25), inset 0 0 60px rgba(121, 85, 42, 0.25),' +
    '0 6px 18px rgba(10, 6, 2, 0.5), 0 1px 3px rgba(10, 6, 2, 0.35)',
  high:
    'inset 0 1px 0 rgba(255, 247, 214, 0.55), inset 0 -1px 0 rgba(26, 14, 6, 0.28), inset 0 0 60px rgba(121, 85, 42, 0.25),' +
    '0 18px 42px rgba(10, 6, 2, 0.6), 0 6px 14px rgba(10, 6, 2, 0.4)',
  hero:
    'inset 0 2px 0 rgba(255, 247, 214, 0.6), inset 0 -2px 0 rgba(26, 14, 6, 0.3), inset 0 0 80px rgba(121, 85, 42, 0.3),' +
    '0 30px 70px rgba(10, 6, 2, 0.7), 0 10px 20px rgba(10, 6, 2, 0.5)',
};

// Reusable parchment panel. Layered CSS gradients approximate aged paper without
// requiring an image asset. `framed` adds a polished brass bezel for hero cards.
export function Parchment({
  children,
  padding = 24,
  style,
  className,
  as: Tag = 'div',
  tone = 'default',
  elevation = 'mid',
  framed = false,
}: ParchmentProps) {
  const innerRadius = framed ? 11 : 14;
  const inner: CSSProperties = {
    padding,
    borderRadius: innerRadius,
    color: 'var(--ink)',
    background: TONE_BG[tone],
    backgroundBlendMode: 'multiply',
    border: framed ? 'none' : '1px solid rgba(26, 14, 6, 0.45)',
    boxShadow: ELEVATION_SHADOW[elevation],
    position: 'relative',
    ...(framed ? {} : style),
  };

  if (!framed) {
    return (
      <Tag className={className} style={inner}>
        {children}
      </Tag>
    );
  }

  // Brass bezel wrapper: a 3px gradient ring with its own shadow, containing the
  // parchment panel. Author-supplied `style` goes on the outer frame so layout
  // (position/width) works as expected.
  const frame: CSSProperties = {
    borderRadius: 14,
    padding: 3,
    background:
      'linear-gradient(135deg, #8a6422 0%, #e8c26a 28%, #c9943a 52%, #8a6422 78%, #c9943a 100%)',
    boxShadow:
      'inset 0 1px 0 rgba(250, 226, 160, 0.55), inset 0 -1px 0 rgba(26, 14, 6, 0.55),' +
      '0 10px 28px rgba(10, 6, 2, 0.55), 0 1px 3px rgba(10, 6, 2, 0.35)',
    ...style,
  };

  return (
    <Tag className={className} style={frame}>
      <div style={inner}>{children}</div>
    </Tag>
  );
}
