import { useState } from 'react';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { Parchment } from './Parchment';
import { MuteButton } from './MuteButton';
import { Modal } from './modals/Modal';
import { activePlayer } from '@/engine/selectors';
import { audio } from '@/lib/audio';
import { clear as clearSave } from '@/lib/persist';
import type { TurnPhase } from '@/engine/types';
import { PLAYER_COLORS } from './theme';

const PHASE_LABELS: Record<TurnPhase, string> = {
  'awaiting-roll': 'aguardando lançamento',
  moving: 'movendo-se',
  'awaiting-quiz-answer': 'respondendo pergunta',
  'awaiting-land-action': 'resolvendo casa',
  'drawing-card': 'comprando carta',
  'awaiting-end-turn': 'aguardando fim do turno',
  'in-prison-decision': 'decisão na prisão',
  'game-over': 'fim de jogo',
};

export function Hud() {
  const state = useGameStore((s) => s.state)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const clearStore = useGameStore((s) => s.clear);
  const setJournalOpen = useUiStore((s) => s.setJournalOpen);
  const setStoryOpen = useUiStore((s) => s.setStoryOpen);
  const setAcquisitionsOpen = useUiStore((s) => s.setAcquisitionsOpen);
  const setPhase = useUiStore((s) => s.setPhase);
  const resetCamera = useUiStore((s) => s.resetCamera);
  const [confirmingQuit, setConfirmingQuit] = useState(false);

  function quitGame(): void {
    clearSave();
    clearStore();
    setPhase('intro');
  }

  const active = activePlayer(state);
  const phase = state.turnPhase;
  const inQuiz = phase === 'awaiting-quiz-answer';
  const canRoll = phase === 'awaiting-roll' && !active.inPrison;
  const canResolveMove = phase === 'moving' && !inQuiz;
  const canLand = phase === 'awaiting-land-action';
  const canEnd = phase === 'awaiting-end-turn' && state.pendingLandingResolved;
  const canInfo = (phase === 'awaiting-roll' || phase === 'awaiting-end-turn') && !state.modal;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 180, // room for the quit button at top-right
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
            <div style={{ fontSize: '0.75rem', opacity: 0.75 }} title="Acertos / erros / dicas">
              ✓ {p.quizStats.correct} · ✗ {p.quizStats.wrong}
              {p.quizStats.hintsBought > 0 ? ` · 💡${p.quizStats.hintsBought}` : ''}
            </div>
            {p.inPrison && (
              <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Preso</div>
            )}
          </Parchment>
        ))}
      </div>

      {/* Quit-game button — top-right corner. */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={() => {
            audio.play('click');
            setConfirmingQuit(true);
          }}
          aria-label="Encerrar jogo"
          title="Encerrar jogo"
          style={{
            padding: '6px 10px',
            fontSize: '0.85rem',
            background: 'rgba(138, 42, 27, 0.85)',
            color: '#f3e7c1',
            border: '1px solid #3b2b18',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          ✕ Encerrar jogo
        </button>
      </div>

      {confirmingQuit && (
        <Modal
          title="Encerrar o jogo?"
          onClose={() => setConfirmingQuit(false)}
          footer={
            <>
              <button className="ghost" onClick={() => setConfirmingQuit(false)}>
                Continuar jogando
              </button>
              <button
                className="primary"
                onClick={() => {
                  setConfirmingQuit(false);
                  quitGame();
                }}
              >
                Encerrar
              </button>
            </>
          }
        >
          <p style={{ margin: 0 }}>
            O progresso atual será perdido e você voltará à tela inicial. Deseja continuar?
          </p>
        </Modal>
      )}

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
        <button
          disabled={!canInfo}
          onClick={() => {
            audio.play('click');
            dispatch({ type: 'OPEN_TILE_INFO', tileId: active.position });
          }}
          aria-label="Ver casa atual (I)"
          title="Ver casa atual (I)"
        >
          Info (I)
        </button>
        <button
          onClick={() => {
            audio.play('click');
            setJournalOpen(true);
          }}
        >
          Diário (J)
        </button>
        <button
          onClick={() => {
            audio.play('click');
            setStoryOpen(true);
          }}
          aria-label="Ler edição atual do jornal (H)"
          title="Ler edição atual do jornal (H)"
        >
          📰 Jornal (H)
        </button>
        <button
          onClick={() => {
            audio.play('click');
            setAcquisitionsOpen(true);
          }}
          aria-label="Ver aquisições (A)"
          title="Ver aquisições (A)"
        >
          Aquisições (A)
        </button>
        <button
          onClick={() => {
            audio.play('click');
            resetCamera();
          }}
          aria-label="Centralizar câmera (C)"
          title="Centralizar câmera (C)"
        >
          Centralizar (C)
        </button>
        <button
          className="primary"
          disabled={!canEnd}
          onClick={() => dispatch({ type: 'END_TURN' })}
          aria-label="Encerrar turno (E)"
        >
          Encerrar turno (E)
        </button>
        <MuteButton />
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
