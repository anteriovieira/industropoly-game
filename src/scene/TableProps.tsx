import * as THREE from 'three';
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

// Atmospheric props that sit on the table around the board, turning it from
// "floating playmat" into "board game on a desk in a lit room". All built
// from Three.js primitives so no asset shipping is required.

export function TableProps() {
  return (
    <group>
      {/* Back-left corner: 3-arm brass candelabra. The flames emit a warm
          point light that picks up the brass reflections. */}
      <Candelabra position={[-13.5, 0, -12]} />

      {/* Back-right corner: stack of leather-bound ledgers. Cold prop — no
          light, just silhouette. */}
      <BookStack position={[13.5, 0, -12]} rotation={0.3} />

      {/* Front-left: an inkwell with a quill. */}
      <Inkwell position={[-13.5, 0, 13]} />

      {/* Front-right: a scroll + a small loose book. */}
      <Scroll position={[13, 0, 13]} rotation={-0.4} />
      <SingleBook position={[14, 0, 10.5]} rotation={0.7} color="#5a1f18" />
    </group>
  );
}

function Candelabra({ position }: { position: [number, number, number] }) {
  const flameRef1 = useRef<THREE.PointLight>(null);
  const flameRef2 = useRef<THREE.PointLight>(null);
  const flameRef3 = useRef<THREE.PointLight>(null);
  // Flicker the candle lights subtly — not a true physical model, just a
  // perlin-ish random walk that reads as a live flame in peripheral vision.
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (flameRef1.current) flameRef1.current.intensity = 4 + Math.sin(t * 7.3) * 0.6 + Math.sin(t * 13) * 0.35;
    if (flameRef2.current) flameRef2.current.intensity = 4 + Math.sin(t * 6.1 + 1.2) * 0.5 + Math.sin(t * 12.5 + 2) * 0.3;
    if (flameRef3.current) flameRef3.current.intensity = 4 + Math.sin(t * 8.2 + 2.4) * 0.7 + Math.sin(t * 11) * 0.4;
  });

  return (
    <group position={position}>
      {/* Base disc */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.7, 0.08, 16]} />
        <meshStandardMaterial color="#c9943a" roughness={0.3} metalness={0.95} />
      </mesh>
      {/* Central column */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 1.1, 10]} />
        <meshStandardMaterial color="#c9943a" roughness={0.3} metalness={0.95} />
      </mesh>
      {/* Horizontal arm */}
      <mesh position={[0, 1.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 1.4, 8]} />
        <meshStandardMaterial color="#c9943a" roughness={0.3} metalness={0.95} />
      </mesh>
      {/* Candles — 3 of them on top of the arm */}
      <CandleAt x={-0.7} lightRef={flameRef1} />
      <CandleAt x={0} lightRef={flameRef2} />
      <CandleAt x={0.7} lightRef={flameRef3} />
    </group>
  );
}

function CandleAt({
  x,
  lightRef,
}: {
  x: number;
  lightRef: React.RefObject<THREE.PointLight>;
}) {
  return (
    <group position={[x, 1.1, 0]}>
      {/* Small brass cup */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.09, 0.1, 12]} />
        <meshStandardMaterial color="#8a6422" roughness={0.35} metalness={0.9} />
      </mesh>
      {/* Wax candle */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.075, 0.5, 12]} />
        <meshStandardMaterial color="#f0e0b0" roughness={0.9} metalness={0} />
      </mesh>
      {/* Wick */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.04, 6]} />
        <meshBasicMaterial color="#2a1810" />
      </mesh>
      {/* Flame — an emissive stretched sphere */}
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.06, 10, 8]} />
        <meshBasicMaterial color="#ffd590" transparent opacity={0.95} />
      </mesh>
      {/* Flame core — brighter */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#fff2c0" />
      </mesh>
      {/* Flame light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.72, 0]}
        intensity={4}
        distance={8}
        decay={2}
        color="#ffaa55"
      />
    </group>
  );
}

function BookStack({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  const books = useMemo(
    () => [
      { w: 1.9, d: 1.3, h: 0.28, color: '#5a1f18', spine: '#3a0f0a', y: 0.14 },
      { w: 1.8, d: 1.25, h: 0.24, color: '#2b4a6b', spine: '#1a2f45', y: 0.4 },
      { w: 1.85, d: 1.3, h: 0.32, color: '#4a3a1a', spine: '#2a2110', y: 0.68 },
    ],
    [],
  );
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {books.map((b, i) => (
        <group key={i} position={[0, b.y, 0]} rotation={[0, (i - 1) * 0.08, 0]}>
          <mesh castShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={0.78} metalness={0.02} />
          </mesh>
          {/* Spine strip */}
          <mesh position={[-b.w / 2 - 0.001, 0, 0]} castShadow>
            <boxGeometry args={[0.004, b.h, b.d]} />
            <meshStandardMaterial color={b.spine} roughness={0.85} />
          </mesh>
          {/* Gold detail line on spine */}
          <mesh position={[-b.w / 2 - 0.002, b.h * 0.1, 0]}>
            <boxGeometry args={[0.005, 0.01, b.d * 0.6]} />
            <meshStandardMaterial color="#c9943a" roughness={0.3} metalness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Inkwell({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Wooden base tray */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[1.4, 0.1, 0.9]} />
        <meshStandardMaterial color="#3a2210" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Ink bottle — dark glass */}
      <mesh position={[-0.3, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.36, 14]} />
        <meshStandardMaterial color="#0a0f14" roughness={0.25} metalness={0.5} />
      </mesh>
      {/* Bottle cap — brass */}
      <mesh position={[-0.3, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.08, 12]} />
        <meshStandardMaterial color="#c9943a" roughness={0.3} metalness={0.95} />
      </mesh>
      {/* Quill — a long cylinder + angled feather */}
      <group position={[0.35, 0.1, 0.1]} rotation={[0, 0, -0.4]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
          <meshStandardMaterial color="#2a1810" roughness={0.85} />
        </mesh>
        {/* Feather — a thin flat blade */}
        <mesh position={[0.12, 0.85, 0]} rotation={[0, 0, 0.5]} castShadow>
          <boxGeometry args={[0.32, 0.6, 0.02]} />
          <meshStandardMaterial
            color="#d8c8a8"
            roughness={0.85}
            transparent
            opacity={0.92}
          />
        </mesh>
      </group>
    </group>
  );
}

function Scroll({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Rolled parchment — a cylinder lying on its side */}
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1.6, 18]} />
        <meshStandardMaterial color="#e8d2a0" roughness={0.85} metalness={0} />
      </mesh>
      {/* Red ribbon tied around */}
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.21, 0.21, 0.12, 18]} />
        <meshStandardMaterial color="#7a1a14" roughness={0.5} metalness={0} />
      </mesh>
    </group>
  );
}

function SingleBook({
  position,
  rotation = 0,
  color,
}: {
  position: [number, number, number];
  rotation?: number;
  color: string;
}) {
  const spine = '#2a0f0a';
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[1.4, 0.24, 1.0]} />
        <meshStandardMaterial color={color} roughness={0.78} metalness={0.02} />
      </mesh>
      <mesh position={[-0.701, 0.12, 0]}>
        <boxGeometry args={[0.004, 0.24, 1.0]} />
        <meshStandardMaterial color={spine} roughness={0.85} />
      </mesh>
    </group>
  );
}
