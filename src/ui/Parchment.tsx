import type { CSSProperties, ReactNode } from 'react';

type ParchmentProps = {
  children: ReactNode;
  padding?: number | string;
  style?: CSSProperties;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
};

// Reusable parchment panel. Uses layered CSS gradients to approximate the aged-paper texture
// of the reference background without requiring an image asset. Readable over dark scenes.
export function Parchment({
  children,
  padding = 24,
  style,
  className,
  as: Tag = 'div',
}: ParchmentProps) {
  const merged: CSSProperties = {
    padding,
    borderRadius: 14,
    color: 'var(--ink)',
    background:
      'radial-gradient(ellipse at 30% 20%, #f6e7bf 0%, #e8d6a8 55%, #c9a96b 100%),' +
      'repeating-linear-gradient(45deg, rgba(121, 85, 42, 0.04) 0px, rgba(121, 85, 42, 0.04) 2px, transparent 2px, transparent 4px)',
    backgroundBlendMode: 'multiply',
    border: '1px solid rgba(59, 43, 24, 0.4)',
    boxShadow:
      'inset 0 0 60px rgba(121, 85, 42, 0.25),' +
      'inset 0 0 10px rgba(90, 66, 38, 0.45),' +
      '0 8px 30px rgba(0, 0, 0, 0.35)',
    position: 'relative',
    ...style,
  };
  return (
    <Tag className={className} style={merged}>
      {children}
    </Tag>
  );
}
