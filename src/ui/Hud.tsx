import { useState } from 'react';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { Parchment } from './Parchment';
import { MuteButton } from './MuteButton';
import { Minimap } from './Minimap';
import { Modal } from './modals/Modal';
import { activePlayer, playerHoldings } from '@/engine/selectors';
import { audio } from '@/lib/audio';
import { clear as clearSave } from '@/lib/persist';
import type { GameState, Player, PlayerId, TurnPhase } from '@/engine/types';
import { PLAYER_COLORS, sectorPalette } from './theme';

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
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const clearStore = useGameStore((s) => s.clear);
  const setJournalOpen = useUiStore((s) => s.setJournalOpen);
  const setStoryOpen = useUiStore((s) => s.setStoryOpen);
  const setAcquisitionsOpen = useUiStore((s) => s.setAcquisitionsOpen);
  const setPhase = useUiStore((s) => s.setPhase);
  const resetCamera = useUiStore((s) => s.resetCamera);
  const [confirmingQuit, setConfirmingQuit] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<PlayerId>>(new Set());

  function toggleCard(id: PlayerId): void {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    audio.play('click');
  }

  function quitGame(): void {
    clearSave();
    setPhase('intro');
    clearStore();
  }

  if (!state) return null;
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
          <PlayerCard
            key={p.id}
            player={p}
            color={PLAYER_COLORS[i] ?? PLAYER_COLORS[0]!}
            isActive={p.id === active.id}
            expanded={expandedCards.has(p.id)}
            onToggle={() => toggleCard(p.id)}
            onOpenDetails={() => {
              audio.play('click');
              setAcquisitionsOpen(true);
            }}
            state={state}
          />
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

      {/* Minimap — bottom-left, above the control bar. Hidden on very narrow screens
          (see .minimap-root media query in global.css) rather than shrunk below legibility. */}
      <div
        style={{
          position: 'absolute',
          bottom: 96,
          left: 16,
          pointerEvents: 'auto',
        }}
      >
        <Minimap />
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

      {/* spacer */}
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

interface PlayerCardProps {
  player: Player;
  color: string;
  isActive: boolean;
  expanded: boolean;
  onToggle: () => void;
  onOpenDetails: () => void;
  state: GameState;
}

function PlayerCard({
  player,
  color,
  isActive,
  expanded,
  onToggle,
  onOpenDetails,
  state,
}: PlayerCardProps) {
  const holdings = expanded ? playerHoldings(state, player.id) : null;

  return (
    <Parchment
      padding="10px 14px"
      style={{
        minWidth: expanded ? 220 : 160,
        maxWidth: expanded ? 260 : undefined,
        opacity: player.bankrupt ? 0.45 : 1,
        border: isActive ? `2px solid ${color}` : '1px solid rgba(59,43,24,0.4)',
        transition: 'min-width 120ms ease',
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Recolher' : 'Expandir'} ficha de ${player.name}`}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          width: '100%',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: 10,
            background: color,
          }}
        />
        {player.name}
        <span
          aria-hidden="true"
          style={{
            marginLeft: 'auto',
            fontSize: '0.85rem',
            opacity: 0.6,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 120ms ease',
          }}
        >
          ▸
        </span>
      </button>

      <div style={{ fontSize: '0.9rem' }}>R${player.cash}</div>
      <div
        style={{ fontSize: '0.75rem', opacity: 0.75 }}
        title="Acertos / erros / dicas"
      >
        ✓ {player.quizStats.correct} · ✗ {player.quizStats.wrong}
        {player.quizStats.hintsBought > 0 ? ` · 💡${player.quizStats.hintsBought}` : ''}
      </div>
      {player.inPrison && (
        <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Preso</div>
      )}

      {expanded && holdings && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid rgba(59,43,24,0.25)',
            fontSize: '0.78rem',
          }}
        >
          {holdings.totals.tileCount === 0 ? (
            <em style={{ opacity: 0.7 }}>Sem aquisições.</em>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                  opacity: 0.85,
                }}
              >
                <span>{holdings.totals.tileCount} tiles</span>
                <span>R${holdings.totals.rentIncome}/turno</span>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                {holdings.industriesBySector.map((g) => (
                  <SectorChip
                    key={g.sector}
                    sector={g.sector}
                    owned={g.tiles.length}
                    total={g.sectorTotal}
                    monopoly={g.monopoly}
                  />
                ))}
                {holdings.transports.length > 0 && (
                  <CategoryChip
                    icon="🚂"
                    label="Transportes"
                    owned={holdings.transports.length}
                    total={4}
                  />
                )}
                {holdings.utilities.length > 0 && (
                  <CategoryChip
                    icon="⚡"
                    label="Utilidades"
                    owned={holdings.utilities.length}
                    total={2}
                  />
                )}
              </div>
            </>
          )}
          <button
            onClick={onOpenDetails}
            style={{
              marginTop: 8,
              all: 'unset',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: color,
              borderBottom: `1px dashed ${color}`,
            }}
          >
            Ver detalhes (A)
          </button>
        </div>
      )}
    </Parchment>
  );
}

function SectorChip({
  sector,
  owned,
  total,
  monopoly,
}: {
  sector: keyof typeof sectorPalette;
  owned: number;
  total: number;
  monopoly: boolean;
}) {
  const palette = sectorPalette[sector];
  const pct = total > 0 ? owned / total : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: 8,
          background: palette.base,
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {palette.label}
      </span>
      <span style={{ position: 'relative', width: 38, height: 4, background: 'rgba(59,43,24,0.18)', borderRadius: 2 }}>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: `${pct * 100}%`,
            background: palette.base,
            borderRadius: 2,
          }}
        />
      </span>
      <span style={{ minWidth: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {owned}/{total}
      </span>
      {monopoly && (
        <span
          aria-label="Monopólio"
          title="Monopólio"
          style={{ color: '#1f5c3e', fontSize: '0.85rem' }}
        >
          ★
        </span>
      )}
    </div>
  );
}

function CategoryChip({
  icon,
  label,
  owned,
  total,
}: {
  icon: string;
  label: string;
  owned: number;
  total: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span aria-hidden="true" style={{ width: 12, textAlign: 'center' }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ minWidth: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {owned}/{total}
      </span>
    </div>
  );
}
