import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { Tile } from '@/engine/types';
import { tileFaceTexture } from './tileFaceTexture';
import { tileSize, type TileAnchor } from './layout';
import { useUiStore } from '@/state/uiStore';

interface Props {
  tile: Tile;
  anchor: TileAnchor;
}

export function TileMesh({ tile, anchor }: Props) {
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
    </group>
  );
}
