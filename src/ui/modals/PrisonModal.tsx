import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { activePlayer } from '@/engine/selectors';
import { PRISON_FEE } from '@/engine/types';

export function PrisonModal() {
  const state = useGameStore((s) => s.state)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const p = activePlayer(state);

  return (
    <Modal
      title="Prisão dos Devedores"
      dismissible={false}
      footer={
        <>
          <button onClick={() => dispatch({ type: 'PRISON_ROLL' })}>
            Lançar por dupla ({p.prisonRollsLeft} restantes)
          </button>
          {p.getOutCards > 0 && (
            <button onClick={() => dispatch({ type: 'USE_GET_OUT_CARD' })}>
              Usar Perdão Real
            </button>
          )}
          <button
            className="primary"
            disabled={p.cash < PRISON_FEE}
            onClick={() => dispatch({ type: 'PAY_PRISON_FEE' })}
          >
            Pagar £{PRISON_FEE}
          </button>
        </>
      }
    >
      <p>
        <strong>{p.name}</strong> está na Prisão dos Devedores. Escolha uma forma de escapar:
      </p>
      <ul>
        <li>Lançar uma dupla — até {p.prisonRollsLeft} tentativas nesta permanência.</li>
        <li>Usar uma carta de Perdão Real — você possui {p.getOutCards}.</li>
        <li>Pagar a taxa de £{PRISON_FEE} de uma vez.</li>
      </ul>
    </Modal>
  );
}
