import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';

/**
 * True in hot-seat (all seats share the device) and in online when it's the
 * local user's seat. False when online and someone else is acting.
 */
export function useIsMyTurn(): boolean {
  const gameSource = useUiStore((s) => s.gameSource);
  const mySeatIndex = useUiStore((s) => s.mySeatIndex);
  const activeIndex = useGameStore((s) => s.state?.activePlayerIndex);
  if (gameSource !== 'online') return true;
  if (mySeatIndex == null || activeIndex == null) return false;
  return mySeatIndex === activeIndex;
}
