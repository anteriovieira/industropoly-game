import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TokenKind } from '@/engine/types';

// Each token is a small assembly of primitive meshes. Idle animation is a gentle bob.

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

function Locomotive({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[0.6, 0.25, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh castShadow position={[0.1, 0.32, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh castShadow position={[-0.2, 0.05, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04]} />
        <meshStandardMaterial color="#2c1b0a" />
      </mesh>
      <mesh castShadow position={[0.2, 0.05, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04]} />
        <meshStandardMaterial color="#2c1b0a" />
      </mesh>
      <mesh castShadow position={[-0.2, 0.05, -0.17]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04]} />
        <meshStandardMaterial color="#2c1b0a" />
      </mesh>
      <mesh castShadow position={[0.2, 0.05, -0.17]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04]} />
        <meshStandardMaterial color="#2c1b0a" />
      </mesh>
    </group>
  );
}

function TopHat({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.04]} />
        <meshStandardMaterial color="#2c1b0a" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.05, 0.21]}>
        <boxGeometry args={[0.42, 0.04, 0.02]} />
        <meshStandardMaterial color="#d6b86a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function CottonBobbin({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.3]} />
        <meshStandardMaterial color="#efe1b6" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Pickaxe({ color }: { color: string }) {
  return (
    <group rotation={[0, 0, Math.PI / 6]}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6]} />
        <meshStandardMaterial color="#6a3e1a" />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.02, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

function PocketWatch({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.06]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02]} />
        <meshStandardMaterial color="#f5e7c2" />
      </mesh>
      <mesh castShadow position={[0, 0.45, 0]}>
        <torusGeometry args={[0.05, 0.015, 12, 24]} />
        <meshStandardMaterial color={color} metalness={0.7} />
      </mesh>
    </group>
  );
}

function FactoryChimney({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.04, 0]}>
        <boxGeometry args={[0.4, 0.08, 0.4]} />
        <meshStandardMaterial color="#6a4520" />
      </mesh>
      <mesh castShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.08, 0.11, 0.55]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.63, 0]}>
        <cylinderGeometry args={[0.11, 0.09, 0.04]} />
        <meshStandardMaterial color="#2c1b0a" />
      </mesh>
    </group>
  );
}
