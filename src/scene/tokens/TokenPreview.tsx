import { Canvas } from '@react-three/fiber';
import { Token } from './tokenParts';
import type { TokenKind } from '@/engine/types';

interface TokenPreviewProps {
  kind: TokenKind;
  color?: string;
  size?: number;
}

// Small non-interactive 3D preview for the setup screen's token picker.
// `size` is the CSS pixel height; width follows its container.
export function TokenPreview({ kind, color = '#8a2a1b', size = 96 }: TokenPreviewProps) {
  return (
    <Canvas
      style={{ width: '100%', height: size, display: 'block' }}
      camera={{ position: [0.9, 1.1, 1.8], fov: 38 }}
      dpr={[1, 2]}
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
