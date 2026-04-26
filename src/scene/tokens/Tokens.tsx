import { forwardRef, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { anchorForTile, tokenSlot } from '../layout';
import { HOP_DURATION_MS } from '../animTiming';
import { Token } from './tokenParts';
import { audio } from '@/lib/audio';
import type { Player, PlayerId } from '@/engine/types';

const PLAYER_COLORS = ['#e5624a', '#5aa0c8', '#b174c7', '#a8cf68'];
const REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const CELEBRATE_DURATION_MS = 1300; // ≤ 1.5s per spec

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
  const inner = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Group>(null);
  const pathRef = useRef<Waypoint[]>([]);
  const segmentStartRef = useRef<number>(0);
  const fromRef = useRef<Waypoint | null>(null);
  const lastKnownPos = useRef(player.position);
  const celebrateUntilRef = useRef<number>(0);

  // Count of tiles this player owns — used to detect a new purchase.
  const ownedCount = useGameStore((s) =>
    countOwned(s.state?.tiles ?? {}, player.id),
  );
  const prevOwnedRef = useRef<number>(ownedCount);

  // Signals to the landing-modal scheduler that this token is mid-flight.
  const setMovingTokenPlayerId = useUiStore((s) => s.setMovingTokenPlayerId);
  const focusCameraOnTile = useUiStore((s) => s.focusCameraOnTile);
  const isAnimatingRef = useRef(false);
  const isActivePlayer = useGameStore(
    (s) => s.state?.players[s.state.activePlayerIndex]?.id === player.id,
  );

  // Snap to the starting tile only once on mount. Subsequent position changes
  // are driven by the waypoint animation below — snapping here would teleport
  // the token to the destination and the hop would then animate backwards.
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current || !group.current) return;
    didInitRef.current = true;
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
      if (waypoints.length > 0) {
        isAnimatingRef.current = true;
        setMovingTokenPlayerId(player.id);
        // Pan the camera toward the destination so the player can see where
        // their token is heading. Only the active player's move pulls focus —
        // others would be jarring.
        if (isActivePlayer) focusCameraOnTile(player.position);
      }
    }

    lastKnownPos.current = player.position;
  }, [player.position, slot, player.id, setMovingTokenPlayerId, focusCameraOnTile, isActivePlayer]);

  // Trigger celebration when this player's owned-tiles count increases.
  // Under reduced-motion, skip the visual flourish entirely (the audio cue from
  // `audioSideEffects` still plays, so the acquisition is still felt).
  useEffect(() => {
    if (ownedCount > prevOwnedRef.current && !REDUCED_MOTION) {
      celebrateUntilRef.current = performance.now() + CELEBRATE_DURATION_MS;
    }
    prevOwnedRef.current = ownedCount;
  }, [ownedCount]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;

    // Progress along the movement path, if any.
    const path = pathRef.current;
    const from = fromRef.current;
    if (path.length > 0 && from) {
      const next = path[0];
      if (next) {
        const dur = HOP_DURATION_MS;
        const elapsed = performance.now() - segmentStartRef.current;
        const t = Math.min(1, elapsed / dur);
        const x = from.x + (next.x - from.x) * t;
        const z = from.z + (next.z - from.z) * t;
        const hop = Math.sin(t * Math.PI) * 0.35;
        g.position.set(x, 0.15 + hop, z);
        const dx = next.x - from.x;
        const dz = next.z - from.z;
        if (dx !== 0 || dz !== 0) g.rotation.y = Math.atan2(dx, dz);

        if (t >= 1) {
          fromRef.current = next;
          path.shift();
          pathRef.current = path;
          segmentStartRef.current = performance.now();
          if (path.length > 0) {
            audio.play('hop');
          } else if (isAnimatingRef.current) {
            isAnimatingRef.current = false;
            setMovingTokenPlayerId(null);
          }
        }
      }
    }

    // Celebration overlay — big hop + spin + steam puff, applied on top of the
    // current position (does NOT fight the pathing math because it lives on the
    // inner group).
    const now = performance.now();
    const remaining = celebrateUntilRef.current - now;
    const celebrating = remaining > 0;
    if (inner.current) {
      if (celebrating) {
        const t = 1 - remaining / CELEBRATE_DURATION_MS; // 0 → 1
        const jumpHeight = Math.sin(t * Math.PI) * 0.9; // up and back down
        inner.current.position.y = jumpHeight;
        inner.current.rotation.y = t * Math.PI * 2; // full spin
      } else {
        inner.current.position.y = 0;
        inner.current.rotation.y = 0;
      }
    }
    if (steamRef.current) {
      steamRef.current.visible = celebrating;
      if (celebrating) {
        const t = 1 - remaining / CELEBRATE_DURATION_MS;
        steamRef.current.position.y = 0.6 + t * 1.2;
        const scale = 0.4 + t * 0.9;
        steamRef.current.scale.setScalar(scale);
        const puffs = steamRef.current.children as THREE.Mesh[];
        for (const m of puffs) {
          const mat = m.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, 0.55 * (1 - t));
        }
      }
    }
  });

  return (
    <group ref={group}>
      <group ref={inner}>
        <Token kind={player.token} color={color} scale={1.05} animate={!REDUCED_MOTION} />
      </group>
      <SteamPuff ref={steamRef} />
    </group>
  );
}

// A small cluster of three translucent puff spheres. Hidden until celebrating.
const SteamPuff = forwardRef<THREE.Group>(function SteamPuff(_props, ref) {
  const mats = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.MeshBasicMaterial({
            color: '#f5e7c2',
            transparent: true,
            opacity: 0,
            depthWrite: false,
          }),
      ),
    [],
  );
  return (
    <group ref={ref} visible={false} position={[0, 0.6, 0]}>
      <mesh material={mats[0]} position={[0, 0, 0]}>
        <sphereGeometry args={[0.18, 12, 10]} />
      </mesh>
      <mesh material={mats[1]} position={[0.15, 0.08, 0.02]}>
        <sphereGeometry args={[0.14, 12, 10]} />
      </mesh>
      <mesh material={mats[2]} position={[-0.13, 0.12, -0.04]}>
        <sphereGeometry args={[0.13, 12, 10]} />
      </mesh>
    </group>
  );
});

function countOwned(tiles: Record<number, { owner: PlayerId | null }>, id: PlayerId): number {
  let n = 0;
  for (const k in tiles) if (tiles[k]!.owner === id) n += 1;
  return n;
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
