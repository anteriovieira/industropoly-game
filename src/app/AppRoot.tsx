import { useEffect } from 'react';
import { useUiStore } from '@/state/uiStore';
import { useGameStore } from '@/state/gameStore';
import { IntroScreen } from './IntroScreen';
import { SetupScreen } from './SetupScreen';
import { GameScreen } from './GameScreen';
import { SummaryScreen } from './SummaryScreen';
import { ResumeDialog } from './ResumeDialog';
import { UpdatePill } from '@/components/UpdatePill';
import { load } from '@/lib/persist';

export function AppRoot() {
  const phase = useUiStore((s) => s.phase);
  const setPhase = useUiStore((s) => s.setPhase);
  const setNotice = useUiStore((s) => s.setNotice);
  const notice = useUiStore((s) => s.notice);
  const loadState = useGameStore((s) => s.loadState);

  useEffect(() => {
    const { state, notice: n } = load();
    if (n) setNotice(n);
    if (state) {
      loadState(state);
      setPhase('boot'); // prompt resume
    } else {
      setPhase('intro');
    }
  }, [loadState, setPhase, setNotice]);

  return (
    <>
      {phase === 'boot' && <ResumeDialog />}
      {phase === 'intro' && <IntroScreen />}
      {phase === 'setup' && <SetupScreen />}
      {phase === 'game' && <GameScreen />}
      {phase === 'summary' && <SummaryScreen />}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fff2c8',
            color: '#2c1b0a',
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid #3b2b18',
            zIndex: 100,
          }}
          onClick={() => setNotice(null)}
        >
          {notice}
        </div>
      )}
      <UpdatePill />
    </>
  );
}
