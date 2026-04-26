import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { getTile } from '@/content/tiles';
import { activePlayer, playerById } from '@/engine/selectors';
import { PLAYER_COLORS } from '@/ui/theme';

export function RentModal({ tileId, owed }: { tileId: number; owed: number }) {
  const state = useGameStore((s) => s.state)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const tile = getTile(tileId);
  const o = state.tiles[tileId]!;
  const owner = o.owner ? playerById(state, o.owner) : null;
  const p = activePlayer(state);
  const canAfford = p.cash >= owed;

  return (
    <Modal
      title={`Aluguel devido em ${tile.name}`}
      actor={{
        name: p.name,
        color: PLAYER_COLORS[state.activePlayerIndex] ?? PLAYER_COLORS[0],
      }}
      onConfirm={() => dispatch({ type: 'ACK_MODAL' })}
      confirmLabel={canAfford ? `Pagar R$${owed}` : 'Quitar dívida'}
      dismissible={false}
    >
      <p>
        <strong>{owner?.name}</strong> é dono(a) de {tile.name}. {p.name} deve{' '}
        <strong>R${owed}</strong>.
      </p>
      <p>
        {p.name} tem R${p.cash} em caixa.
      </p>
      {!canAfford && (
        <p style={{ color: 'var(--danger)' }}>
          Dinheiro insuficiente — você será declarado(a) falido(a) se não conseguir liquidar o bastante.
        </p>
      )}
    </Modal>
  );
}
