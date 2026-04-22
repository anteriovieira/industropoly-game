import { useEffect } from 'react';
import { useUiStore } from '@/state/uiStore';
import { useGameStore } from '@/state/gameStore';
import { IntroScreen } from './IntroScreen';
import { SetupScreen } from './SetupScreen';
import { GameScreen } from './GameScreen';
import { SummaryScreen } from './SummaryScreen';
import { OnlineLobbyScreen } from './online/OnlineLobbyScreen';
import { RoomLobbyScreen } from './online/RoomLobbyScreen';
import { OnlineGameContainer } from './online/OnlineGameContainer';
import { ResumeDialog } from './ResumeDialog';
import { UpdatePill } from '@/components/UpdatePill';
import { load } from '@/lib/persist';
import { getExistingUserId } from '@/realtime/supabaseClient';
import { findActiveMembership } from '@/realtime/roomsApi';

export function AppRoot() {
  const phase = useUiStore((s) => s.phase);
  const setPhase = useUiStore((s) => s.setPhase);
  const setNotice = useUiStore((s) => s.setNotice);
  const notice = useUiStore((s) => s.notice);
  const loadState = useGameStore((s) => s.loadState);
  const setGameSource = useUiStore((s) => s.setGameSource);
  const setActiveRoomId = useUiStore((s) => s.setActiveRoomId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Resume into an active online room if the user has a live membership.
      try {
        const userId = await getExistingUserId();
        if (userId) {
          const membership = await findActiveMembership(userId);
          if (membership && !cancelled) {
            setGameSource('online');
            setActiveRoomId(membership.room.id);
            setPhase(membership.room.status === 'in_game' ? 'game' : 'online-room');
            return;
          }
        }
      } catch (e) {
        console.warn('online resume check failed', e);
      }
      if (cancelled) return;

      // 2. ?room=CODE share link wins over local hot-seat save so followers always
      //    reach the join step, even if this browser has an old local save.
      const urlCode = new URL(window.location.href).searchParams.get('room');
      if (urlCode) {
        setGameSource('online');
        setPhase('online-lobby');
        return;
      }

      // 3. Fall back to local hot-seat save, then intro.
      const { state, notice: n } = load();
      if (n) setNotice(n);
      if (state) {
        loadState(state);
        setPhase('boot'); // prompt resume
      } else {
        setPhase('intro');
      }
    })();
    return () => { cancelled = true; };
  }, [loadState, setPhase, setNotice, setGameSource, setActiveRoomId]);

  return (
    <>
      {phase === 'boot' && <ResumeDialog />}
      {phase === 'intro' && <IntroScreen />}
      {phase === 'online-lobby' && <OnlineLobbyScreen />}
      {phase === 'online-room' && <RoomLobbyScreen />}
      {phase === 'setup' && <SetupScreen />}
      {phase === 'game' && useUiStore.getState().gameSource === 'online' ? (
        <OnlineGameContainer />
      ) : phase === 'game' ? (
        <GameScreen />
      ) : null}
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
