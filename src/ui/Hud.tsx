import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { Parchment } from './Parchment';
import { activePlayer } from '@/engine/selectors';
import type { TurnPhase } from '@/engine/types';

const PLAYER_COLORS = ['#8a2a1b', '#1f3e52', '#5a2a68', '#6b8e4e'];

const PHASE_LABELS: Record<TurnPhase, string> = {
  'awaiting-roll': 'aguardando lançamento',
  moving: 'movendo-se',
  'awaiting-land-action': 'resolvendo casa',
  'drawing-card': 'comprando carta',
  'awaiting-end-turn': 'aguardando fim do turno',
  'in-prison-decision': 'decisão na prisão',
  'game-over': 'fim de jogo',
};

export function Hud() {
  const state = useGameStore((s) => s.state)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const setJournalOpen = useUiStore((s) => s.setJournalOpen);

  const active = activePlayer(state);
  const phase = state.turnPhase;
  const canRoll = phase === 'awaiting-roll' && !active.inPrison;
  const canResolveMove = phase === 'moving';
  const canLand = phase === 'awaiting-land-action';
  const canEnd = phase === 'awaiting-end-turn' && state.pendingLandingResolved;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          display: 'flex',
          gap: 12,
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        {state.players.map((p, i) => (
          <Parchment
            key={p.id}
            padding="10px 14px"
            style={{
              minWidth: 150,
              opacity: p.bankrupt ? 0.45 : 1,
              border:
                p.id === active.id
                  ? `2px solid ${PLAYER_COLORS[i]}`
                  : '1px solid rgba(59,43,24,0.4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 10,
                  background: PLAYER_COLORS[i],
                }}
              />
              {p.name}
            </div>
            <div style={{ fontSize: '0.9rem' }}>£{p.cash}</div>
            {p.inPrison && (
              <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Preso</div>
            )}
          </Parchment>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        <Parchment padding="10px 14px" style={{ minWidth: 240 }}>
          <div style={{ fontFamily: 'var(--font-display)' }}>
            Turno {state.turn} — {active.name}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Fase: {PHASE_LABELS[phase]}</div>
        </Parchment>
        <button
          className="primary"
          disabled={!canRoll}
          onClick={() => dispatch({ type: 'ROLL_DICE' })}
          aria-label="Lançar dados (Espaço)"
        >
          Lançar (Espaço)
        </button>
        <button
          disabled={!canResolveMove}
          onClick={() => dispatch({ type: 'RESOLVE_MOVEMENT' })}
        >
          Mover
        </button>
        <button disabled={!canLand} onClick={() => dispatch({ type: 'RESOLVE_LANDING' })}>
          Resolver casa
        </button>
        <button onClick={() => setJournalOpen(true)}>Diário (J)</button>
        <button
          className="primary"
          disabled={!canEnd}
          onClick={() => dispatch({ type: 'END_TURN' })}
          aria-label="Encerrar turno (E)"
        >
          Encerrar turno (E)
        </button>
      </div>

      {active.inPrison && phase === 'awaiting-roll' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto',
          }}
        >
          <Parchment padding={16} style={{ width: 260, textAlign: 'center' }}>
            <strong>{active.name} está na Prisão dos Devedores</strong>
            <div style={{ marginTop: 8 }}>
              Escolha uma opção de fuga nos controles abaixo.
            </div>
          </Parchment>
        </div>
      )}
    </div>
  );
}
