import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { Token } from './tokenParts';
import type { TokenKind } from '@/engine/types';

interface TokenPreviewProps {
  kind: TokenKind;
  color?: string;
  size?: number;
}

const TOKEN_GLYPH: Record<TokenKind, string> = {
  locomotive: '🚂',
  'top-hat': '🎩',
  'cotton-bobbin': '🧶',
  pickaxe: '⛏️',
  'pocket-watch': '🕰️',
  'factory-chimney': '🏭',
};

// Small non-interactive 3D preview for the setup screen's token picker.
// `size` is the CSS pixel height; width follows its container.
//
// IMPORTANT: iOS Safari/Chrome cap simultaneous WebGL contexts at ~8. The
// setup screen renders 6 token previews × N players, easily breaching that
// cap and producing a `gl.getShaderPrecisionFormat returned null` crash that
// kills the whole React tree. On coarse-pointer devices (tablets, phones) we
// fall back to a static emoji glyph — keeps the picker usable without a
// per-preview WebGL context.
export function TokenPreview({ kind, color = '#8a2a1b', size = 96 }: TokenPreviewProps) {
  const isCoarsePointer = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(pointer: coarse)').matches === true,
    [],
  );

  if (isCoarsePointer) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.max(28, size * 0.55),
          color,
          background:
            'radial-gradient(circle at 50% 60%, rgba(0,0,0,0.06), transparent 70%)',
        }}
      >
        {TOKEN_GLYPH[kind] ?? '◆'}
      </div>
    );
  }

  return (
    <Canvas
      style={{ width: '100%', height: size, display: 'block' }}
      camera={{ position: [0.9, 1.1, 1.8], fov: 38 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#ffe6b0', '#2a1b0a', 0.4]} />
      <directionalLight position={[3, 5, 3]} intensity={0.9} />
      <group position={[0, -0.25, 0]}>
        <Token kind={kind} color={color} animate={false} scale={1.15} />
      </group>
    </Canvas>
  );
}
