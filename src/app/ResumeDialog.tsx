import { Modal } from '@/ui/modals/Modal';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { clear } from '@/lib/persist';

export function ResumeDialog() {
  const state = useGameStore((s) => s.state);
  const clearStore = useGameStore((s) => s.clear);
  const setPhase = useUiStore((s) => s.setPhase);
  if (!state) {
    setPhase('intro');
    return null;
  }
  return (
    <Modal
      title="Bem-vindo de volta"
      dismissible={false}
      footer={
        <>
          <button
            className="ghost"
            onClick={() => {
              clear();
              clearStore();
              setPhase('intro');
            }}
          >
            Novo Jogo
          </button>
          <button className="primary" onClick={() => setPhase('game')}>
            Retomar
          </button>
        </>
      }
    >
      <p>
        Há um jogo em andamento ({state.players.length} jogadores, turno {state.turn}).
      </p>
      <p>Deseja retomar de onde parou ou começar um novo?</p>
    </Modal>
  );
}
