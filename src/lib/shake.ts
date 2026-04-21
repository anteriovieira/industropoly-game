import { useEffect, useRef } from 'react';

type IOSDeviceMotionEvent = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

export type ShakePermission = 'granted' | 'denied' | 'unsupported';

export function isShakeSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

// iOS 13+ requires an explicit permission request triggered by a user gesture.
// On Android/desktop the API is either always available or always missing —
// in those cases we report 'granted' / 'unsupported' without prompting.
export async function requestShakePermission(): Promise<ShakePermission> {
  if (!isShakeSupported()) return 'unsupported';
  const ctor = window.DeviceMotionEvent as IOSDeviceMotionEvent;
  if (typeof ctor.requestPermission !== 'function') return 'granted';
  try {
    const result = await ctor.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

interface ShakeOptions {
  // Magnitude threshold in m/s² above which a peak counts as a shake.
  // ~15 is a brisk wrist flick; raising it reduces false positives.
  threshold?: number;
  // Minimum gap between fired shakes, in ms. Prevents one physical shake
  // (which produces several peaks) from triggering multiple rolls.
  cooldownMs?: number;
}

export function useShakeToRoll(
  enabled: boolean,
  onShake: () => void,
  options: ShakeOptions = {},
): void {
  const { threshold = 18, cooldownMs = 900 } = options;
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  useEffect(() => {
    if (!enabled || !isShakeSupported()) return;

    let lastFire = 0;

    function handle(event: DeviceMotionEvent): void {
      // Prefer linear acceleration (gravity excluded) so a still tablet on a
      // table reads ~0. Fall back to accelerationIncludingGravity minus 9.8
      // when the device only exposes the latter (older Android browsers).
      const a = event.acceleration;
      let magnitude: number;
      if (a && a.x != null && a.y != null && a.z != null) {
        magnitude = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      } else {
        const g = event.accelerationIncludingGravity;
        if (!g || g.x == null || g.y == null || g.z == null) return;
        const m = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z);
        magnitude = Math.abs(m - 9.81);
      }

      if (magnitude < threshold) return;
      const now = performance.now();
      if (now - lastFire < cooldownMs) return;
      lastFire = now;
      onShakeRef.current();
    }

    window.addEventListener('devicemotion', handle);
    return () => window.removeEventListener('devicemotion', handle);
  }, [enabled, threshold, cooldownMs]);
}
