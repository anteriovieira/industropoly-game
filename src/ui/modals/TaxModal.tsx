import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { getTile } from '@/content/tiles';
import { activePlayer } from '@/engine/selectors';

export function TaxModal({ tileId, owed }: { tileId: number; owed: number }) {
  const state = useGameStore((s) => s.state)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const tile = getTile(tileId);
  const p = activePlayer(state);
  return (
    <Modal
      title={tile.name}
      onConfirm={() => dispatch({ type: 'ACK_MODAL' })}
      confirmLabel={`Pagar R$${owed}`}
      dismissible={false}
    >
      <em>{tile.education.date}</em>
      <strong style={{ display: 'block', marginTop: 8 }}>{tile.education.title}</strong>
      <p style={{ margin: '0.5em 0' }}>{tile.education.blurb}</p>
      <small style={{ opacity: 0.75 }}>Fonte: {tile.education.source}</small>
      <p style={{ marginTop: 16 }}>
        <strong>{p.name}</strong> deve pagar R${owed}.
      </p>
    </Modal>
  );
}
