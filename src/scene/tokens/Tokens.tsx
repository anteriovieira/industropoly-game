import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/state/gameStore';
import { anchorForTile, tokenSlot } from '../layout';
import { Token } from './tokenParts';
import type { Player } from '@/engine/types';

const PLAYER_COLORS = ['#8a2a1b', '#1f3e52', '#5a2a68', '#6b8e4e'];
const REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function Tokens() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;
  return (
    <group>
      {state.players.map((p, i) => (
        <PlayerToken key={p.id} player={p} slot={i} color={PLAYER_COLORS[i % 4]!} />
      ))}
    </group>
  );
}

interface Waypoint {
  x: number;
  z: number;
  atCorner: boolean;
}

function PlayerToken({ player, slot, color }: { player: Player; slot: number; color: string }) {
  const group = useRef<THREE.Group>(null);
  const pathRef = useRef<Waypoint[]>([]);
  const segmentStartRef = useRef<number>(0); // ms timestamp
  const fromRef = useRef<Waypoint | null>(null);
  const lastKnownPos = useRef(player.position);

  // Initial position: place immediately when mounted.
  useEffect(() => {
    if (!group.current) return;
    const a = anchorForTile(player.position);
    const s = tokenSlot(a, slot);
    group.current.position.set(s.x, 0.15, s.z);
  }, [slot, player.position]);

  // Build a waypoint path when position changes.
  useEffect(() => {
    if (lastKnownPos.current === player.position) return;
    const steps = stepsBetween(lastKnownPos.current, player.position);
    const waypoints: Waypoint[] = steps.map((tileId) => {
      const a = anchorForTile(tileId);
      const s = tokenSlot(a, slot);
      return { x: s.x, z: s.z, atCorner: a.isCorner };
    });

    if (REDUCED_MOTION) {
      const last = waypoints[waypoints.length - 1];
      if (last && group.current) {
        group.current.position.set(last.x, 0.15, last.z);
      }
      pathRef.current = [];
    } else {
      pathRef.current = waypoints;
      const startPos = group.current?.position;
      fromRef.current = startPos
        ? { x: startPos.x, z: startPos.z, atCorner: false }
        : waypoints[0] ?? null;
      segmentStartRef.current = performance.now();
    }

    lastKnownPos.current = player.position;
  }, [player.position, slot]);

  useFrame(() => {
    if (!group.current) return;
    const path = pathRef.current;
    if (path.length === 0) return;
    const next = path[0];
    const from = fromRef.current;
    if (!next || !from) return;
    const dur = 220; // ms per tile hop
    const elapsed = performance.now() - segmentStartRef.current;
    const t = Math.min(1, elapsed / dur);
    const x = from.x + (next.x - from.x) * t;
    const z = from.z + (next.z - from.z) * t;
    const hop = Math.sin(t * Math.PI) * 0.35;
    group.current.position.set(x, 0.15 + hop, z);
    // Face direction of travel
    const dx = next.x - from.x;
    const dz = next.z - from.z;
    if (dx !== 0 || dz !== 0) group.current.rotation.y = Math.atan2(dx, dz);

    if (t >= 1) {
      fromRef.current = next;
      path.shift();
      pathRef.current = path;
      segmentStartRef.current = performance.now();
    }
  });

  return (
    <group ref={group}>
      <Token kind={player.token} color={color} scale={1.05} animate={!REDUCED_MOTION} />
    </group>
  );
}

function stepsBetween(from: number, to: number): number[] {
  if (from === to) return [to];
  const forward: number[] = [];
  let pos = from;
  let safety = 0;
  while (pos !== to && safety++ < 40) {
    pos = (pos + 1) % 40;
    forward.push(pos);
  }
  return forward;
}
