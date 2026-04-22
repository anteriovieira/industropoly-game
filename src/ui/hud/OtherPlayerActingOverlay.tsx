import { useGameStore } from '@/state/gameStore';
import { Parchment } from '@/ui/Parchment';
import { useIsMyTurn } from './useIsMyTurn';
import type { TurnPhase } from '@/engine/types';

const ACTION_LABELS: Record<TurnPhase, string> = {
  'awaiting-roll': 'vai lançar os dados',
  moving: 'está movendo o peão',
  'awaiting-quiz-answer': 'está respondendo a pergunta',
  'awaiting-land-action': 'está resolvendo a casa',
  'drawing-card': 'está comprando uma carta',
  'awaiting-end-turn': 'está finalizando o turno',
  'in-prison-decision': 'está decidindo na prisão',
  'game-over': 'fim de jogo',
};

export function OtherPlayerActingOverlay() {
  const state = useGameStore((s) => s.state);
  const isMyTurn = useIsMyTurn();

  if (!state || state.status !== 'active' || isMyTurn) return null;

  const active = state.players[state.activePlayerIndex];
  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 150,
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <Parchment
        padding="14px 22px"
        elevation="high"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          minWidth: 260,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#3a3',
            boxShadow: '0 0 0 0 rgba(58,170,58,0.7)',
            animation: 'ind-pulse 1.4s infinite',
          }}
        />
        <div style={{ lineHeight: 1.2 }}>
          <div className="ind-label" style={{ marginBottom: 2 }}>
            Aguardando
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--ink)' }}>
            {active.name} {ACTION_LABELS[state.turnPhase]}…
          </div>
        </div>
      </Parchment>
      <style>{`
        @keyframes ind-pulse {
          0%   { box-shadow: 0 0 0 0   rgba(58,170,58,0.7); }
          70%  { box-shadow: 0 0 0 10px rgba(58,170,58,0);   }
          100% { box-shadow: 0 0 0 0   rgba(58,170,58,0);   }
        }
      `}</style>
    </div>
  );
}
