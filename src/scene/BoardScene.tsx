import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Board } from './Board';
import { Tokens } from './tokens/Tokens';
import { Dice } from './Dice';
import { useUiStore } from '@/state/uiStore';
import { useMemo } from 'react';

export function BoardScene() {
  const quality = useUiStore((s) => s.shadowQuality);
  const { pixelRatio, shadowMapType } = useMemo(() => qualityPreset(quality), [quality]);

  return (
    <Canvas
      shadows
      dpr={pixelRatio}
      camera={{ position: [0, 22, 22], fov: 36, near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = shadowMapType;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      aria-hidden="true"
    >
      <color attach="background" args={['#1a120a']} />
      <fog attach="fog" args={['#1a120a', 40, 100]} />

      <hemisphereLight args={['#ffe6b0', '#2a1b0a', 0.35]} />
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.2}
        castShadow={quality !== 'low'}
        shadow-mapSize={quality === 'high' ? 2048 : 1024}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />

      <Board />
      <Tokens />
      <Dice />

      <OrbitControls
        enablePan={false}
        minDistance={14}
        maxDistance={42}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </Canvas>
  );
}

function qualityPreset(q: 'low' | 'medium' | 'high'): {
  pixelRatio: [number, number];
  shadowMapType: THREE.ShadowMapType;
} {
  if (q === 'low') return { pixelRatio: [1, 1], shadowMapType: THREE.BasicShadowMap };
  if (q === 'high') return { pixelRatio: [1, 2], shadowMapType: THREE.PCFSoftShadowMap };
  return { pixelRatio: [1, 1.5], shadowMapType: THREE.PCFShadowMap };
}
