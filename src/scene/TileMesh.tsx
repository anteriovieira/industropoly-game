import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { Tile } from '@/engine/types';
import { tileFaceTexture } from './tileFaceTexture';
import { tileSize, type TileAnchor } from './layout';
import { useUiStore } from '@/state/uiStore';

interface Props {
  tile: Tile;
  anchor: TileAnchor;
  ownerColor?: string | null;
  tier?: number;
  mortgaged?: boolean;
}

export function TileMesh({ tile, anchor, ownerColor = null, tier = 0, mortgaged = false }: Props) {
  const face = useMemo(() => tileFaceTexture(tile), [tile]);
  const { w, d, h } = tileSize();
  const setHovered = useUiStore((s) => s.setHoveredTile);

  const handleOver = (e: ThreeEvent<PointerEvent>): void => {
    e.stopPropagation();
    setHovered(tile.id);
  };
  const handleOut = (): void => {
    setHovered(null);
  };

  const showOwnerIndicator = !anchor.isCorner && ownerColor != null;
  const stripDepth = d * 0.14;
  const stripWidth = w * 0.88;
  const stripHeight = 0.035;
  // Inner edge of a tile (closer to the board center) is local -z in the
  // rotated group frame. Place the strip just inside that edge, above the
  // face plane.
  const stripZ = -d / 2 + stripDepth / 2 + 0.01;
  const stripY = h / 2 + stripHeight / 2 + 0.002;

  return (
    <group position={[anchor.x, h / 2 + 0.01, anchor.z]} rotation={[0, anchor.rotationY, 0]}>
      <mesh castShadow receiveShadow onPointerOver={handleOver} onPointerOut={handleOut}>
        <boxGeometry args={[w, h, d]} />
        {/* Six materials: right, left, top(face), bottom, front, back.
            We want the face on top (index 2 in BoxGeometry order). */}
        <meshStandardMaterial attach="material-0" color="#b08a4d" />
        <meshStandardMaterial attach="material-1" color="#b08a4d" />
        <meshStandardMaterial attach="material-2" map={face} roughness={0.85} />
        <meshStandardMaterial attach="material-3" color="#8f6b36" />
        <meshStandardMaterial attach="material-4" color="#b08a4d" />
        <meshStandardMaterial attach="material-5" color="#b08a4d" />
      </mesh>

      {showOwnerIndicator && (
        <OwnershipBadge
          ownerColor={ownerColor}
          tier={tier}
          mortgaged={mortgaged}
          stripWidth={stripWidth}
          stripDepth={stripDepth}
          stripHeight={stripHeight}
          stripY={stripY}
          stripZ={stripZ}
        />
      )}
    </group>
  );
}

interface BadgeProps {
  ownerColor: string;
  tier: number;
  mortgaged: boolean;
  stripWidth: number;
  stripDepth: number;
  stripHeight: number;
  stripY: number;
  stripZ: number;
}

function OwnershipBadge({
  ownerColor,
  tier,
  mortgaged,
  stripWidth,
  stripDepth,
  stripHeight,
  stripY,
  stripZ,
}: BadgeProps) {
  const pipSize = stripDepth * 0.8;
  const pipHeight = 0.08;
  const pipY = stripY + stripHeight / 2 + pipHeight / 2;
  const pipZ = stripZ;

  // Pip count: tiers 1..4 render as N houses; tier 5 renders as one bigger "hotel".
  const pipCount = tier >= 5 ? 1 : Math.max(0, Math.min(4, tier));
  const isHotel = tier >= 5;
  // Reserve the left end of the strip for the ownership flag so it does not
  // overlap the pips/hotel as tiers grow.
  const flagReserve = stripWidth * 0.22;
  const pipAreaWidth = stripWidth - flagReserve;
  const pipAreaCenter = flagReserve / 2;
  const pipSpacing = pipAreaWidth / 5;
  const flagX = -stripWidth / 2 + flagReserve / 2;

  return (
    <group>
      {/* Owner color strip along the inner edge */}
      <mesh position={[0, stripY, stripZ]}>
        <boxGeometry args={[stripWidth, stripHeight, stripDepth]} />
        <meshStandardMaterial
          color={ownerColor}
          transparent={mortgaged}
          opacity={mortgaged ? 0.35 : 1}
          roughness={0.6}
        />
      </mesh>

      {/* Ownership flag — always visible when the tile is owned, so players
          can read acquisitions at a glance even before any upgrade. */}
      <OwnershipFlag
        color={ownerColor}
        mortgaged={mortgaged}
        baseX={flagX}
        baseY={stripY + stripHeight / 2}
        baseZ={stripZ}
        stripDepth={stripDepth}
      />

      {/* Tier pips — small cubes (houses) or one larger (hotel) */}
      {!mortgaged && pipCount > 0 && !isHotel && (
        <>
          {Array.from({ length: pipCount }).map((_, i) => {
            const xOffset = pipAreaCenter + (i - (pipCount - 1) / 2) * pipSpacing;
            return (
              <mesh key={i} position={[xOffset, pipY, pipZ]} castShadow>
                <boxGeometry args={[pipSize, pipHeight, pipSize]} />
                <meshStandardMaterial color="#2d5a3a" roughness={0.55} />
              </mesh>
            );
          })}
        </>
      )}

      {!mortgaged && isHotel && (
        <mesh position={[pipAreaCenter, pipY, pipZ]} castShadow>
          <boxGeometry args={[pipAreaWidth * 0.7, pipHeight * 1.3, pipSize * 1.1]} />
          <meshStandardMaterial color="#8a2a1b" roughness={0.55} />
        </mesh>
      )}

      {/* Mortgage marker — small dark bar crossing the strip */}
      {mortgaged && (
        <mesh position={[0, stripY + 0.005, stripZ]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[stripWidth * 0.9, stripHeight * 1.4, stripDepth * 0.35]} />
          <meshStandardMaterial color="#1a120a" roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}

interface FlagProps {
  color: string;
  mortgaged: boolean;
  baseX: number;
  baseY: number;
  baseZ: number;
  stripDepth: number;
}

function OwnershipFlag({ color, mortgaged, baseX, baseY, baseZ, stripDepth }: FlagProps) {
  const poleHeight = 0.38;
  const poleRadius = stripDepth * 0.08;
  const flagWidth = stripDepth * 1.05;
  const flagHeight = poleHeight * 0.42;
  const flagThickness = 0.01;
  // Flag flies toward +x (outward along the strip), its inner edge touching
  // the pole.
  const flagCenterX = baseX + poleRadius + flagWidth / 2;
  const flagCenterY = baseY + poleHeight - flagHeight / 2 - 0.01;

  return (
    <group>
      {/* Base cap — disc that grounds the pole on the strip */}
      <mesh position={[baseX, baseY + 0.008, baseZ]} castShadow>
        <cylinderGeometry args={[poleRadius * 1.8, poleRadius * 1.8, 0.016, 10]} />
        <meshStandardMaterial color="#1a120a" roughness={0.75} />
      </mesh>

      {/* Pole */}
      <mesh position={[baseX, baseY + poleHeight / 2, baseZ]} castShadow>
        <cylinderGeometry args={[poleRadius, poleRadius, poleHeight, 8]} />
        <meshStandardMaterial color="#3b2b18" roughness={0.6} />
      </mesh>

      {/* Pennant — rectangular flag in the owner's color */}
      <mesh position={[flagCenterX, flagCenterY, baseZ]} castShadow>
        <boxGeometry args={[flagWidth, flagHeight, flagThickness]} />
        <meshStandardMaterial
          color={color}
          transparent={mortgaged}
          opacity={mortgaged ? 0.35 : 1}
          roughness={0.5}
          side={2}
        />
      </mesh>

      {/* Finial — small sphere on top of the pole */}
      <mesh position={[baseX, baseY + poleHeight + poleRadius, baseZ]} castShadow>
        <sphereGeometry args={[poleRadius * 1.6, 10, 8]} />
        <meshStandardMaterial color="#c9a96b" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}
