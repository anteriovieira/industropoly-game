import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { INVENTION_CARDS } from '@/content/invention-cards';
import { EDICT_CARDS } from '@/content/edict-cards';

const INDEX = Object.fromEntries(
  [...INVENTION_CARDS, ...EDICT_CARDS].map((c) => [c.id, c] as const),
);

export function CardModal({ cardId }: { cardId: string }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const card = INDEX[cardId];
  if (!card) return null;
  return (
    <Modal
      title={card.title}
      onConfirm={() => dispatch({ type: 'APPLY_CARD' })}
      onClose={() => dispatch({ type: 'APPLY_CARD' })}
      confirmLabel="Aplicar"
      dismissible={false}
    >
      <em>
        {card.deck === 'invention' ? 'Painel de Invenções' : 'Edital Comunitário'} — {card.education.date}
      </em>
      <p style={{ margin: '10px 0', fontWeight: 500 }}>{card.effectText}</p>
      <strong>{card.education.title}</strong>
      <p style={{ margin: '0.5em 0 0.75em' }}>{card.education.blurb}</p>
      <small style={{ opacity: 0.75 }}>Fonte: {card.education.source}</small>
    </Modal>
  );
}
