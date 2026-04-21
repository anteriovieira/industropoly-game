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
  const pipSpacing = stripWidth / 5;

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

      {/* Tier pips — small cubes (houses) or one larger (hotel) */}
      {!mortgaged && pipCount > 0 && !isHotel && (
        <>
          {Array.from({ length: pipCount }).map((_, i) => {
            const xOffset = (i - (pipCount - 1) / 2) * pipSpacing;
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
        <mesh position={[0, pipY, pipZ]} castShadow>
          <boxGeometry args={[pipSize * 2.6, pipHeight * 1.3, pipSize * 1.1]} />
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
