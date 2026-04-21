import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/state/gameStore';

// Tumble-and-settle 3D dice. The engine is authoritative for the result;
// the animation just plays for a fixed duration and then snaps faces to match.

const ANIM_MS = 1000;

export function Dice() {
  const roll = useGameStore((s) => s.state?.lastRoll);
  const group1 = useRef<THREE.Group>(null);
  const group2 = useRef<THREE.Group>(null);
  const startedAt = useRef<number | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    if (!roll) {
      startedAt.current = null;
      return;
    }
    startedAt.current = performance.now();
    force((n) => n + 1);
  }, [roll]);

  useFrame(() => {
    if (startedAt.current == null) return;
    const elapsed = performance.now() - startedAt.current;
    const t = Math.min(1, elapsed / ANIM_MS);
    const tumble = (1 - t) * 10;
    if (group1.current) {
      group1.current.rotation.x += tumble * 0.02;
      group1.current.rotation.y += tumble * 0.025;
    }
    if (group2.current) {
      group2.current.rotation.x += tumble * 0.022;
      group2.current.rotation.z += tumble * 0.018;
    }
    if (t >= 1 && roll && group1.current && group2.current) {
      faceRotation(group1.current, roll.a);
      faceRotation(group2.current, roll.b);
      startedAt.current = null;
    }
  });

  if (!roll) return null;
  return (
    <group position={[0, 0.6, 0]}>
      <group ref={group1} position={[-0.6, 0, 0]}>
        <Die />
      </group>
      <group ref={group2} position={[0.6, 0, 0]}>
        <Die />
      </group>
    </group>
  );
}

function Die() {
  const mats = useMemo(() => [1, 2, 3, 4, 5, 6].map((n) => diePipsMaterial(n)), []);
  return (
    <mesh castShadow>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      {mats.map((m, i) => (
        <primitive key={i} object={m} attach={`material-${i}`} />
      ))}
    </mesh>
  );
}

function diePipsMaterial(n: number): THREE.MeshStandardMaterial {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f4e3b5';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#6a4520';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, size - 8, size - 8);
  ctx.fillStyle = '#3b2b18';
  for (const [x, y] of PIPS[n]!) {
    ctx.beginPath();
    ctx.arc(x * size, y * size, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
}

const PIPS: Record<number, Array<[number, number]>> = {
  1: [[0.5, 0.5]],
  2: [
    [0.25, 0.25],
    [0.75, 0.75],
  ],
  3: [
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
  ],
  4: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  5: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.5, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  6: [
    [0.25, 0.22],
    [0.75, 0.22],
    [0.25, 0.5],
    [0.75, 0.5],
    [0.25, 0.78],
    [0.75, 0.78],
  ],
};

// Face indexing of BoxGeometry: 0 +X, 1 -X, 2 +Y, 3 -Y, 4 +Z, 5 -Z.
// We want a given face to be up (+Y) at rest.
function faceRotation(g: THREE.Group, face: number): void {
  const rotations: Record<number, [number, number, number]> = {
    1: [0, 0, 0],
    2: [0, 0, -Math.PI / 2],
    3: [Math.PI / 2, 0, 0],
    4: [-Math.PI / 2, 0, 0],
    5: [0, 0, Math.PI / 2],
    6: [Math.PI, 0, 0],
  };
  const r = rotations[face] ?? [0, 0, 0];
  g.rotation.set(r[0], r[1], r[2]);
}
