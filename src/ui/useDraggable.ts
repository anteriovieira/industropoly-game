import { useCallback, useEffect, useRef, useState } from 'react';

export type DraggablePos = { x: number; y: number };

export interface DraggableHandlers {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
  onClickCapture: (e: React.MouseEvent<HTMLElement>) => void;
}

export interface UseDraggableResult {
  position: DraggablePos;
  isDragging: boolean;
  ref: React.RefObject<HTMLDivElement>;
  handlers: DraggableHandlers;
  reset: () => void;
}

function readPositions(storageKey: string): Record<string, DraggablePos> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, DraggablePos> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (
        v &&
        typeof v === 'object' &&
        typeof (v as DraggablePos).x === 'number' &&
        typeof (v as DraggablePos).y === 'number'
      ) {
        out[k] = { x: (v as DraggablePos).x, y: (v as DraggablePos).y };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writePositions(storageKey: string, positions: Record<string, DraggablePos>): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(positions));
  } catch {
    // ignore
  }
}

export function loadDraggablePosition(
  storageKey: string,
  id: string,
): DraggablePos | null {
  const all = readPositions(storageKey);
  return all[id] ?? null;
}

export function saveDraggablePosition(
  storageKey: string,
  id: string,
  pos: DraggablePos,
): void {
  const all = readPositions(storageKey);
  all[id] = pos;
  writePositions(storageKey, all);
}

export function clearDraggablePosition(storageKey: string, id: string): void {
  const all = readPositions(storageKey);
  if (id in all) {
    delete all[id];
    writePositions(storageKey, all);
  }
}

interface UseDraggableOptions {
  storageKey: string;
  id: string;
  defaultPos: DraggablePos;
  threshold?: number;
}

// Generic drag-with-localStorage hook. Apply `handlers` + `ref` to the element
// you want draggable, and style it with `position: absolute/fixed` using the
// returned `position`. Click suppression (via `onClickCapture`) prevents child
// buttons from firing when the gesture was a drag.
export function useDraggable({
  storageKey,
  id,
  defaultPos,
  threshold = 5,
}: UseDraggableOptions): UseDraggableResult {
  const [position, setPosition] = useState<DraggablePos>(
    () => loadDraggablePosition(storageKey, id) ?? defaultPos,
  );
  const [isDragging, setIsDragging] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    dragging: boolean;
    moved: boolean;
  } | null>(null);
  const positionRef = useRef(position);
  positionRef.current = position;

  const commit = useCallback(
    (next: DraggablePos) => {
      setPosition(next);
      saveDraggablePosition(storageKey, id, next);
    },
    [storageKey, id],
  );

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: positionRef.current.x,
      originY: positionRef.current.y,
      dragging: false,
      moved: false,
    };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = dragRef.current;
      if (!s) return;
      const dx = e.clientX - s.startClientX;
      const dy = e.clientY - s.startClientY;
      if (!s.dragging) {
        if (Math.hypot(dx, dy) < threshold) return;
        s.dragging = true;
        s.moved = true;
        setIsDragging(true);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      const w = ref.current?.offsetWidth ?? 100;
      const h = ref.current?.offsetHeight ?? 100;
      const nx = Math.max(0, Math.min(window.innerWidth - w, s.originX + dx));
      const ny = Math.max(0, Math.min(window.innerHeight - h, s.originY + dy));
      commit({ x: nx, y: ny });
    },
    [threshold, commit],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const s = dragRef.current;
    if (!s) return;
    if (s.dragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    dragRef.current = null;
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (dragRef.current?.moved) {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current.moved = false;
    }
  }, []);

  const reset = useCallback(() => {
    clearDraggablePosition(storageKey, id);
    setPosition(defaultPos);
  }, [storageKey, id, defaultPos]);

  // Re-clamp when the viewport shrinks so a saved off-screen position snaps back.
  useEffect(() => {
    function onResize(): void {
      const w = ref.current?.offsetWidth ?? 100;
      const h = ref.current?.offsetHeight ?? 100;
      const p = positionRef.current;
      const nx = Math.max(0, Math.min(window.innerWidth - w, p.x));
      const ny = Math.max(0, Math.min(window.innerHeight - h, p.y));
      if (nx !== p.x || ny !== p.y) commit({ x: nx, y: ny });
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [commit]);

  return {
    position,
    isDragging,
    ref,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
    },
    reset,
  };
}
