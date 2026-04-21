import { useEffect } from 'react';
import { BoardScene } from '@/scene/BoardScene';
import { Hud } from '@/ui/Hud';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { TileInfoModal } from '@/ui/modals/TileInfoModal';
import { CardModal } from '@/ui/modals/CardModal';
import { RentModal } from '@/ui/modals/RentModal';
import { TaxModal } from '@/ui/modals/TaxModal';
import { PrisonModal } from '@/ui/modals/PrisonModal';
import { FactsJournal } from '@/ui/modals/FactsJournal';
import { activePlayer } from '@/engine/selectors';
import { save } from '@/lib/persist';

export function GameScreen() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const setPhase = useUiStore((s) => s.setPhase);
  const journalOpen = useUiStore((s) => s.journalOpen);
  const setJournalOpen = useUiStore((s) => s.setJournalOpen);

  // Autosave on state change
  useEffect(() => {
    if (!state) return;
    save(state);
    if (state.status === 'game-over') setPhase('summary');
  }, [state, setPhase]);

  // Auto-advance moving -> awaiting-land-action after a tick (dice animation time)
  useEffect(() => {
    if (!state) return;
    if (state.turnPhase === 'moving') {
      const t = setTimeout(() => dispatch({ type: 'RESOLVE_MOVEMENT' }), 1100);
      return () => clearTimeout(t);
    }
    if (state.turnPhase === 'awaiting-land-action') {
      // After a tiny settle delay, open landing modal.
      const t = setTimeout(() => dispatch({ type: 'RESOLVE_LANDING' }), 650);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [state, dispatch]);

  // Keyboard shortcuts.
  useEffect(() => {
    if (!state) return;
    function onKey(e: KeyboardEvent): void {
      if (!state) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const p = activePlayer(state);
      if (e.code === 'Space' && state.turnPhase === 'awaiting-roll' && !p.inPrison) {
        e.preventDefault();
        dispatch({ type: 'ROLL_DICE' });
      } else if (e.key.toLowerCase() === 'e' && state.turnPhase === 'awaiting-end-turn') {
        dispatch({ type: 'END_TURN' });
      } else if (e.key.toLowerCase() === 'b' && state.modal?.kind === 'tile-info') {
        dispatch({ type: 'BUY_TILE' });
      } else if (e.key.toLowerCase() === 'j') {
        setJournalOpen(true);
      } else if (e.key === 'Escape' && journalOpen) {
        setJournalOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, dispatch, journalOpen, setJournalOpen]);

  if (!state) return null;
  const m = state.modal;
  const inPrisonActive = activePlayer(state).inPrison && state.turnPhase === 'awaiting-roll';

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <BoardScene />
      </div>
      <Hud />
      {m?.kind === 'tile-info' && <TileInfoModal tileId={m.tileId} />}
      {m?.kind === 'card' && <CardModal cardId={m.cardId} />}
      {m?.kind === 'rent' && <RentModal tileId={m.tileId} owed={m.owed} />}
      {m?.kind === 'tax' && <TaxModal tileId={m.tileId} owed={m.owed} />}
      {inPrisonActive && <PrisonModal />}
      {journalOpen && <FactsJournal />}
    </div>
  );
}
