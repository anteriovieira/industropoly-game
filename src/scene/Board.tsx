import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { BOARD, colors } from '@/ui/theme';
import { getParchmentTexture } from '@/assets/parchment';
import { TILES } from '@/content/tiles';
import { TileMesh } from './TileMesh';
import { anchorForTile, boardStep } from './layout';

export function Board() {
  const parchment = useMemo(() => getParchmentTexture(1024), []);
  const step = boardStep();
  const innerSize = BOARD.size - step * 2;

  return (
    <group>
      {/* Board top surface */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[BOARD.size, BOARD.tileDepth, BOARD.size]} />
        <meshStandardMaterial map={parchment} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Inked border ring — four thin dark rectangles just inside the edge */}
      <InkBorder />

      {/* Central area — a lighter inset plane with compass rose + title */}
      <mesh
        position={[0, BOARD.tileDepth / 2 + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[innerSize, innerSize]} />
        <meshBasicMaterial map={parchment} transparent opacity={0.85} />
      </mesh>

      {/* Compass rose — drawn top-left of the inner area as in the reference image */}
      <CompassRose position={[-innerSize / 2 + 2, BOARD.tileDepth / 2 + 0.02, -innerSize / 2 + 2]} />

      {/* Title plaque at the board center */}
      <Text
        position={[0, BOARD.tileDepth / 2 + 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.8}
        color={colors.ink}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={colors.parchmentLight}
      >
        INDUSTROPOLY
      </Text>
      <Text
        position={[0, BOARD.tileDepth / 2 + 0.03, 1.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.6}
        color={colors.inkSoft}
        anchorX="center"
        anchorY="middle"
        fontStyle="italic"
      >
        A Era do Vapor
      </Text>

      {/* Tiles */}
      {TILES.map((t) => {
        const a = anchorForTile(t.id);
        return <TileMesh key={t.id} tile={t} anchor={a} />;
      })}
    </group>
  );
}

function InkBorder() {
  const s = BOARD.size;
  const thick = 0.08;
  const y = BOARD.tileDepth / 2 + 0.005;
  const mat = new THREE.MeshBasicMaterial({ color: colors.ink });
  // Four thin rectangles as a frame just outside the tile row's inner edge.
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, 0, -s / 2 + thick / 2]} material={mat}>
        <planeGeometry args={[s, thick]} />
      </mesh>
      <mesh position={[0, 0, s / 2 - thick / 2]} material={mat}>
        <planeGeometry args={[s, thick]} />
      </mesh>
      <mesh position={[-s / 2 + thick / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={mat}>
        <planeGeometry args={[s, thick]} />
      </mesh>
      <mesh position={[s / 2 - thick / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={mat}>
        <planeGeometry args={[s, thick]} />
      </mesh>
    </group>
  );
}

function CompassRose({ position }: { position: [number, number, number] }) {
  // Stylized compass: a ring with N/E/S/W points.
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.0, 48]} />
        <meshBasicMaterial color={colors.ink} transparent opacity={0.6} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, a]}
          position={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]}
        >
          <circleGeometry args={[0.15, 3]} />
          <meshBasicMaterial color={colors.ink} transparent opacity={0.5} />
        </mesh>
      ))}
      <Text
        position={[0, 0.05, -1.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.35}
        color={colors.ink}
        anchorX="center"
        anchorY="middle"
      >
        N
      </Text>
    </group>
  );
}
