import { Canvas } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import * as THREE from 'three';
import { Board } from './Board';
import { Tokens } from './tokens/Tokens';
import { Dice } from './Dice';
import { useUiStore } from '@/state/uiStore';
import { anchorForTile } from './layout';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import { reportToLogBridge } from '@/lib/logBridge';

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
  const [contextLost, setContextLost] = useState(false);

  if (contextLost) return <ContextLostNotice />;

  return (
    <Canvas
      shadows={shadowsEnabled}
      dpr={effectivePixelRatio}
      camera={{ position: DEFAULT_CAMERA_POS, fov: 36, near: 0.1, far: 200 }}
      // iPad Chrome (CriOS) frequently creates a WebGL context that is
      // already lost — `antialias: true` + the default `high-performance`
      // power preference make this more likely. On coarse-pointer devices we
      // ask for the cheapest possible context so iOS is more willing to
      // grant it; on desktop we keep quality high.
      gl={{
        antialias: !isCoarsePointer,
        precision: 'highp',
        powerPreference: isCoarsePointer ? 'low-power' : 'high-performance',
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
        alpha: false,
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl, size, camera }) => {
        if (shadowsEnabled) gl.shadowMap.type = shadowMapType;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        const rawGl = gl.getContext() as WebGLRenderingContext | WebGL2RenderingContext;
        const canvas = gl.domElement;
        const lostAtBoot =
          typeof rawGl.isContextLost === 'function' ? rawGl.isContextLost() : false;
        reportToLogBridge(lostAtBoot ? 'error' : 'info', 'canvas-created', {
          kind: 'canvas-created',
          coarsePointer: isCoarsePointer,
          size: { w: size.width, h: size.height, top: size.top, left: size.left },
          canvasCss: { w: canvas.clientWidth, h: canvas.clientHeight },
          canvasBuffer: { w: canvas.width, h: canvas.height },
          dpr: effectivePixelRatio,
          shadowsEnabled,
          camera: { type: camera.type, position: camera.position.toArray() },
          glVersion: rawGl.getParameter(rawGl.VERSION) as string,
          glVendor: rawGl.getParameter(rawGl.VENDOR) as string,
          glRenderer: rawGl.getParameter(rawGl.RENDERER) as string,
          glError: rawGl.getError(),
          contextLost: lostAtBoot,
        });
        if (lostAtBoot) setContextLost(true);
        canvas.addEventListener('webglcontextlost', (e) => {
          // eslint-disable-next-line no-console
          console.error('WebGL context lost', e);
          reportToLogBridge('error', 'webgl-context-lost', { kind: 'webgl-context-lost' });
          e.preventDefault();
          setContextLost(true);
        });
        canvas.addEventListener('webglcontextrestored', () => {
          reportToLogBridge('info', 'webgl-context-restored', { kind: 'webgl-context-restored' });
          setContextLost(false);
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

function ContextLostNotice() {
  return (
    <div
      role="alert"
      style={{
        position: 'absolute',
        inset: 0,
        background: '#1a120a',
        color: '#f3e7c1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h2 style={{ color: '#f3a04a', marginBottom: 12 }}>
        Não foi possível carregar a cena 3D
      </h2>
      <p style={{ maxWidth: 520, lineHeight: 1.5, opacity: 0.9 }}>
        O navegador negou o contexto WebGL. No iPad isso costuma ser por causa de
        memória: feche as outras abas do navegador e toque em <b>Recarregar</b>.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 20,
          padding: '10px 18px',
          background: '#a0410d',
          color: '#fff',
          border: '1px solid #3b2b18',
          borderRadius: 6,
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        Recarregar
      </button>
    </div>
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


