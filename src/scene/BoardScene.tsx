import { Canvas } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import * as THREE from 'three';
import { Board } from './Board';
import { Tokens } from './tokens/Tokens';
import { Dice } from './Dice';
import { useUiStore } from '@/state/uiStore';
import { useEffect, useMemo, useRef } from 'react';
import type { MapControls as MapControlsImpl } from 'three-stdlib';

const DEFAULT_CAMERA_POS: [number, number, number] = [0, 22, 22];
// Clamp the pan target so the board stays roughly visible — the board is 20 units wide
// and centred at the origin, so allowing ±12 on each axis is plenty of headroom without
// letting the user strand the board off-screen.
const PAN_LIMIT = 12;

export function BoardScene() {
  const quality = useUiStore((s) => s.shadowQuality);
  const { pixelRatio, shadowMapType } = useMemo(() => qualityPreset(quality), [quality]);
  const controls = useRef<MapControlsImpl | null>(null);
  const resetKey = useUiStore((s) => s.cameraResetNonce);

  // Clamp the pan target on every change so the board never strays too far off-screen.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const onChange = (): void => {
      const t = c.target;
      t.x = clamp(t.x, -PAN_LIMIT, PAN_LIMIT);
      t.z = clamp(t.z, -PAN_LIMIT, PAN_LIMIT);
      t.y = 0;
    };
    c.addEventListener('change', onChange);
    return () => c.removeEventListener('change', onChange);
  }, []);

  // Recentre when the reset nonce bumps.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.target.set(0, 0, 0);
    c.object.position.set(...DEFAULT_CAMERA_POS);
    c.update();
  }, [resetKey]);

  return (
    <Canvas
      shadows
      dpr={pixelRatio}
      camera={{ position: DEFAULT_CAMERA_POS, fov: 36, near: 0.1, far: 200 }}
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

      {/* MapControls: left-click drag = pan, right-click drag = rotate, wheel = zoom.
          `zoomToCursor` makes wheel zoom move toward whatever is under the pointer —
          the expected behaviour for a map-style view.
          On touch: one finger pans, two fingers pinch-zoom and rotate. */}
      <MapControls
        ref={controls}
        enableDamping
        dampingFactor={0.12}
        screenSpacePanning={false}
        zoomToCursor
        panSpeed={1.0}
        zoomSpeed={0.9}
        rotateSpeed={0.7}
        minDistance={14}
        maxDistance={42}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </Canvas>
  );
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function qualityPreset(q: 'low' | 'medium' | 'high'): {
  pixelRatio: [number, number];
  shadowMapType: THREE.ShadowMapType;
} {
  if (q === 'low') return { pixelRatio: [1, 1], shadowMapType: THREE.BasicShadowMap };
  if (q === 'high') return { pixelRatio: [1, 2], shadowMapType: THREE.PCFSoftShadowMap };
  return { pixelRatio: [1, 1.5], shadowMapType: THREE.PCFShadowMap };
}
