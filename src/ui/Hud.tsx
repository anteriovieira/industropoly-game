import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { Parchment } from './Parchment';
import { Minimap } from './Minimap';
import { Modal } from './modals/Modal';
import { HudMenu } from './HudMenu';
import { useDraggable, type DraggablePos } from './useDraggable';
import { activePlayer, playerHoldings } from '@/engine/selectors';
import { audio } from '@/lib/audio';
import { clear as clearSave } from '@/lib/persist';
import {
  isShakeSupported,
  requestShakePermission,
  useShakeToRoll,
} from '@/lib/shake';
import type { GameState, Player, PlayerId, TurnPhase } from '@/engine/types';
import { PLAYER_COLORS, sectorPalette } from './theme';

const SHAKE_PREF_KEY = 'industropoly:shakeToRoll';
const HUD_LAYOUT_KEY = 'industropoly:hudLayout';
const CARD_DEFAULT_WIDTH = 180;
const CARD_DEFAULT_GAP = 12;
const MINIMAP_APPROX_SIZE = 140;

function loadShakePref(): boolean {
  try {
    return localStorage.getItem(SHAKE_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

function saveShakePref(enabled: boolean): void {
  try {
    localStorage.setItem(SHAKE_PREF_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

function defaultCardPos(index: number): DraggablePos {
  return { x: 16 + index * (CARD_DEFAULT_WIDTH + CARD_DEFAULT_GAP), y: 16 };
}

function defaultMinimapPos(): DraggablePos {
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  return { x: 16, y: Math.max(16, vh - 96 - MINIMAP_APPROX_SIZE) };
}

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
  const openAcquisitionsForPlayer = useUiStore((s) => s.openAcquisitionsForPlayer);
  const setPhase = useUiStore((s) => s.setPhase);
  const setNotice = useUiStore((s) => s.setNotice);
  const resetCamera = useUiStore((s) => s.resetCamera);
  const [confirmingQuit, setConfirmingQuit] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<PlayerId>>(new Set());
  const [shakeEnabled, setShakeEnabled] = useState<boolean>(loadShakePref);
  const shakeSupported = isShakeSupported();

  const minimapDefault = useMemo(() => defaultMinimapPos(), []);
  const minimapDrag = useDraggable({
    storageKey: HUD_LAYOUT_KEY,
    id: 'minimap',
    defaultPos: minimapDefault,
  });

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

  // Refs that the shake listener reads on every devicemotion event. Declared
  // before the early-return so hook order stays consistent across renders.
  const rollReadyRef = useRef(false);
  const handleRollRef = useRef<() => void>(() => {});

  useShakeToRoll(shakeEnabled, () => {
    if (!rollReadyRef.current) return;
    handleRollRef.current();
  });

  // If the user previously enabled shake on a device that needs permission
  // (iOS), the permission doesn't survive reload — silently downgrade so the
  // button reflects reality and we don't claim shake is on when it isn't.
  useEffect(() => {
    if (!shakeEnabled || !shakeSupported) return;
    const ctor = window.DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof ctor.requestPermission === 'function') {
      setShakeEnabled(false);
      saveShakePref(false);
    }
  }, [shakeEnabled, shakeSupported]);

  async function toggleShake(): Promise<void> {
    audio.play('click');
    if (!shakeSupported) {
      setNotice('Este dispositivo não suporta detecção de chacoalhar.');
      return;
    }
    if (shakeEnabled) {
      setShakeEnabled(false);
      saveShakePref(false);
      return;
    }
    const result = await requestShakePermission();
    if (result === 'granted') {
      setShakeEnabled(true);
      saveShakePref(true);
      setNotice('Chacoalhe o tablet para lançar os dados.');
    } else if (result === 'denied') {
      setNotice('Permissão de movimento negada. Ative nas configurações do navegador.');
    } else {
      setNotice('Este dispositivo não suporta detecção de chacoalhar.');
    }
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

  // Who rolls next after the current turn ends. Respects the doubles rule:
  // on an unbroken doubles streak (not in prison, streak < 3), the same
  // player rolls again instead of advancing.
  function computeNextRoller(): Player {
    const doublesAgain =
      !!state!.lastRoll?.doubles &&
      !active.inPrison &&
      active.doublesStreak > 0 &&
      active.doublesStreak < 3;
    if (doublesAgain) return active;
    let idx = state!.activePlayerIndex;
    for (let i = 0; i < state!.players.length; i++) {
      idx = (idx + 1) % state!.players.length;
      const p = state!.players[idx]!;
      if (!p.bankrupt) return p;
    }
    return active;
  }
  const nextRoller = computeNextRoller();
  const samePlayerAgain = nextRoller.id === active.id && phase === 'awaiting-end-turn';
  const canRollButton = canRoll || canEnd;

  function handleRoll(): void {
    if (canEnd) {
      dispatch({ type: 'END_TURN' });
      // After END_TURN the next roller is the active player. Auto-roll for
      // them unless they're in prison — in that case the reducer would
      // reject ROLL_DICE and the prison-decision UI takes over.
      if (!nextRoller.inPrison) {
        dispatch({ type: 'ROLL_DICE' });
      }
    } else if (canRoll) {
      dispatch({ type: 'ROLL_DICE' });
    }
  }

  const rollLabel = canEnd
    ? samePlayerAgain
      ? `Lançar de novo (E)`
      : `Lançar → ${nextRoller.name} (E)`
    : 'Lançar (Espaço)';

  // Keep refs in sync each render so the shake listener (attached once per
  // enable/disable cycle) always observes current phase state without needing
  // to re-subscribe on every dispatch.
  rollReadyRef.current = canRollButton;
  handleRollRef.current = handleRoll;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
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
            openAcquisitionsForPlayer(p.id);
          }}
          state={state}
          defaultPos={defaultCardPos(i)}
        />
      ))}

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

      {/* Minimap — draggable. Hidden on very narrow screens (see .minimap-root
          media query in global.css) rather than shrunk below legibility. */}
      <div
        ref={minimapDrag.ref}
        onPointerDown={minimapDrag.handlers.onPointerDown}
        onPointerMove={minimapDrag.handlers.onPointerMove}
        onPointerUp={minimapDrag.handlers.onPointerUp}
        onPointerCancel={minimapDrag.handlers.onPointerCancel}
        onClickCapture={minimapDrag.handlers.onClickCapture}
        style={{
          position: 'absolute',
          left: minimapDrag.position.x,
          top: minimapDrag.position.y,
          pointerEvents: 'auto',
          cursor: minimapDrag.isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          zIndex: minimapDrag.isDragging ? 10 : undefined,
          filter: minimapDrag.isDragging
            ? 'drop-shadow(0 12px 20px rgba(0,0,0,0.45))'
            : undefined,
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
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        <Parchment padding="6px 14px" style={{ minWidth: 220, alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {canEnd && !samePlayerAgain ? (
              <>
                <div style={{ fontFamily: 'var(--font-display)', lineHeight: 1.15 }}>
                  Próximo: {nextRoller.name}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.15 }}>
                  Turno {state.turn} concluído · {active.name}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-display)', lineHeight: 1.15 }}>
                  Turno {state.turn} — {active.name}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.15 }}>
                  {canEnd && samePlayerAgain
                    ? 'Dupla! Mesmo jogador lança de novo'
                    : `Fase: ${PHASE_LABELS[phase]}`}
                </div>
              </>
            )}
          </div>
        </Parchment>
        <button
          className="primary"
          disabled={!canRollButton}
          onClick={handleRoll}
          aria-label={rollLabel}
        >
          {rollLabel}
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
        <HudMenu
          shakeSupported={shakeSupported}
          shakeEnabled={shakeEnabled}
          onOpenJournal={() => setJournalOpen(true)}
          onOpenStory={() => setStoryOpen(true)}
          onOpenAcquisitions={() => setAcquisitionsOpen(true)}
          onResetCamera={() => resetCamera()}
          onToggleShake={() => {
            void toggleShake();
          }}
          onRequestQuit={() => setConfirmingQuit(true)}
        />
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
  defaultPos: DraggablePos;
}

function PlayerCard({
  player,
  color,
  isActive,
  expanded,
  onToggle,
  onOpenDetails,
  state,
  defaultPos,
}: PlayerCardProps) {
  const holdings = expanded ? playerHoldings(state, player.id) : null;
  const { position, isDragging, ref, handlers } = useDraggable({
    storageKey: HUD_LAYOUT_KEY,
    id: `player:${player.id}`,
    defaultPos,
  });

  return (
    <div
      ref={ref}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
      onClickCapture={handlers.onClickCapture}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        pointerEvents: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: isDragging ? 10 : undefined,
      }}
    >
    <Parchment
      padding="10px 14px"
      style={{
        minWidth: expanded ? 220 : 160,
        maxWidth: expanded ? 260 : undefined,
        opacity: player.bankrupt ? 0.45 : 1,
        border: isActive ? `2px solid ${color}` : '1px solid rgba(59,43,24,0.4)',
        transition: 'min-width 120ms ease',
        boxShadow: isDragging
          ? '0 12px 32px rgba(0,0,0,0.45), inset 0 0 60px rgba(121,85,42,0.25)'
          : undefined,
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
                <span>{holdings.totals.tileCount} propriedades</span>
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
    </div>
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
