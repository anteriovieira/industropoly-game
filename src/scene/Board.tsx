import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BOARD, colors, PLAYER_COLORS } from '@/ui/theme';
import { getParchmentTexture } from '@/assets/parchment';
import { getWoodTexture } from '@/assets/wood';
import { TILES } from '@/content/tiles';
import { TileMesh } from './TileMesh';
import { anchorForTile, boardStep } from './layout';
import { NewspaperPanel } from './NewspaperPanel';
import { reportToLogBridge } from '@/lib/logBridge';
import { useGameStore } from '@/state/gameStore';

export function Board() {
  const parchment = useMemo(() => getParchmentTexture(1024), []);
  const wood = useMemo(() => getWoodTexture(1024), []);
  const step = boardStep();
  const innerSize = BOARD.size - step * 2;
  const tiles = useGameStore((s) => s.state?.tiles);
  const players = useGameStore((s) => s.state?.players);

  useEffect(() => {
    reportToLogBridge('info', 'board-mounted', {
      kind: 'board-mounted',
      tileCount: TILES.length,
      innerSize,
      parchment: {
        image: !!parchment.image,
        imgWidth: (parchment.image as HTMLCanvasElement | undefined)?.width ?? null,
        imgHeight: (parchment.image as HTMLCanvasElement | undefined)?.height ?? null,
      },
    });
  }, [innerSize, parchment]);

  return (
    <group>
      {/* Room table — a huge stained-oak surface with procedural grain
          that extends well past the board and fades into warm fog. This is
          what turns the scene from "board in a void" into "board on a
          parlour table". */}
      <mesh receiveShadow position={[0, -0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial
          map={wood}
          color="#5c3d1f"
          roughness={0.72}
          metalness={0.08}
        />
      </mesh>

      {/* Darker stained wood "place mat" — a slightly raised rectangle just
          beneath the parchment, broader than the board by 4u. Same wood
          grain but darker, reading as a separate thicker piece. */}
      <mesh receiveShadow position={[0, -0.06, 0]}>
        <boxGeometry
          args={[BOARD.size + 4, BOARD.tileDepth * 1.2, BOARD.size + 4]}
        />
        <meshStandardMaterial
          map={wood}
          color="#3a2210"
          roughness={0.65}
          metalness={0.1}
        />
      </mesh>

      {/* Brass trim — thin raised ring between the wood mat and the parchment,
          reads as a metal inlay framing the map. */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry
          args={[BOARD.size + 0.25, BOARD.tileDepth * 0.5, BOARD.size + 0.25]}
        />
        <meshStandardMaterial color="#c9943a" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Board top surface — the parchment map itself */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[BOARD.size, BOARD.tileDepth, BOARD.size]} />
        <meshStandardMaterial map={parchment} roughness={0.9} metalness={0.02} />
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

      {/* Title pushed to the top edge so the center belongs to the story panel. */}
      <Text
        position={[0, BOARD.tileDepth / 2 + 0.03, -innerSize / 2 + 1.0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.1}
        color={colors.ink}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor={colors.parchmentLight}
      >
        INDUSTROPOLY
      </Text>
      <Text
        position={[0, BOARD.tileDepth / 2 + 0.03, -innerSize / 2 + 1.9]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.42}
        color={colors.inkSoft}
        anchorX="center"
        anchorY="middle"
        fontStyle="italic"
      >
        A Era do Vapor
      </Text>

      {/* Ambient newspaper panel — three legible headlines at the board center. */}
      <NewspaperPanel innerSize={innerSize} />

      {/* Tiles */}
      {TILES.map((t) => {
        const a = anchorForTile(t.id);
        const own = tiles?.[t.id];
        let ownerColor: string | null = null;
        if (own?.owner && players) {
          const idx = players.findIndex((p) => p.id === own.owner);
          ownerColor = PLAYER_COLORS[idx] ?? null;
        }
        return (
          <TileMesh
            key={t.id}
            tile={t}
            anchor={a}
            ownerColor={ownerColor}
            tier={own?.tier ?? 0}
            mortgaged={!!own?.mortgaged}
          />
        );
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
  // A real-looking brass compass with a magnetic needle. The needle's group
  // is the only thing that rotates: it always aligns to world north (−Z),
  // regardless of how the camera is panned. A small sinusoidal wobble adds
  // the magnetic-needle "alive" feel.
  const needleRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!needleRef.current) return;
    // The whole compass sits inside the board group at the given position.
    // Since the board itself doesn't rotate in world space, world north (−Z)
    // is the same as local north. We still set the rotation explicitly so
    // that if the board ever gets rotated later, this still works. The tiny
    // wobble simulates the needle settling on magnetic friction.
    const wobble = Math.sin(clock.elapsedTime * 1.7) * 0.025
      + Math.sin(clock.elapsedTime * 4.3) * 0.012;
    needleRef.current.rotation.y = wobble;
  });

  // Pre-compute the rose tick angles. 32 ticks: 4 long (cardinal) + 4 medium
  // (intercardinal) + 24 short.
  const ticks = useMemo(() => {
    const out: { angle: number; length: number; thickness: number }[] = [];
    for (let i = 0; i < 32; i++) {
      const isCardinal = i % 8 === 0;
      const isIntercardinal = !isCardinal && i % 4 === 0;
      out.push({
        angle: (i / 32) * Math.PI * 2,
        length: isCardinal ? 0.32 : isIntercardinal ? 0.22 : 0.13,
        thickness: isCardinal ? 0.04 : isIntercardinal ? 0.028 : 0.018,
      });
    }
    return out;
  }, []);

  return (
    <group position={position}>
      {/* Brass outer ring — hammered look via slight metalness/roughness */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        receiveShadow
      >
        <ringGeometry args={[1.05, 1.18, 64]} />
        <meshStandardMaterial
          color="#c9943a"
          roughness={0.32}
          metalness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Brass inner ring — frames the rose */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0015, 0]}>
        <ringGeometry args={[0.42, 0.46, 48]} />
        <meshStandardMaterial
          color="#e8c26a"
          roughness={0.28}
          metalness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dark face under the rose — like the black face of a real compass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0008, 0]}>
        <circleGeometry args={[1.05, 64]} />
        <meshStandardMaterial
          color="#1a0f06"
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>

      {/* 32 tick marks around the rose */}
      {ticks.map((t, i) => {
        const r = 1.0; // outer radius of ticks
        const cx = Math.sin(t.angle) * (r - t.length / 2);
        const cz = -Math.cos(t.angle) * (r - t.length / 2);
        return (
          <mesh
            key={i}
            position={[cx, 0.005, cz]}
            rotation={[-Math.PI / 2, 0, -t.angle]}
          >
            <planeGeometry args={[t.thickness, t.length]} />
            <meshStandardMaterial
              color={i % 8 === 0 ? '#fae2a0' : '#c9943a'}
              roughness={0.3}
              metalness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Cardinal labels — N (always at world −Z), E, S, W */}
      <CompassLabel letter="N" angle={0} radius={0.78} />
      <CompassLabel letter="E" angle={Math.PI / 2} radius={0.78} />
      <CompassLabel letter="S" angle={Math.PI} radius={0.78} />
      <CompassLabel letter="O" angle={-Math.PI / 2} radius={0.78} />

      {/* Magnetic needle — rotates inside its own group so it can point
          to world north regardless of board orientation. */}
      <group ref={needleRef} position={[0, 0.012, 0]}>
        {/* Red half (north end) — diamond pointer */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <shapeGeometry args={[northNeedleShape]} />
          <meshStandardMaterial
            color="#b8281e"
            roughness={0.45}
            metalness={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Steel half (south end) */}
        <mesh rotation={[-Math.PI / 2, 0, Math.PI]}>
          <shapeGeometry args={[southNeedleShape]} />
          <meshStandardMaterial
            color="#d4d4d0"
            roughness={0.35}
            metalness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Brass center pivot cap */}
        <mesh position={[0, 0.005, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.025, 16]} />
          <meshStandardMaterial color="#e8c26a" roughness={0.28} metalness={0.95} />
        </mesh>
        {/* Tiny brass dot on top */}
        <mesh position={[0, 0.018, 0]}>
          <sphereGeometry args={[0.025, 12, 8]} />
          <meshStandardMaterial color="#fae2a0" roughness={0.2} metalness={0.95} />
        </mesh>
      </group>

      {/* Glass dome reflection — a faint bright disc that suggests glass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
        <circleGeometry args={[1.0, 48]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.06}
          roughness={0.05}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

// Build the N (red, longer) and S (steel, shorter) needle shapes once.
const northNeedleShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.06, 0.1);
  s.lineTo(0, 0.78);
  s.lineTo(-0.06, 0.1);
  s.lineTo(0, 0);
  return s;
})();

const southNeedleShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.05, 0.08);
  s.lineTo(0, 0.65);
  s.lineTo(-0.05, 0.08);
  s.lineTo(0, 0);
  return s;
})();

function CompassLabel({
  letter,
  angle,
  radius,
}: {
  letter: string;
  angle: number;
  radius: number;
}) {
  const x = Math.sin(angle) * radius;
  const z = -Math.cos(angle) * radius;
  return (
    <Text
      position={[x, 0.008, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      fontSize={0.18}
      color="#fae2a0"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.005}
      outlineColor="#3a2210"
    >
      {letter}
    </Text>
  );
}
