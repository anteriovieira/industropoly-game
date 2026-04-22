import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TokenKind } from '@/engine/types';

// Each token is a small assembly of primitive meshes shaped to resemble a
// Victorian-era game pin. Every piece sits on a common brass-ringed pedestal
// so the set reads as a matched collection. Idle animation is a gentle bob.

interface TokenProps {
  kind: TokenKind;
  color?: string;
  scale?: number;
  animate?: boolean;
}

export function Token({ kind, color = '#8a2a1b', scale = 1, animate = true }: TokenProps) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current || !animate) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = 0.15 + Math.sin(t * 1.8) * 0.05;
    ref.current.rotation.y += 0.002;
  });
  return (
    <group ref={ref} scale={scale}>
      {renderToken(kind, color)}
    </group>
  );
}

function renderToken(kind: TokenKind, color: string): JSX.Element {
  switch (kind) {
    case 'locomotive':
      return <Locomotive color={color} />;
    case 'top-hat':
      return <TopHat color={color} />;
    case 'cotton-bobbin':
      return <CottonBobbin color={color} />;
    case 'pickaxe':
      return <Pickaxe color={color} />;
    case 'pocket-watch':
      return <PocketWatch color={color} />;
    case 'factory-chimney':
      return <FactoryChimney color={color} />;
  }
}

// Shared palette for the metalwork across the set.
const BRASS = '#c89342';
const BRASS_LIGHT = '#e8c26a';
const DARK_IRON = '#1a0e04';
const WOOD = '#5a3818';
const WOOD_DARK = '#3a2410';
const FELT = '#241409';

/**
 * A brass-rimmed coin-like pedestal that every token stands on. Gives the
 * set a unified "game pin" silhouette and provides a stable anchor for the
 * shape above.
 */
function TokenBase({ color }: { color: string }) {
  return (
    <group>
      {/* Felt underside */}
      <mesh receiveShadow position={[0, -0.012, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.024, 32]} />
        <meshStandardMaterial color={FELT} roughness={0.95} />
      </mesh>
      {/* Brass rim */}
      <mesh castShadow receiveShadow position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.025, 40]} />
        <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Reeded edge highlight */}
      <mesh position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.006, 8, 56]} />
        <meshStandardMaterial color={BRASS_LIGHT} metalness={0.95} roughness={0.18} />
      </mesh>
      {/* Colored inlay disc */}
      <mesh castShadow position={[0, 0.026, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.008, 40]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.55} />
      </mesh>
      {/* Engraved inner ring on the inlay */}
      <mesh position={[0, 0.031, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.21, 0.003, 6, 44]} />
        <meshStandardMaterial color={DARK_IRON} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Locomotive({ color }: { color: string }) {
  const boilerMat = { color, metalness: 0.65, roughness: 0.35 };
  const ironMat = { color: DARK_IRON, metalness: 0.55, roughness: 0.5 };
  const brassMat = { color: BRASS, metalness: 0.9, roughness: 0.3 };
  return (
    <group>
      <TokenBase color={color} />
      {/* Chassis */}
      <mesh castShadow position={[0, 0.09, 0]}>
        <boxGeometry args={[0.62, 0.05, 0.26]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>
      {/* Boiler (horizontal cylinder) */}
      <mesh castShadow position={[-0.04, 0.21, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, 0.44, 28]} />
        <meshStandardMaterial {...boilerMat} />
      </mesh>
      {/* Boiler face ring (front) */}
      <mesh position={[-0.26, 0.21, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.105, 0.012, 10, 24]} />
        <meshStandardMaterial {...brassMat} />
      </mesh>
      {/* Boiler bands */}
      {[-0.14, -0.02, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.21, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.112, 0.008, 8, 24]} />
          <meshStandardMaterial {...brassMat} />
        </mesh>
      ))}
      {/* Smokestack / funnel */}
      <mesh castShadow position={[-0.14, 0.37, 0]}>
        <cylinderGeometry args={[0.06, 0.045, 0.14, 18]} />
        <meshStandardMaterial {...ironMat} />
      </mesh>
      {/* Funnel rim */}
      <mesh position={[-0.14, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.06, 0.008, 8, 20]} />
        <meshStandardMaterial {...brassMat} />
      </mesh>
      {/* Steam dome */}
      <mesh castShadow position={[0.02, 0.34, 0]}>
        <sphereGeometry args={[0.055, 18, 14]} />
        <meshStandardMaterial {...brassMat} />
      </mesh>
      {/* Sand dome */}
      <mesh castShadow position={[0.14, 0.31, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.05, 14]} />
        <meshStandardMaterial {...brassMat} />
      </mesh>
      {/* Cab */}
      <mesh castShadow position={[0.24, 0.27, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.26]} />
        <meshStandardMaterial {...boilerMat} />
      </mesh>
      {/* Cab roof */}
      <mesh castShadow position={[0.24, 0.39, 0]}>
        <boxGeometry args={[0.24, 0.025, 0.3]} />
        <meshStandardMaterial color={DARK_IRON} roughness={0.7} />
      </mesh>
      {/* Cab windows (dark) */}
      <mesh position={[0.24, 0.3, 0.131]}>
        <boxGeometry args={[0.1, 0.08, 0.002]} />
        <meshStandardMaterial color="#0a0604" roughness={0.2} metalness={0.2} />
      </mesh>
      <mesh position={[0.24, 0.3, -0.131]}>
        <boxGeometry args={[0.1, 0.08, 0.002]} />
        <meshStandardMaterial color="#0a0604" roughness={0.2} metalness={0.2} />
      </mesh>
      {/* Cowcatcher (angled wedge) */}
      <mesh castShadow position={[-0.32, 0.1, 0]} rotation={[0, 0, Math.PI / 5]}>
        <boxGeometry args={[0.08, 0.13, 0.24]} />
        <meshStandardMaterial {...ironMat} />
      </mesh>
      {/* Headlamp */}
      <mesh castShadow position={[-0.27, 0.27, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.03, 0.04, 16]} />
        <meshStandardMaterial color={BRASS_LIGHT} metalness={0.95} roughness={0.2} />
      </mesh>
      {/* Wheels (three pairs, the driver is bigger) */}
      {[
        { x: -0.22, r: 0.06 },
        { x: 0.0, r: 0.08 },
        { x: 0.22, r: 0.07 },
      ].flatMap(({ x, r }) =>
        [0.145, -0.145].map((z) => (
          <group key={`${x}:${z}`}>
            <mesh castShadow position={[x, r, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[r, r, 0.035, 20]} />
              <meshStandardMaterial color={DARK_IRON} metalness={0.7} roughness={0.35} />
            </mesh>
            {/* Hubcap */}
            <mesh position={[x, r, z + (z > 0 ? 0.02 : -0.02)]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[r * 0.35, r * 0.35, 0.005, 14]} />
              <meshStandardMaterial {...brassMat} />
            </mesh>
          </group>
        )),
      )}
      {/* Connecting rod (left side) */}
      <mesh position={[0.0, 0.07, 0.172]}>
        <boxGeometry args={[0.44, 0.015, 0.012]} />
        <meshStandardMaterial {...brassMat} />
      </mesh>
      <mesh position={[0.0, 0.07, -0.172]}>
        <boxGeometry args={[0.44, 0.015, 0.012]} />
        <meshStandardMaterial {...brassMat} />
      </mesh>
    </group>
  );
}

function TopHat({ color }: { color: string }) {
  return (
    <group>
      <TokenBase color={color} />
      {/* Brim — broad disc */}
      <mesh castShadow position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.025, 40]} />
        <meshStandardMaterial color="#0e0708" roughness={0.55} metalness={0.1} />
      </mesh>
      {/* Brim curl (edge torus) */}
      <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.325, 0.014, 10, 44]} />
        <meshStandardMaterial color="#0e0708" roughness={0.5} />
      </mesh>
      {/* Crown (slight flare upward for that silk-hat silhouette) */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.22, 0.2, 0.42, 32]} />
        <meshStandardMaterial color="#14090a" roughness={0.45} metalness={0.15} />
      </mesh>
      {/* Crown top cap */}
      <mesh castShadow position={[0, 0.496, 0]}>
        <cylinderGeometry args={[0.222, 0.222, 0.015, 32]} />
        <meshStandardMaterial color="#14090a" roughness={0.5} />
      </mesh>
      {/* Hatband (color) */}
      <mesh position={[0, 0.105, 0]}>
        <cylinderGeometry args={[0.205, 0.205, 0.055, 32]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.2} />
      </mesh>
      {/* Band upper pinstripe */}
      <mesh position={[0, 0.135, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.206, 0.003, 6, 40]} />
        <meshStandardMaterial color={BRASS_LIGHT} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.078, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.206, 0.003, 6, 40]} />
        <meshStandardMaterial color={BRASS_LIGHT} metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Buckle */}
      <mesh position={[0, 0.105, 0.207]}>
        <boxGeometry args={[0.07, 0.06, 0.01]} />
        <meshStandardMaterial color={BRASS_LIGHT} metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.105, 0.213]}>
        <boxGeometry args={[0.05, 0.04, 0.004]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}

function CottonBobbin({ color }: { color: string }) {
  const threadCount = 9;
  const spindleBottom = 0.12;
  const ringSpacing = 0.036;
  return (
    <group>
      <TokenBase color={color} />
      {/* Bottom flange */}
      <mesh castShadow position={[0, 0.065, 0]}>
        <cylinderGeometry args={[0.24, 0.26, 0.06, 28]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      {/* Bottom flange ring */}
      <mesh position={[0, 0.092, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.006, 8, 32]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
      </mesh>
      {/* Spindle core */}
      <mesh castShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.46, 18]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>
      {/* Wound thread — stacked toruses simulating a coil */}
      {Array.from({ length: threadCount }).map((_, i) => (
        <mesh
          key={i}
          castShadow
          position={[0, spindleBottom + 0.04 + i * ringSpacing, 0]}
          rotation={[Math.PI / 2, 0, i * 0.4]}
        >
          <torusGeometry args={[0.14, 0.022, 10, 28]} />
          <meshStandardMaterial color={color} roughness={0.9} metalness={0.05} />
        </mesh>
      ))}
      {/* Thread highlight bands (subtle lighter stripes) */}
      {[0, 3, 6].map((i) => (
        <mesh
          key={`hl-${i}`}
          position={[0, spindleBottom + 0.04 + i * ringSpacing, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.144, 0.004, 6, 28]} />
          <meshStandardMaterial color="#fff5d6" roughness={0.6} opacity={0.35} transparent />
        </mesh>
      ))}
      {/* Top flange */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.26, 0.24, 0.06, 28]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      {/* Top flange ring */}
      <mesh position={[0, 0.525, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.006, 8, 32]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
      </mesh>
      {/* Hanging thread tail */}
      <mesh position={[0.155, 0.34, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.008, 0.008, 0.26, 10]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Needle poked through top */}
      <mesh castShadow position={[-0.04, 0.6, 0]} rotation={[0, 0, Math.PI / 10]}>
        <cylinderGeometry args={[0.006, 0.002, 0.18, 10]} />
        <meshStandardMaterial color={BRASS_LIGHT} metalness={0.95} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Pickaxe({ color }: { color: string }) {
  return (
    <group>
      <TokenBase color={color} />
      {/* Small stone pile on the base */}
      {[
        { p: [0.1, 0.04, 0.05] as const, s: 0.05 },
        { p: [-0.12, 0.04, -0.06] as const, s: 0.04 },
        { p: [0.0, 0.04, -0.12] as const, s: 0.035 },
      ].map((r, i) => (
        <mesh key={i} castShadow position={r.p}>
          <dodecahedronGeometry args={[r.s, 0]} />
          <meshStandardMaterial color="#6a6150" roughness={0.95} />
        </mesh>
      ))}
      {/* Slightly tilted pickaxe standing up */}
      <group rotation={[0, 0, Math.PI / 9]} position={[0, 0.04, 0]}>
        {/* Handle — tapered wooden shaft */}
        <mesh castShadow position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.028, 0.036, 0.6, 18]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
        </mesh>
        {/* Handle grip bands */}
        {[0.08, 0.14].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.034, 0.004, 6, 16]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
          </mesh>
        ))}
        {/* Handle pommel cap */}
        <mesh castShadow position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 14]} />
          <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Iron eye (where head meets handle) */}
        <mesh castShadow position={[0, 0.61, 0]}>
          <boxGeometry args={[0.1, 0.095, 0.1]} />
          <meshStandardMaterial color={DARK_IRON} metalness={0.65} roughness={0.4} />
        </mesh>
        {/* Pick head — two tapered spikes with subtle curve */}
        <group position={[0, 0.61, 0]}>
          <mesh castShadow position={[0.16, 0.025, 0]} rotation={[0, 0, -Math.PI / 2 + 0.12]}>
            <coneGeometry args={[0.042, 0.3, 18]} />
            <meshStandardMaterial color={color} metalness={0.85} roughness={0.28} />
          </mesh>
          <mesh castShadow position={[-0.16, 0.025, 0]} rotation={[0, 0, Math.PI / 2 - 0.12]}>
            <coneGeometry args={[0.042, 0.3, 18]} />
            <meshStandardMaterial color={color} metalness={0.85} roughness={0.28} />
          </mesh>
          {/* Brass wedges at head base */}
          <mesh position={[0.05, 0.05, 0]}>
            <boxGeometry args={[0.02, 0.04, 0.095]} />
            <meshStandardMaterial color={BRASS_LIGHT} metalness={0.95} roughness={0.25} />
          </mesh>
          <mesh position={[-0.05, 0.05, 0]}>
            <boxGeometry args={[0.02, 0.04, 0.095]} />
            <meshStandardMaterial color={BRASS_LIGHT} metalness={0.95} roughness={0.25} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function PocketWatch({ color }: { color: string }) {
  return (
    <group>
      <TokenBase color={color} />
      {/* Short stand so the watch is raised off the pedestal */}
      <mesh castShadow position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.05, 0.09, 0.08, 16]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
      </mesh>
      {/* Watch case tilted forward so the dial faces the camera */}
      <group position={[0, 0.3, 0]} rotation={[-Math.PI / 2.4, 0, 0]}>
        {/* Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.06, 44]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.25} />
        </mesh>
        {/* Outer bezel */}
        <mesh position={[0, 0.031, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.218, 0.014, 10, 44]} />
          <meshStandardMaterial color={BRASS_LIGHT} metalness={0.95} roughness={0.2} />
        </mesh>
        {/* Dial */}
        <mesh position={[0, 0.032, 0]}>
          <cylinderGeometry args={[0.195, 0.195, 0.005, 44]} />
          <meshStandardMaterial color="#f7ebc7" roughness={0.55} />
        </mesh>
        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const r = 0.168;
          const isCardinal = i % 3 === 0;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * r, 0.036, Math.sin(a) * r]}
              rotation={[0, -a, 0]}
            >
              <boxGeometry args={[0.012, 0.004, isCardinal ? 0.028 : 0.016]} />
              <meshStandardMaterial color={DARK_IRON} />
            </mesh>
          );
        })}
        {/* Minute hand */}
        <mesh position={[0, 0.04, -0.06]}>
          <boxGeometry args={[0.01, 0.004, 0.13]} />
          <meshStandardMaterial color={DARK_IRON} />
        </mesh>
        {/* Hour hand */}
        <mesh position={[0.045, 0.04, 0.01]} rotation={[0, Math.PI / 2.6, 0]}>
          <boxGeometry args={[0.008, 0.004, 0.09]} />
          <meshStandardMaterial color={DARK_IRON} />
        </mesh>
        {/* Center pin */}
        <mesh position={[0, 0.043, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.008, 14]} />
          <meshStandardMaterial color={BRASS_LIGHT} metalness={0.95} roughness={0.2} />
        </mesh>
      </group>
      {/* Winding stem (crown) */}
      <mesh castShadow position={[0, 0.53, -0.04]}>
        <cylinderGeometry args={[0.028, 0.028, 0.04, 18]} />
        <meshStandardMaterial color={BRASS_LIGHT} metalness={0.95} roughness={0.2} />
      </mesh>
      {/* Bow ring */}
      <mesh castShadow position={[0, 0.58, -0.06]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.045, 0.013, 12, 24]} />
        <meshStandardMaterial color={BRASS_LIGHT} metalness={0.95} roughness={0.2} />
      </mesh>
      {/* Chain — a short string of torus links hanging from the bow */}
      {[
        { p: [0.04, 0.55, -0.07] as const, rx: Math.PI / 2.1 },
        { p: [0.1, 0.5, -0.04] as const, rx: Math.PI / 2 },
        { p: [0.16, 0.44, -0.01] as const, rx: Math.PI / 2.2 },
      ].map((l, i) => (
        <mesh key={i} position={l.p} rotation={[l.rx, i * 0.4, 0]}>
          <torusGeometry args={[0.022, 0.006, 8, 16]} />
          <meshStandardMaterial color={BRASS_LIGHT} metalness={0.95} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function FactoryChimney({ color }: { color: string }) {
  return (
    <group>
      <TokenBase color={color} />
      {/* Stone footing */}
      <mesh castShadow position={[0, 0.075, 0]}>
        <boxGeometry args={[0.42, 0.05, 0.42]} />
        <meshStandardMaterial color="#9a8a6a" roughness={0.85} />
      </mesh>
      {/* Brick plinth */}
      <mesh castShadow position={[0, 0.16, 0]}>
        <boxGeometry args={[0.36, 0.13, 0.36]} />
        <meshStandardMaterial color="#7a321a" roughness={0.95} />
      </mesh>
      {/* Brick courses — thin horizontal grooves */}
      {[0.12, 0.17, 0.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[0.365, 0.006, 0.365]} />
          <meshStandardMaterial color="#3a1a0c" roughness={0.9} />
        </mesh>
      ))}
      {/* Stone cap on plinth */}
      <mesh castShadow position={[0, 0.235, 0]}>
        <boxGeometry args={[0.4, 0.028, 0.4]} />
        <meshStandardMaterial color="#b8a682" roughness={0.8} />
      </mesh>
      {/* Chimney shaft (tapered) */}
      <mesh castShadow position={[0, 0.47, 0]}>
        <cylinderGeometry args={[0.085, 0.13, 0.44, 24]} />
        <meshStandardMaterial color="#8a3a1c" roughness={0.9} />
      </mesh>
      {/* Reinforcement bands in player color */}
      {[
        { y: 0.28, r: 0.125 },
        { y: 0.4, r: 0.11 },
        { y: 0.52, r: 0.098 },
        { y: 0.63, r: 0.088 },
      ].map((b, i) => (
        <mesh key={i} position={[0, b.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[b.r, 0.011, 10, 28]} />
          <meshStandardMaterial color={color} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}
      {/* Top flare (corbel) */}
      <mesh castShadow position={[0, 0.71, 0]}>
        <cylinderGeometry args={[0.11, 0.09, 0.05, 24]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>
      {/* Brass rim */}
      <mesh position={[0, 0.735, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.108, 0.008, 8, 24]} />
        <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Smoke puffs */}
      <mesh position={[0.03, 0.82, 0.01]}>
        <sphereGeometry args={[0.07, 14, 10]} />
        <meshStandardMaterial color="#d9cbb2" roughness={1} transparent opacity={0.5} />
      </mesh>
      <mesh position={[-0.05, 0.9, -0.03]}>
        <sphereGeometry args={[0.06, 14, 10]} />
        <meshStandardMaterial color="#c9bba2" roughness={1} transparent opacity={0.4} />
      </mesh>
      <mesh position={[0.04, 0.97, 0.02]}>
        <sphereGeometry args={[0.05, 12, 10]} />
        <meshStandardMaterial color="#b9ab92" roughness={1} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
