import { Canvas, useFrame } from '@react-three/fiber';
import { MapControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Board } from './Board';
import { Tokens } from './tokens/Tokens';
import { Dice } from './Dice';
import { TableProps } from './TableProps';
import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { useUiStore } from '@/state/uiStore';
import { anchorForTile } from './layout';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import { reportToLogBridge } from '@/lib/logBridge';

// Seated-player POV. Lower Y + further Z produces a strong perspective tilt
// where the far edge of the board recedes and the near edge is close —
// matches the Catan Universe reference framing.
const DEFAULT_CAMERA_POS: [number, number, number] = [0, 14, 28];
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
        // Filmic tonemapping flattens highlights and lifts shadows for a
        // warmer, board-game-print look. Exposure slightly under 1 keeps
        // bright parchment from blowing out under the new HDRI.
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.95;
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
      {/* Warm ambient room color — what bleeds through the fog at the
          horizon. Reads as "dim parlour with a lit fireplace somewhere"
          instead of a black void. */}
      <color attach="background" args={['#1f1208']} />
      {/* Warm fog — table surface fades into the room atmosphere at the
          edges. Shortened so the table feels enclosed in warm light. */}
      <fog attach="fog" args={['#2a1608', 28, 70]} />

      {/* HDRI-based image-based lighting — provides soft reflections on brass
          and subtle color variation across parchment. Skip on coarse-pointer
          devices to protect iPad memory. */}
      {!isCoarsePointer && (
        <Environment
          preset="apartment"
          environmentIntensity={0.4}
          background={false}
        />
      )}

      {/* Warm hemisphere — very soft bounced light from ceiling and floor.
          Kept low so the pool-of-light from the overhead lamp can dominate
          the contrast ratio, matching the Catan reference's dramatic look. */}
      <hemisphereLight args={['#ffcf8c', '#0f0804', 0.18]} />

      {/* Key light — a warm chandelier from front-left, high. Softer than
          before so the central point-light is the star. */}
      <directionalLight
        position={[8, 20, 12]}
        intensity={0.85}
        color="#ffdc9a"
        castShadow={shadowsEnabled && quality !== 'low'}
        shadow-mapSize={quality === 'high' ? 2048 : 1024}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* Fill light — cool soft glow from camera-right to balance the warm
          key without killing contrast. Very weak, no shadow. */}
      <directionalLight position={[-10, 8, -4]} intensity={0.2} color="#8aa5c2" />

      {/* Rim light — hot orange from far/low behind the board. Edge-lights
          tokens and flag poles so they pop against the dark wood. */}
      <directionalLight position={[0, 5, -18]} intensity={0.55} color="#ff8a3a" />

      {/* Overhead lamp — a bright tight warm pool directly above the board,
          casting shadows straight down. This is the dramatic "spotlight on
          the table" effect: bright parchment center, dark table edges. */}
      <pointLight
        position={[0, 15, 0]}
        intensity={90}
        distance={32}
        decay={2}
        color="#ffd288"
        castShadow={shadowsEnabled && quality !== 'low'}
        shadow-mapSize={quality === 'high' ? 1024 : 512}
        shadow-bias={-0.0004}
      />

      <Board />
      <TableProps />
      <Tokens />
      <Dice />
      <CameraIdleDrift controls={controls} />

      {/* Post-processing — adds the cinematic polish that pushes the scene
          from "rendered model" to "production game". Skipped on coarse-pointer
          devices (iPad) to protect WebGL memory. */}
      {!isCoarsePointer && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.65}
            luminanceSmoothing={0.3}
            kernelSize={KernelSize.LARGE}
            mipmapBlur
          />
          <Vignette
            offset={0.32}
            darkness={0.78}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      )}

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

// Subtle camera breathing while idle. Orbits the camera around the controls
// target by ~1.5° at a ~14s period, and lifts it by a tiny amount. Pauses
// whenever the user interacts with the controls and resumes after 2.5s of
// stillness. Meant to kill the "static render" feeling.
const IDLE_TIMEOUT_MS = 2500;
const DRIFT_AMPL_RAD = (1.5 * Math.PI) / 180;
const DRIFT_PERIOD_S = 14;
function CameraIdleDrift({ controls }: { controls: React.MutableRefObject<any> }) {
  const lastInteractionRef = useRef(performance.now());
  const baselineRef = useRef<{ angle: number; radius: number; y: number } | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const mark = (): void => {
      lastInteractionRef.current = performance.now();
      baselineRef.current = null; // re-capture baseline on next idle tick
    };
    c.addEventListener('start', mark);
    c.addEventListener('change', mark);
    return () => {
      c.removeEventListener('start', mark);
      c.removeEventListener('change', mark);
    };
  }, [controls]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const idleMs = performance.now() - lastInteractionRef.current;
    if (idleMs < IDLE_TIMEOUT_MS) return;

    // Capture a baseline the first tick after we become idle; then perturb
    // relative to it. This way a zoom/pan by the user during idle resets
    // cleanly rather than compounding.
    const cam = c.object as THREE.PerspectiveCamera;
    const t = c.target as THREE.Vector3;
    if (!baselineRef.current) {
      const dx = cam.position.x - t.x;
      const dz = cam.position.z - t.z;
      baselineRef.current = {
        angle: Math.atan2(dz, dx),
        radius: Math.hypot(dx, dz),
        y: cam.position.y,
      };
      tRef.current = 0;
    }
    tRef.current += delta;
    const phase = (tRef.current / DRIFT_PERIOD_S) * Math.PI * 2;
    const b = baselineRef.current;
    const a = b.angle + Math.sin(phase) * DRIFT_AMPL_RAD;
    cam.position.x = t.x + Math.cos(a) * b.radius;
    cam.position.z = t.z + Math.sin(a) * b.radius;
    cam.position.y = b.y + Math.sin(phase * 0.7) * 0.12;
    cam.lookAt(t);
  });
  return null;
}

function qualityPreset(q: 'low' | 'medium' | 'high'): {
  pixelRatio: [number, number];
  shadowMapType: THREE.ShadowMapType;
} {
  if (q === 'low') return { pixelRatio: [1, 1], shadowMapType: THREE.BasicShadowMap };
  if (q === 'high') return { pixelRatio: [1, 2], shadowMapType: THREE.PCFSoftShadowMap };
  return { pixelRatio: [1, 1.5], shadowMapType: THREE.PCFShadowMap };
}


