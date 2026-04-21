import { Canvas } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import * as THREE from 'three';
import { Board } from './Board';
import { Tokens } from './tokens/Tokens';
import { Dice } from './Dice';
import { useUiStore } from '@/state/uiStore';
import { anchorForTile } from './layout';
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
  const focusKey = useUiStore((s) => s.cameraFocusNonce);
  const focusTileId = useUiStore((s) => s.cameraFocusTileId);
  const diceDragging = useUiStore((s) => s.diceDragging);

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

  // Focus the camera on a specific tile when the focus nonce bumps (e.g. clicking the minimap).
  // Pan the target only — we preserve the user's current zoom level.
  useEffect(() => {
    if (focusKey === 0 || focusTileId == null) return;
    const c = controls.current;
    if (!c) return;
    const a = anchorForTile(focusTileId);
    const tx = clamp(a.x, -PAN_LIMIT, PAN_LIMIT);
    const tz = clamp(a.z, -PAN_LIMIT, PAN_LIMIT);
    // Shift the camera by the same delta so the framing (distance + angle) is preserved.
    const dx = tx - c.target.x;
    const dz = tz - c.target.z;
    c.target.set(tx, 0, tz);
    c.object.position.x += dx;
    c.object.position.z += dz;
    c.update();
  }, [focusKey, focusTileId]);

  // On touch devices (tablets, phones) Safari/Chrome can refuse the WebGL
  // context with `high-performance` powerPreference, leaving the canvas blank.
  // Detect coarse-pointer devices and degrade gracefully: drop the powerPref,
  // cap dpr lower, disable shadows entirely.
  const isCoarsePointer = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(pointer: coarse)').matches === true,
    [],
  );
  const effectivePixelRatio: [number, number] = isCoarsePointer ? [1, 1] : pixelRatio;
  const shadowsEnabled = !isCoarsePointer;

  return (
    <Canvas
      shadows={shadowsEnabled}
      dpr={effectivePixelRatio}
      camera={{ position: DEFAULT_CAMERA_POS, fov: 36, near: 0.1, far: 200 }}
      // On iOS Safari/Chrome, `highp` shader probing can fail. The webgl shim
      // installed at boot returns safe defaults if `getShaderPrecisionFormat`
      // is null; on touch devices we additionally request `mediump` so the
      // probe is skipped entirely.
      gl={{ antialias: true, precision: isCoarsePointer ? 'mediump' : 'highp' }}
      onCreated={({ gl }) => {
        if (shadowsEnabled) gl.shadowMap.type = shadowMapType;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        // If the WebGL context is lost (memory pressure on tablets), surface
        // it in the console so we can diagnose instead of staring at a black box.
        const canvas = gl.domElement;
        canvas.addEventListener('webglcontextlost', (e) => {
          // eslint-disable-next-line no-console
          console.error('WebGL context lost', e);
          e.preventDefault();
        });
      }}
      style={{ touchAction: 'none' }}
      aria-hidden="true"
    >
      <color attach="background" args={['#1a120a']} />
      <fog attach="fog" args={['#1a120a', 40, 100]} />

      <hemisphereLight args={['#ffe6b0', '#2a1b0a', 0.35]} />
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.2}
        castShadow={shadowsEnabled && quality !== 'low'}
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
        enabled={!diceDragging}
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


