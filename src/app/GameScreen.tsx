import { useEffect } from 'react';
import { BoardScene } from '@/scene/BoardScene';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import { Hud } from '@/ui/Hud';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { TileInfoModal } from '@/ui/modals/TileInfoModal';
import { CardModal } from '@/ui/modals/CardModal';
import { RentModal } from '@/ui/modals/RentModal';
import { TaxModal } from '@/ui/modals/TaxModal';
import { PrisonModal } from '@/ui/modals/PrisonModal';
import { QuestionModal } from '@/ui/modals/QuestionModal';
import { StoryModal } from '@/ui/modals/StoryModal';
import { FactsJournal } from '@/ui/modals/FactsJournal';
import { AcquisitionsModal } from '@/ui/modals/AcquisitionsModal';
import { CameraHint } from '@/ui/CameraHint';
import { activePlayer } from '@/engine/selectors';
import { save } from '@/lib/persist';
import { useGameAudio } from '@/lib/audioSideEffects';
import {
  DICE_TUMBLE_MS,
  DICE_SETTLE_BUFFER_MS,
  landingDelayMs,
  prefersReducedMotion,
} from '@/scene/animTiming';

export function GameScreen() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const setPhase = useUiStore((s) => s.setPhase);
  const journalOpen = useUiStore((s) => s.journalOpen);
  const setJournalOpen = useUiStore((s) => s.setJournalOpen);
  const storyOpen = useUiStore((s) => s.storyOpen);
  const setStoryOpen = useUiStore((s) => s.setStoryOpen);
  const acquisitionsOpen = useUiStore((s) => s.acquisitionsOpen);
  const setAcquisitionsOpen = useUiStore((s) => s.setAcquisitionsOpen);
  useGameAudio();

  // Autosave on state change
  useEffect(() => {
    if (!state) return;
    save(state);
    if (state.status === 'game-over') setPhase('summary');
  }, [state, setPhase]);

  // Auto-advance the moving -> awaiting-land-action -> landing pipeline.
  // The delays are tuned so the player actually *sees* the dice tumble and the
  // token hop every tile before any modal appears on top of the scene.
  useEffect(() => {
    if (!state) return;
    const reduced = prefersReducedMotion();
    if (state.turnPhase === 'moving') {
      // Wait for the dice tumble to settle before applying the movement to state.
      const delay = reduced ? 200 : DICE_TUMBLE_MS + DICE_SETTLE_BUFFER_MS;
      const t = setTimeout(() => dispatch({ type: 'RESOLVE_MOVEMENT' }), delay);
      return () => clearTimeout(t);
    }
    if (state.turnPhase === 'awaiting-land-action') {
      // Wait for the token to actually finish hopping across every tile.
      const steps = state.lastRoll?.total ?? 0;
      const delay = landingDelayMs(steps, reduced);
      const t = setTimeout(() => dispatch({ type: 'RESOLVE_LANDING' }), delay);
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
      } else if (e.key.toLowerCase() === 'c') {
        useUiStore.getState().resetCamera();
      } else if (e.key.toLowerCase() === 'i') {
        const active = activePlayer(state);
        dispatch({ type: 'OPEN_TILE_INFO', tileId: active.position });
      } else if (e.key === 'Escape' && journalOpen) {
        setJournalOpen(false);
      } else if (e.key === 'Escape' && storyOpen) {
        setStoryOpen(false);
      } else if (e.key === 'Escape' && acquisitionsOpen) {
        setAcquisitionsOpen(false);
      } else if (e.key.toLowerCase() === 'h') {
        setStoryOpen(!storyOpen);
      } else if (e.key.toLowerCase() === 'a') {
        const blocked =
          state.modal !== null || journalOpen || storyOpen || acquisitionsOpen;
        if (!blocked) setAcquisitionsOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    state,
    dispatch,
    journalOpen,
    setJournalOpen,
    storyOpen,
    setStoryOpen,
    acquisitionsOpen,
    setAcquisitionsOpen,
  ]);

  if (!state) return null;
  const m = state.modal;
  const inPrisonActive = activePlayer(state).inPrison && state.turnPhase === 'awaiting-roll';

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <SceneErrorBoundary>
        <div style={{ position: 'absolute', inset: 0 }}>
          <BoardScene />
        </div>
      </SceneErrorBoundary>
      <Hud />
      <CameraHint />
      {state.turnPhase === 'awaiting-quiz-answer' && state.currentQuiz && <QuestionModal />}
      {m?.kind === 'tile-info' && state.turnPhase !== 'awaiting-quiz-answer' && (
        <TileInfoModal tileId={m.tileId} readOnly={m.readOnly ?? false} />
      )}
      {m?.kind === 'card' && <CardModal cardId={m.cardId} />}
      {m?.kind === 'rent' && <RentModal tileId={m.tileId} owed={m.owed} />}
      {m?.kind === 'tax' && <TaxModal tileId={m.tileId} owed={m.owed} />}
      {inPrisonActive && <PrisonModal />}
      {journalOpen && <FactsJournal />}
      {storyOpen && <StoryModal />}
      {acquisitionsOpen && <AcquisitionsModal />}
    </div>
  );
}
