import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { INVENTION_CARDS } from '@/content/invention-cards';
import { EDICT_CARDS } from '@/content/edict-cards';
import type { Card, CardEffect } from '@/engine/types';

const INDEX = Object.fromEntries(
  [...INVENTION_CARDS, ...EDICT_CARDS].map((c) => [c.id, c] as const),
);

// Classifies an effect so the UI can color the verdict panel and pick a
// button label that tells the player what pressing it will actually do.
type Tone = 'boon' | 'cost' | 'move' | 'neutral';

function tone(effect: CardEffect): Tone {
  switch (effect.kind) {
    case 'gain':
    case 'keep-get-out-of-prison':
      return 'boon';
    case 'pay':
    case 'pay-per-property':
      return 'cost';
    case 'collect-from-each':
      return 'boon';
    case 'go-to-prison':
      return 'cost';
    case 'move-to':
    case 'move-by':
      return 'move';
  }
}

function buttonLabel(effect: CardEffect): string {
  switch (effect.kind) {
    case 'gain':
      return `Receber R$${effect.amount}`;
    case 'pay':
      return `Pagar R$${effect.amount}`;
    case 'pay-per-property':
      return 'Pagar pelas propriedades';
    case 'collect-from-each':
      return `Cobrar R$${effect.amount} de cada jogador`;
    case 'go-to-prison':
      return 'Ir para a Prisão';
    case 'keep-get-out-of-prison':
      return 'Guardar a carta';
    case 'move-to':
    case 'move-by':
      return 'Partir';
  }
}

const TONE_STYLE: Record<Tone, { accent: string; soft: string; label: string }> = {
  boon: {
    accent: '#1f7a44',
    soft: 'rgba(31, 122, 68, 0.12)',
    label: 'Sorte do inventor',
  },
  cost: {
    accent: '#a12a1f',
    soft: 'rgba(161, 42, 31, 0.12)',
    label: 'Ônus do decreto',
  },
  move: {
    accent: '#8a6422',
    soft: 'rgba(201, 148, 58, 0.18)',
    label: 'Convocação',
  },
  neutral: {
    accent: '#3a2a1a',
    soft: 'rgba(58, 42, 26, 0.1)',
    label: 'Efeito',
  },
};

export function CardModal({ cardId }: { cardId: string }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const card: Card | undefined = INDEX[cardId];
  if (!card) return null;

  const deckName = card.deck === 'invention' ? 'Baralho de Invenções' : 'Baralho de Editais';
  const t = tone(card.effect);
  const style = TONE_STYLE[t];

  return (
    <Modal
      title={card.title}
      label={`Carta sacada · ${deckName}`}
      onConfirm={() => dispatch({ type: 'APPLY_CARD' })}
      onClose={() => dispatch({ type: 'APPLY_CARD' })}
      confirmLabel={buttonLabel(card.effect)}
      dismissible={false}
    >
      <div
        style={{
          padding: '14px 16px',
          border: `1px solid ${style.accent}`,
          borderLeft: `4px solid ${style.accent}`,
          borderRadius: 8,
          background: style.soft,
          boxShadow: 'inset 0 1px 0 rgba(250, 226, 160, 0.2)',
          marginBottom: 14,
        }}
      >
        <div className="ind-label" style={{ color: style.accent, marginBottom: 4 }}>
          {style.label} · {card.education.date}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.08rem',
            color: 'var(--ink)',
            lineHeight: 1.4,
          }}
        >
          {card.effectText}
        </div>
      </div>

      <div
        style={{
          padding: '12px 14px',
          border: '1px solid rgba(26, 14, 6, 0.3)',
          borderLeft: '3px solid #c9943a',
          borderRadius: 6,
          background:
            'linear-gradient(180deg, rgba(244, 230, 188, 0.55) 0%, rgba(232, 210, 160, 0.45) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(250, 226, 160, 0.3)',
        }}
      >
        <div className="ind-label" style={{ marginBottom: 4 }}>
          Contexto histórico
        </div>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.02rem' }}>
          {card.education.title}
        </strong>
        <p style={{ margin: '6px 0' }}>{card.education.blurb}</p>
        <small style={{ color: 'var(--ink-muted)', fontStyle: 'italic' }}>
          Fonte: {card.education.source}
        </small>
      </div>
    </Modal>
  );
}
