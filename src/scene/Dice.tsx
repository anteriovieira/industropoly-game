import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type MutableRefObject,
} from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { activePlayer } from '@/engine/selectors';

// Physics-driven 3D dice with click-to-drag and double-click-to-roll.
// The engine is authoritative for the result; the visual sim integrates real
// gravity + bouncing for the first ~780 ms, then slerps the orientation to the
// target face over ~220 ms. Total budget is 1000 ms so the GameScreen movement
// scheduler stays in sync.

const ANIM_BUDGET_MS = 1000;
const SETTLE_MS = 140;
const PHYSICS_BUDGET_MS = ANIM_BUDGET_MS - SETTLE_MS;
// Soft alignment toward the target face. Crossfades in over the back portion
// of the physics budget so the cube is essentially on the target by the time
// it stops bouncing — eliminates the visible "snap" at settle time. Without
// this, free physics ends in a random orientation that the closing slerp has
// to undo all at once.
const ALIGN_START_RATIO = 0.25; // fraction of physics budget at which alignment begins
const ALIGN_RATE = 14; // per-second slerp rate at full strength (98% converged in ~0.28s)

const FALL_HEIGHT = 4.2; // drop start height above the rest plane
const REST_Y = 0.55; // sits a hair above the board surface
const DIE_SIZE = 0.7;
const PAIR_DX = 0.55;
const DRAG_BOUND = 8.5;

const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -REST_Y);

// Physics constants — units/s² for gravity. Scaled higher than 9.81 for snappy
// game feel; the dice should look like they fall on dense marble, not on cotton.
const GRAVITY = -52;
// Coefficient of restitution: each bounce keeps √(RESTITUTION) of the inbound
// velocity. 0.36 → ~3 visible bounces on this drop height before settling.
const RESTITUTION = 0.36;
// Tangential energy lost on impact (lateral velocity * GROUND_FRICTION after
// a bounce; spin damped by ANGULAR_BOUNCE_DAMPING).
const GROUND_FRICTION = 0.6;
const ANGULAR_BOUNCE_DAMPING = 0.55;
// Continuous air drag, expressed as a half-life in seconds. Lighter for
// linear motion (dice don't drift much), heavier for angular (spin bleeds off).
const AIR_LINEAR_HALF_LIFE = 0.7;
const AIR_ANGULAR_HALF_LIFE = 0.45;
// Bounce-back velocity below this is treated as "at rest" → triggers settle.
const STOP_VY = 1.0;
const STOP_ANG = 1.5; // rad/s

interface DiePhysics {
  startTime: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  q: THREE.Quaternion;
  // World-space angular velocity; magnitude is rad/s along the axis direction.
  angVel: THREE.Vector3;
  settled: boolean;
  settleStart: number | null;
  settleFromQ: THREE.Quaternion;
  settleFromPos: THREE.Vector3;
  targetQ: THREE.Quaternion;
}

interface DragState {
  pointerId: number;
  offset: THREE.Vector3;
  moved: boolean;
}

export function Dice() {
  const lastRoll = useGameStore((s) => s.state?.lastRoll ?? null);
  const turnPhase = useGameStore((s) => s.state?.turnPhase ?? null);
  const dispatch = useGameStore((s) => s.dispatch);
  const inPrison = useGameStore((s) => {
    const st = s.state;
    return st ? activePlayer(st).inPrison : false;
  });

  const canRoll = turnPhase === 'awaiting-roll' && !inPrison;

  function tryRoll(): void {
    if (canRoll) dispatch({ type: 'ROLL_DICE' });
  }

  const handleA = useRef<DieHandle | null>(null);
  const handleB = useRef<DieHandle | null>(null);

  return (
    <>
      <DraggableDie
        ref={handleA}
        defaultPos={[-PAIR_DX, REST_Y, 0]}
        face={lastRoll?.a ?? 1}
        rollNonce={lastRoll}
        onDoubleClick={tryRoll}
        getOther={() => handleB.current}
      />
      <DraggableDie
        ref={handleB}
        defaultPos={[PAIR_DX, REST_Y, 0]}
        face={lastRoll?.b ?? 1}
        rollNonce={lastRoll}
        onDoubleClick={tryRoll}
        getOther={() => handleA.current}
      />
    </>
  );
}

// Exposed by each DraggableDie so its sibling can resolve drag-time and
// physics-time collisions without lifting all positional state into the parent.
interface DieHandle {
  group: THREE.Group | null;
  restPos: MutableRefObject<THREE.Vector3>;
  isPhysicsActive: () => boolean;
  // Returns the live physics position vector if the sim is running, otherwise
  // the rest pose. Used by the sibling die during collision resolution.
  getLivePos: () => THREE.Vector3;
  // Velocity is needed when the sibling pushes us mid-flight so we can swap
  // momentum along the collision normal instead of just teleporting.
  getVel: () => THREE.Vector3 | null;
}

interface DraggableDieProps {
  defaultPos: [number, number, number];
  face: number;
  rollNonce: object | null;
  onDoubleClick: () => void;
  getOther: () => DieHandle | null;
}

const DraggableDie = forwardRef<DieHandle, DraggableDieProps>(function DraggableDie(
  { defaultPos, face, rollNonce, onDoubleClick, getOther },
  outerRef,
) {
  const groupRef = useRef<THREE.Group>(null);
  const physicsRef = useRef<DiePhysics | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const restPosRef = useRef<THREE.Vector3>(new THREE.Vector3(...defaultPos));
  const restQRef = useRef<THREE.Quaternion>(faceQuaternion(face));

  useImperativeHandle(
    outerRef,
    () => ({
      get group() {
        return groupRef.current;
      },
      restPos: restPosRef,
      isPhysicsActive: () => physicsRef.current !== null,
      getLivePos: () =>
        physicsRef.current ? physicsRef.current.pos : restPosRef.current,
      getVel: () => (physicsRef.current ? physicsRef.current.vel : null),
    }),
    [],
  );

  // Initial mount: snap the group transform to the default rest pose.
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.copy(restPosRef.current);
    g.quaternion.copy(restQRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New roll → start a new physics sim. Position re-anchors at current rest
  // (the user may have dragged the die mid-game; the next fall lands there).
  useEffect(() => {
    if (!rollNonce) return;
    physicsRef.current = startPhysics(restPosRef.current, face);
    if (dragRef.current) {
      dragRef.current = null;
      useUiStore.getState().setDiceDragging(false);
    }
  }, [rollNonce, face]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    if (dragRef.current) return;
    const phys = physicsRef.current;
    if (!phys) return;

    // Clamp dt so a stalled tab (huge delta on resume) doesn't tunnel the
    // die through the floor.
    const dt = Math.min(delta, 0.04);

    if (!phys.settled) {
      stepPhysics(phys, dt, restPosRef.current.y);
      // Resolve overlap against the sibling die so two falling cubes can't
      // tunnel through each other. Only nudges this die — the sibling does
      // the same on its own useFrame, so the pair separates symmetrically
      // over a frame or two.
      const other = getOther();
      if (other) {
        const otherPos = other.getLivePos();
        const otherVel = other.getVel();
        resolvePhysicsCollision(phys, otherPos, otherVel);
      }
      const elapsed = performance.now() - phys.startTime;
      // Force settle if we've eaten the entire physics budget — we MUST leave
      // SETTLE_MS for the closing slerp so total animation is bounded.
      if (!phys.settled && elapsed >= PHYSICS_BUDGET_MS) {
        beginSettle(phys);
      }
      g.position.copy(phys.pos);
      g.quaternion.copy(phys.q);
      return;
    }

    // Settle: slide the position back to the chosen rest spot and slerp the
    // orientation onto the closest yaw-variant of the target face quaternion.
    const elapsed = performance.now() - (phys.settleStart ?? performance.now());
    const t = Math.min(1, elapsed / SETTLE_MS);
    const e = easeOutCubic(t);
    g.position.lerpVectors(phys.settleFromPos, restPosRef.current, e);
    g.quaternion.slerpQuaternions(phys.settleFromQ, phys.targetQ, e);
    if (t >= 1) {
      g.position.copy(restPosRef.current);
      g.quaternion.copy(phys.targetQ);
      restQRef.current.copy(phys.targetQ);
      physicsRef.current = null;
    }
  });

  // ---- Pointer handlers ----

  function handlePointerDown(e: ThreeEvent<PointerEvent>): void {
    if (physicsRef.current) return;
    e.stopPropagation();
    const target = e.target as Element & { setPointerCapture?: (id: number) => void };
    target.setPointerCapture?.(e.pointerId);

    const hit = new THREE.Vector3();
    if (!e.ray.intersectPlane(DRAG_PLANE, hit)) return;
    const offset = restPosRef.current.clone().sub(hit);
    dragRef.current = { pointerId: e.pointerId, offset, moved: false };
    useUiStore.getState().setDiceDragging(true);
  }

  function handlePointerMove(e: ThreeEvent<PointerEvent>): void {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const hit = new THREE.Vector3();
    if (!e.ray.intersectPlane(DRAG_PLANE, hit)) return;
    const next = hit.add(drag.offset);
    next.x = clamp(next.x, -DRAG_BOUND, DRAG_BOUND);
    next.z = clamp(next.z, -DRAG_BOUND, DRAG_BOUND);
    next.y = REST_Y;
    // Resolve collision against the other die so the user can shove it around
    // instead of overlapping it. Skip resolution while the other die is
    // mid-physics (its position is animated by the sim, not the rest pose).
    const other = getOther();
    if (other && !other.isPhysicsActive()) {
      resolvePairCollision(next, other);
    }
    restPosRef.current.set(next.x, REST_Y, next.z);
    drag.moved = true;
    const g = groupRef.current;
    if (g) g.position.copy(restPosRef.current);
  }

  function handlePointerUp(e: ThreeEvent<PointerEvent>): void {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const target = e.target as Element & { releasePointerCapture?: (id: number) => void };
    target.releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
    useUiStore.getState().setDiceDragging(false);
  }

  function handleDoubleClick(e: ThreeEvent<MouseEvent>): void {
    if (dragRef.current?.moved) return;
    if (physicsRef.current) return;
    e.stopPropagation();
    onDoubleClick();
  }

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <DieMesh />
    </group>
  );
});

// 3D AABB collision resolution between this die's live physics state and the
// sibling. We only modify *this* die's pos and velocity — the sibling resolves
// the same overlap from its own perspective on its useFrame, which gives us
// equal-mass push-back without needing to mutate two physics structs from one
// frame. The reflected component is dampened so a bumped pair settles instead
// of bouncing off each other forever.
const DICE_RESTITUTION = 0.45;
function resolvePhysicsCollision(
  phys: DiePhysics,
  otherPos: THREE.Vector3,
  otherVel: THREE.Vector3 | null,
): void {
  const dx = phys.pos.x - otherPos.x;
  const dy = phys.pos.y - otherPos.y;
  const dz = phys.pos.z - otherPos.z;
  const overlapX = DIE_SIZE - Math.abs(dx);
  const overlapY = DIE_SIZE - Math.abs(dy);
  const overlapZ = DIE_SIZE - Math.abs(dz);
  if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) return;

  // Pick the axis with the smallest penetration — that's the natural separating
  // axis for two AABBs in contact.
  if (overlapX <= overlapY && overlapX <= overlapZ) {
    const dir = dx >= 0 ? 1 : -1;
    phys.pos.x += dir * overlapX * 0.5;
    const ov = otherVel ? otherVel.x : 0;
    if (Math.sign(phys.vel.x) !== dir) {
      phys.vel.x = (ov - phys.vel.x * DICE_RESTITUTION);
    }
  } else if (overlapY <= overlapZ) {
    const dir = dy >= 0 ? 1 : -1;
    phys.pos.y += dir * overlapY * 0.5;
    const ov = otherVel ? otherVel.y : 0;
    if (Math.sign(phys.vel.y) !== dir) {
      phys.vel.y = (ov - phys.vel.y * DICE_RESTITUTION);
    }
  } else {
    const dir = dz >= 0 ? 1 : -1;
    phys.pos.z += dir * overlapZ * 0.5;
    const ov = otherVel ? otherVel.z : 0;
    if (Math.sign(phys.vel.z) !== dir) {
      phys.vel.z = (ov - phys.vel.z * DICE_RESTITUTION);
    }
  }
}

// Axis-aligned XZ collision resolution between the dragged die (proposed pos
// in `next`) and the other die. If they overlap, push the other die along the
// shorter penetration axis. If the push would clip the bound, the dragged die
// stops short — the user can push the other die around but never through it.
function resolvePairCollision(next: THREE.Vector3, other: DieHandle): void {
  const otherPos = other.restPos.current;
  const dx = next.x - otherPos.x;
  const dz = next.z - otherPos.z;
  const overlapX = DIE_SIZE - Math.abs(dx);
  const overlapZ = DIE_SIZE - Math.abs(dz);
  if (overlapX <= 0 || overlapZ <= 0) return;
  if (overlapX < overlapZ) {
    const dir = dx >= 0 ? 1 : -1;
    const target = otherPos.x - dir * overlapX;
    const clamped = clamp(target, -DRAG_BOUND, DRAG_BOUND);
    const moved = otherPos.x - clamped;
    otherPos.x = clamped;
    if (other.group) other.group.position.x = clamped;
    const remaining = overlapX - Math.abs(moved);
    if (remaining > 1e-4) {
      next.x -= dir * remaining;
      next.x = clamp(next.x, -DRAG_BOUND, DRAG_BOUND);
    }
  } else {
    const dir = dz >= 0 ? 1 : -1;
    const target = otherPos.z - dir * overlapZ;
    const clamped = clamp(target, -DRAG_BOUND, DRAG_BOUND);
    const moved = otherPos.z - clamped;
    otherPos.z = clamped;
    if (other.group) other.group.position.z = clamped;
    const remaining = overlapZ - Math.abs(moved);
    if (remaining > 1e-4) {
      next.z -= dir * remaining;
      next.z = clamp(next.z, -DRAG_BOUND, DRAG_BOUND);
    }
  }
}

// ---- Physics simulation ----

function startPhysics(restPos: THREE.Vector3, face: number): DiePhysics {
  const startQ = randomTumbleQuaternion();
  // Initial drop with a slight horizontal drift so the cube doesn't fall along
  // a perfectly straight vertical line — that always reads as "fake".
  const driftMag = 0.45;
  // Angular velocity randomised in 8..16 rad/s on each axis with random sign.
  const spin = (): number => (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 8);
  return {
    startTime: performance.now(),
    pos: new THREE.Vector3(restPos.x, restPos.y + FALL_HEIGHT, restPos.z),
    vel: new THREE.Vector3(
      (Math.random() * 2 - 1) * driftMag,
      0,
      (Math.random() * 2 - 1) * driftMag,
    ),
    q: startQ.clone(),
    angVel: new THREE.Vector3(spin(), spin(), spin()),
    settled: false,
    settleStart: null,
    settleFromQ: startQ.clone(),
    settleFromPos: new THREE.Vector3(),
    targetQ: faceQuaternion(face),
  };
}

function stepPhysics(phys: DiePhysics, dt: number, floorY: number): void {
  // 1. Linear motion: gravity → velocity → position.
  phys.vel.y += GRAVITY * dt;
  phys.pos.x += phys.vel.x * dt;
  phys.pos.y += phys.vel.y * dt;
  phys.pos.z += phys.vel.z * dt;

  // 2. Continuous air drag (exponential decay using half-life).
  const linDecay = Math.pow(0.5, dt / AIR_LINEAR_HALF_LIFE);
  phys.vel.x *= linDecay;
  phys.vel.z *= linDecay;
  const angDecay = Math.pow(0.5, dt / AIR_ANGULAR_HALF_LIFE);
  phys.angVel.multiplyScalar(angDecay);

  // 3. Floor collision: invert vy with restitution, damp tangential + spin.
  if (phys.pos.y <= floorY) {
    phys.pos.y = floorY;
    if (phys.vel.y < 0) {
      phys.vel.y = -phys.vel.y * RESTITUTION;
      phys.vel.x *= GROUND_FRICTION;
      phys.vel.z *= GROUND_FRICTION;
      phys.angVel.multiplyScalar(ANGULAR_BOUNCE_DAMPING);
    }
    // Rest condition: bounce too weak to be visible AND spin nearly gone.
    if (phys.vel.y < STOP_VY && phys.angVel.length() < STOP_ANG) {
      beginSettle(phys);
      return;
    }
  }

  // 4. Angular integration: rotate the orientation by angVel * dt around its
  // axis. Pre-multiply so we apply the rotation in world space.
  const len = phys.angVel.length();
  if (len > 1e-6) {
    const axis = phys.angVel.clone().divideScalar(len);
    const dq = new THREE.Quaternion().setFromAxisAngle(axis, len * dt);
    phys.q.premultiply(dq);
  }

  // 5. Soft alignment toward the target face quaternion. Strength ramps
  // quadratically from 0 to 1 over the back (1 - ALIGN_START_RATIO) of the
  // physics budget — early frames are pure tumble, late frames bend the
  // orientation toward the rolled face. By the time bounces die out, the
  // cube is visually on the target, so the closing settle slerp has nothing
  // visible to do.
  const elapsedRatio =
    (performance.now() - phys.startTime) / PHYSICS_BUDGET_MS;
  if (elapsedRatio > ALIGN_START_RATIO) {
    const u = (elapsedRatio - ALIGN_START_RATIO) / (1 - ALIGN_START_RATIO);
    const strength = u * u;
    const slerpAmount = Math.min(1, strength * dt * ALIGN_RATE);
    const target = closestYawVariant(phys.q, phys.targetQ);
    phys.q.slerp(target, slerpAmount);
    // Strong angular damping during alignment — prevents residual spin from
    // fighting the alignment slerp and creating end-of-fall wobble.
    const dampHalfLife = 0.35 - 0.25 * strength; // 0.35s → 0.10s as strength → 1
    phys.angVel.multiplyScalar(Math.pow(0.5, dt / Math.max(0.05, dampHalfLife)));
  }
  phys.q.normalize();
}

function beginSettle(phys: DiePhysics): void {
  phys.settled = true;
  phys.settleStart = performance.now();
  phys.settleFromQ = phys.q.clone();
  phys.settleFromPos = phys.pos.clone();
  // Choose the yaw-rotated variant of the target face quaternion that's
  // closest to the current orientation. This keeps the closing slerp short
  // and removes the "sudden snap" feel.
  phys.targetQ = closestYawVariant(phys.q, phys.targetQ);
}

// All four 90°-yaw rotations of `targetQ` show the same face up. Pick the one
// nearest to `currentQ` (largest absolute dot product).
const _yawTmp = new THREE.Quaternion();
const _yawAxis = new THREE.Vector3(0, 1, 0);
function closestYawVariant(
  currentQ: THREE.Quaternion,
  targetQ: THREE.Quaternion,
): THREE.Quaternion {
  let best = targetQ.clone();
  let bestDot = -Infinity;
  for (let i = 0; i < 4; i++) {
    _yawTmp.setFromAxisAngle(_yawAxis, (i * Math.PI) / 2);
    const variant = _yawTmp.clone().multiply(targetQ);
    const d = Math.abs(variant.dot(currentQ));
    if (d > bestDot) {
      bestDot = d;
      best = variant;
    }
  }
  return best;
}

// ---- Mesh + materials ----

function DieMesh() {
  const mats = useMemo(() => [1, 2, 3, 4, 5, 6].map((n) => diePipsMaterial(n)), []);
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} />
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

// BoxGeometry material slots: 0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z.
// Materials assigned [pip 1..pip 6], so pip N is on face axis +X/-X/+Y/-Y/+Z/-Z.
// To bring face N to world +Y, rotate the cube so that axis points up.
const FACE_EULER: Record<number, [number, number, number]> = {
  1: [0, 0, Math.PI / 2], // +X → +Y
  2: [0, 0, -Math.PI / 2], // -X → +Y
  3: [0, 0, 0], // +Y already up
  4: [Math.PI, 0, 0], // -Y → +Y
  5: [-Math.PI / 2, 0, 0], // +Z → +Y
  6: [Math.PI / 2, 0, 0], // -Z → +Y
};

function faceQuaternion(face: number): THREE.Quaternion {
  const e = FACE_EULER[face] ?? FACE_EULER[1]!;
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(e[0], e[1], e[2]));
}

function randomTumbleQuaternion(): THREE.Quaternion {
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      Math.random() * Math.PI * 4,
      Math.random() * Math.PI * 4,
      Math.random() * Math.PI * 4,
    ),
  );
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
