import { useMemo } from 'react';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { activePlayer } from '@/engine/selectors';
import { toMinimapPoint } from '@/scene/layout';
import { audio } from '@/lib/audio';
import { PLAYER_COLORS, colors } from './theme';
import type { Player } from '@/engine/types';

const SIZE = 140;
const VIEWBOX = 100;
const PADDING = 6;
const TILE_RADIUS = 2.2;
const DOT_RADIUS = 2.0;
const HIGHLIGHT_OUTER = 5.6;

export function Minimap() {
  const state = useGameStore((s) => s.state);
  const focusCameraOnTile = useUiStore((s) => s.focusCameraOnTile);

  // Tile marker positions are static — compute once.
  const tilePoints = useMemo(
    () =>
      Array.from({ length: 40 }, (_, id) => ({
        id,
        ...toMinimapPoint(id, VIEWBOX, PADDING),
      })),
    [],
  );

  if (!state) return null;

  const active = activePlayer(state);
  const activePlayerIndex = state.activePlayerIndex;
  const activeColor = PLAYER_COLORS[activePlayerIndex] ?? PLAYER_COLORS[0]!;
  const activePos = toMinimapPoint(active.position, VIEWBOX, PADDING);

  // Group non-bankrupt players by tile so same-tile tokens can be offset angularly.
  const playersByTile = new Map<number, Array<{ player: Player; index: number }>>();
  state.players.forEach((player, index) => {
    if (player.bankrupt) return;
    const bucket = playersByTile.get(player.position) ?? [];
    bucket.push({ player, index });
    playersByTile.set(player.position, bucket);
  });

  function onActivate(): void {
    audio.play('click');
    focusCameraOnTile(active.position);
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      aria-label={`Centralizar câmera na casa atual de ${active.name}`}
      title="Centralizar câmera na casa atual"
      className="minimap-root"
      style={{
        all: 'unset',
        cursor: 'pointer',
        width: SIZE,
        height: SIZE,
        padding: 4,
        background: `linear-gradient(180deg, ${colors.parchmentLight}, ${colors.parchment})`,
        border: `1px solid ${colors.ink}`,
        borderRadius: 8,
        boxShadow: `0 4px 12px ${colors.shadow}`,
        boxSizing: 'border-box',
        display: 'block',
      }}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        width="100%"
        height="100%"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <defs>
          <style>{`
            @keyframes minimap-pulse {
              0%   { r: ${HIGHLIGHT_OUTER - 1}; opacity: 0.9; }
              50%  { r: ${HIGHLIGHT_OUTER + 1.2}; opacity: 0.55; }
              100% { r: ${HIGHLIGHT_OUTER - 1}; opacity: 0.9; }
            }
          `}</style>
        </defs>

        {/* Tile markers — monochrome/parchment for v1. */}
        {tilePoints.map((p) => (
          <rect
            key={p.id}
            x={p.x - TILE_RADIUS}
            y={p.y - TILE_RADIUS}
            width={TILE_RADIUS * 2}
            height={TILE_RADIUS * 2}
            fill={colors.parchmentDeep}
            stroke={colors.ink}
            strokeWidth={0.3}
            rx={0.5}
          />
        ))}

        {/* Pulsing ring on active player's current tile (non-color cue + color). */}
        <circle
          cx={activePos.x}
          cy={activePos.y}
          r={HIGHLIGHT_OUTER}
          fill="none"
          stroke={activeColor}
          strokeWidth={1.1}
          style={{ animation: 'minimap-pulse 1.4s ease-in-out infinite' }}
        />

        {/* Player dots. */}
        {Array.from(playersByTile.entries()).flatMap(([tileId, bucket]) => {
          const centre = toMinimapPoint(tileId, VIEWBOX, PADDING);
          const n = bucket.length;
          return bucket.map(({ player, index }, i) => {
            const color = PLAYER_COLORS[index] ?? PLAYER_COLORS[0]!;
            let cx = centre.x;
            let cy = centre.y;
            if (n > 1) {
              const angle = (i / n) * Math.PI * 2;
              const r = 1.8;
              cx += Math.cos(angle) * r;
              cy += Math.sin(angle) * r;
            }
            return (
              <circle
                key={player.id}
                cx={cx}
                cy={cy}
                r={DOT_RADIUS}
                fill={color}
                stroke={colors.ink}
                strokeWidth={0.4}
              />
            );
          });
        })}
      </svg>
    </button>
  );
}
