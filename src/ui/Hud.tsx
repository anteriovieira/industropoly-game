import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { Parchment } from './Parchment';
import { InvestorBadge } from './InvestorBadge';
import { Minimap } from './Minimap';
import { Modal } from './modals/Modal';
import { HudMenu } from './HudMenu';
import { useDraggable, type DraggablePos } from './useDraggable';
import { activePlayer, playerHoldings } from '@/engine/selectors';
import { useIsMyTurn as isMyTurnFn } from './hud/useIsMyTurn';
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
const CARD_DEFAULT_WIDTH = 210;
const CARD_DEFAULT_GAP = 14;
const MINIMAP_APPROX_SIZE = 140;

const TOKEN_INITIAL: Record<string, string> = {
  locomotive: '🚂',
  'top-hat': '🎩',
  'cotton-bobbin': '🧵',
  pickaxe: '⛏',
  'pocket-watch': '⏱',
  'factory-chimney': '🏭',
};

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
  // Player cards start below the top-left menu button so they don't overlap.
  return { x: 16 + index * (CARD_DEFAULT_WIDTH + CARD_DEFAULT_GAP), y: 76 };
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
  const setHistoryOpen = useUiStore((s) => s.setHistoryOpen);
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
  const isMyTurn = isMyTurnFn();
  const canRoll = isMyTurn && phase === 'awaiting-roll' && !active.inPrison;
  const canEnd = isMyTurn && phase === 'awaiting-end-turn' && state.pendingLandingResolved;

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
      // Hot-seat: auto-roll for the next player (same device). Online: the next
      // player is on another device and will roll themselves — also, firing
      // ROLL_DICE here would race the server turn handover.
      const isOnline = useUiStore.getState().gameSource === 'online';
      if (!isOnline && !nextRoller.inPrison) {
        dispatch({ type: 'ROLL_DICE' });
      }
    } else if (canRoll) {
      dispatch({ type: 'ROLL_DICE' });
    }
  }

  const rollLabel = canEnd
    ? samePlayerAgain
      ? `Dupla! Lançar de novo (E)`
      : `Encerrar turno (E)`
    : 'Lançar dados (Espaço)';

  // Keep refs in sync each render so the shake listener (attached once per
  // enable/disable cycle) always observes current phase state without needing
  // to re-subscribe on every dispatch.
  rollReadyRef.current = canRollButton;
  handleRollRef.current = handleRoll;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      {/* Menu hamburger pinned to top-left, above the player cards. */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          pointerEvents: 'auto',
          zIndex: 5,
        }}
      >
        <HudMenu
          shakeSupported={shakeSupported}
          shakeEnabled={shakeEnabled}
          onOpenJournal={() => setJournalOpen(true)}
          onOpenStory={() => setStoryOpen(true)}
          onOpenAcquisitions={() => setAcquisitionsOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
          onResetCamera={() => resetCamera()}
          onToggleShake={() => {
            void toggleShake();
          }}
          onRequestQuit={() => setConfirmingQuit(true)}
        />
      </div>

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
          bottom: 18,
          left: 16,
          right: 16,
          display: 'flex',
          gap: 10,
          alignItems: 'stretch',
          justifyContent: 'center',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        <Parchment
          padding="8px 16px"
          elevation="high"
          style={{
            minWidth: 240,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {canEnd && !samePlayerAgain ? (
              <>
                <div className="ind-label" style={{ marginBottom: 2 }}>
                  Próximo lançamento
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.15rem',
                    lineHeight: 1.1,
                    color: 'var(--ink)',
                  }}
                >
                  {nextRoller.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', lineHeight: 1.2, marginTop: 2 }}>
                  Turno {state.turn} concluído por {active.name}
                </div>
              </>
            ) : (
              <>
                <div className="ind-label" style={{ marginBottom: 2 }}>
                  Turno {state.turn} · {PHASE_LABELS[phase]}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    lineHeight: 1.1,
                    color: 'var(--ink)',
                  }}
                >
                  {active.name}
                </div>
                {canEnd && samePlayerAgain && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--accent)',
                      lineHeight: 1.2,
                      marginTop: 2,
                      fontStyle: 'italic',
                    }}
                  >
                    Dupla! Mesmo jogador lança de novo
                  </div>
                )}
              </>
            )}
          </div>
        </Parchment>
        <button
          className="primary hero"
          disabled={!canRollButton}
          onClick={handleRoll}
          aria-label={rollLabel}
        >
          <span aria-hidden="true" style={{ marginRight: 8, fontSize: '1.1em' }}>🎲</span>
          {rollLabel}
        </button>
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

  const tokenGlyph = TOKEN_INITIAL[player.token] ?? '⚙';

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
        padding="10px 14px 12px"
        framed
        elevation={isDragging ? 'hero' : isActive ? 'high' : 'mid'}
        style={{
          minWidth: expanded ? 240 : 200,
          maxWidth: expanded ? 280 : undefined,
          opacity: player.bankrupt ? 0.45 : 1,
          transition: 'min-width var(--motion-base)',
          // Active-turn golden halo
          outline: isActive ? '2px solid rgba(250, 226, 160, 0.7)' : undefined,
          outlineOffset: isActive ? '2px' : undefined,
          filter: isActive
            ? 'drop-shadow(0 0 12px rgba(250, 226, 160, 0.35))'
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
            gap: 10,
            width: '100%',
          }}
        >
          {/* Brass-ringed token medallion */}
          <InvestorBadge
            color={color}
            label={tokenGlyph}
            size={42}
            active={isActive}
            engrave={false}
          />

          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.05rem',
                lineHeight: 1.1,
                color: 'var(--ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 0 rgba(250, 226, 160, 0.4)',
              }}
            >
              {player.name}
            </span>
            <span
              className="ind-tabular"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                lineHeight: 1.1,
                color: 'var(--copper)',
                textShadow: '0 1px 0 rgba(250, 226, 160, 0.4)',
              }}
            >
              R${player.cash}
            </span>
          </span>

          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: 4,
              background: 'rgba(26,14,6,0.15)',
              border: '1px solid rgba(26,14,6,0.4)',
              fontSize: '0.85rem',
              lineHeight: 1,
              color: 'rgba(26,14,6,0.9)',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform var(--motion-fast)',
              flexShrink: 0,
            }}
          >
            ▸
          </span>
        </button>

        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--ink-muted)',
            marginTop: 6,
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}
          title="Acertos / erros / dicas"
        >
          <span>✓ {player.quizStats.correct}</span>
          <span>✗ {player.quizStats.wrong}</span>
          {player.quizStats.hintsBought > 0 && (
            <span>💡 {player.quizStats.hintsBought}</span>
          )}
        </div>
        {player.inPrison && (
          <div
            style={{
              display: 'inline-block',
              marginTop: 6,
              fontSize: '0.7rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--danger)',
              padding: '2px 8px',
              border: '1px solid var(--danger)',
              borderRadius: 3,
              background: 'rgba(138, 42, 27, 0.1)',
            }}
          >
            Preso
          </div>
        )}

        {expanded && holdings && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid rgba(26,14,6,0.3)',
              fontSize: '0.78rem',
            }}
          >
            {holdings.totals.tileCount === 0 ? (
              <em style={{ color: 'var(--ink-muted)' }}>Sem aquisições.</em>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    color: 'var(--ink-soft)',
                  }}
                >
                  <span>{holdings.totals.tileCount} propriedades</span>
                  <span className="ind-tabular">R${holdings.totals.rentIncome}/turno</span>
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
          </div>
        )}

        <button
          onClick={onOpenDetails}
          className="ghost"
          style={{
            marginTop: 10,
            width: '100%',
            fontSize: '0.82rem',
            padding: '6px 8px',
          }}
        >
          Ver detalhes (A)
        </button>
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
