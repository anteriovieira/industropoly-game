import { useEffect, useState } from 'react';
import { useUiStore } from '@/state/uiStore';
import { useGameStore } from '@/state/gameStore';
import { getTile } from '@/content/tiles';
import { sectorPalette, PLAYER_COLORS } from './theme';
import type { Tile } from '@/engine/types';

// Hover tooltip that shows what a tile is and what happens when a player
// lands on it. Driven by `hoveredTile` from the UI store. Uses a global
// pointermove listener (only attached while a tile is hovered) so the bubble
// follows the cursor without thrashing React state on every mouse move.
export function TileTooltip() {
  const hoveredId = useUiStore((s) => s.hoveredTile);
  const sticky = useUiStore((s) => s.hoveredTileSticky);
  const stickyPos = useUiStore((s) => s.hoveredTilePointerPos);
  const setHoveredTile = useUiStore((s) => s.setHoveredTile);
  const tiles = useGameStore((s) => s.state?.tiles);
  const players = useGameStore((s) => s.state?.players);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (hoveredId == null) {
      setPos(null);
      return;
    }
    if (stickyPos) setPos(stickyPos);
    function onMove(e: PointerEvent): void {
      setPos({ x: e.clientX, y: e.clientY });
    }
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [hoveredId, stickyPos]);

  // Sticky mode (touch tap): close when the user taps anywhere outside the
  // 3D canvas. Taps that hit the canvas are handled by R3F — Canvas.onPointerMissed
  // clears empty-board taps, and TileMesh.onClick re-opens the tooltip on a
  // different tile.
  useEffect(() => {
    if (!sticky) return undefined;
    function onDocDown(e: PointerEvent): void {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'CANVAS') return;
      setHoveredTile(null);
    }
    document.addEventListener('pointerdown', onDocDown);
    return () => document.removeEventListener('pointerdown', onDocDown);
  }, [sticky, setHoveredTile]);

  if (hoveredId == null || pos == null) return null;
  const tile = getTile(hoveredId);
  const ownership = tiles?.[hoveredId];
  const ownerIdx = ownership?.owner
    ? players?.findIndex((p) => p.id === ownership.owner)
    : -1;
  const ownerColor: string | null =
    ownerIdx != null && ownerIdx >= 0 ? (PLAYER_COLORS[ownerIdx] ?? null) : null;
  const ownerName: string | null =
    ownerIdx != null && ownerIdx >= 0 ? (players?.[ownerIdx]?.name ?? null) : null;

  // Position the bubble offset to the bottom-right of the cursor, but flip
  // to the left/up when near viewport edges so it never gets clipped.
  const W = 280;
  const H = 180;
  const margin = 14;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const flipX = pos.x + margin + W > vw;
  const flipY = pos.y + margin + H > vh;
  const left = flipX ? pos.x - margin - W : pos.x + margin;
  const top = flipY ? pos.y - margin - H : pos.y + margin;

  return (
    <div
      role="tooltip"
      aria-live="polite"
      style={{
        position: 'fixed',
        left,
        top,
        width: W,
        pointerEvents: 'none',
        zIndex: 60,
        animation: 'indTooltipEnter 140ms ease-out',
      }}
    >
      <div
        style={{
          padding: '10px 14px 12px',
          borderRadius: 10,
          color: 'var(--ink)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.84rem',
          lineHeight: 1.4,
          background:
            'radial-gradient(ellipse at 30% 20%, #f6e7bf 0%, #e8d2a0 55%, #caa560 100%)',
          border: '1px solid #8a6422',
          boxShadow:
            'inset 0 1px 0 rgba(255, 247, 214, 0.55), inset 0 -1px 0 rgba(26, 14, 6, 0.3),' +
            'inset 0 0 30px rgba(121, 85, 42, 0.2),' +
            '0 12px 28px rgba(10, 6, 2, 0.6), 0 2px 6px rgba(10, 6, 2, 0.4)',
        }}
      >
        <TooltipHeader tile={tile} />
        <div
          aria-hidden="true"
          style={{
            height: 1,
            margin: '6px -4px 8px',
            background:
              'linear-gradient(90deg, transparent 0%, #8a6422 30%, #c9943a 50%, #8a6422 70%, transparent 100%)',
          }}
        />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)', marginBottom: 4 }}>
          {tile.name}
        </div>
        <LandingExplanation tile={tile} ownerColor={ownerColor} ownerName={ownerName} />
      </div>
    </div>
  );
}

function TooltipHeader({ tile }: { tile: Tile }) {
  const band = sectorBand(tile);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        aria-hidden="true"
        style={{
          width: 12,
          height: 12,
          borderRadius: 3,
          background: band,
          boxShadow:
            '0 0 0 1px #8a6422, 0 0 0 2px rgba(232, 194, 106, 0.7), inset 0 1px 1px rgba(255,255,255,0.3)',
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.7rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
        }}
      >
        {roleLabel(tile)}
      </span>
    </div>
  );
}

function LandingExplanation({
  tile,
  ownerColor,
  ownerName,
}: {
  tile: Tile;
  ownerColor: string | null;
  ownerName: string | null;
}) {
  if (tile.role === 'industry' || tile.role === 'transport' || tile.role === 'utility') {
    if (ownerColor && ownerName) {
      return (
        <div style={{ color: 'var(--ink-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 8,
                background: ownerColor,
                boxShadow: '0 0 0 1px rgba(26, 14, 6, 0.4)',
              }}
            />
            <span style={{ fontStyle: 'italic' }}>Propriedade de {ownerName}</span>
          </div>
          <div>
            Ao parar aqui você paga{' '}
            <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--copper)' }}>
              aluguel
            </strong>{' '}
            ao dono.
          </div>
        </div>
      );
    }
    if (tile.role === 'industry') {
      return (
        <div style={{ color: 'var(--ink-soft)' }}>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--copper)' }}>
            Disponível por R${tile.price}.
          </strong>{' '}
          Ao parar aqui você poderá comprar a propriedade. Quem compra recebe aluguel
          quando outros visitam — e pode melhorar a fábrica para aluguéis maiores.
        </div>
      );
    }
    if (tile.role === 'transport') {
      return (
        <div style={{ color: 'var(--ink-soft)' }}>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--copper)' }}>
            Rota disponível por R${tile.price}.
          </strong>{' '}
          O aluguel cresce conforme o dono possui mais rotas (R${tile.rentByCount[0]} a R${tile.rentByCount[3]}).
        </div>
      );
    }
    return (
      <div style={{ color: 'var(--ink-soft)' }}>
        <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--copper)' }}>
          Utilidade pública por R${tile.price}.
        </strong>{' '}
        Aluguel é dados × {tile.multipliers[0]} (uma só) ou × {tile.multipliers[1]} (ambas).
      </div>
    );
  }
  if (tile.role === 'tax') {
    return (
      <div style={{ color: 'var(--ink-soft)' }}>
        <strong style={{ color: 'var(--danger)' }}>Imposto</strong> — ao parar aqui você
        paga{' '}
        <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--copper)' }}>
          R${tile.amount}
        </strong>{' '}
        ao Tesouro.
      </div>
    );
  }
  if (tile.role === 'card') {
    const isInvention = tile.deck === 'invention';
    return (
      <div style={{ color: 'var(--ink-soft)' }}>
        Compre uma carta do deck{' '}
        <strong style={{ fontFamily: 'var(--font-display)' }}>
          {isInvention ? 'Invenções' : 'Editais'}
        </strong>
        . O efeito é aplicado imediatamente — pode ser dinheiro, movimento ou um evento.
      </div>
    );
  }
  // corner
  switch (tile.corner) {
    case 'start':
      return (
        <div style={{ color: 'var(--ink-soft)' }}>
          <strong style={{ color: 'var(--copper)' }}>Largada.</strong> Ao passar (ou parar)
          aqui você recebe um pagamento do salário industrial.
        </div>
      );
    case 'prison':
      return (
        <div style={{ color: 'var(--ink-soft)' }}>
          <em>Prisão de devedores.</em> Apenas em visita (sem efeito) — a não ser que
          tenha sido enviado para cá.
        </div>
      );
    case 'public-square':
      return (
        <div style={{ color: 'var(--ink-soft)' }}>
          <em>Praça pública.</em> Casa neutra — nada acontece quando você para aqui.
        </div>
      );
    case 'go-to-prison':
      return (
        <div style={{ color: 'var(--danger)' }}>
          Ao parar aqui você é enviado direto à <strong>Prisão de Devedores</strong>.
        </div>
      );
  }
}

function sectorBand(tile: Tile): string {
  if (tile.role === 'industry') return sectorPalette[tile.sector].base;
  if (tile.role === 'transport') return '#3a2a1a';
  if (tile.role === 'utility') return '#5a6b2e';
  if (tile.role === 'tax') return '#6a2a1b';
  if (tile.role === 'card') return tile.deck === 'invention' ? '#b8882a' : '#2f5a3a';
  return '#2c1b0a';
}

function roleLabel(tile: Tile): string {
  if (tile.role === 'industry') return sectorPalette[tile.sector].label;
  if (tile.role === 'transport') return 'Transporte';
  if (tile.role === 'utility') return 'Utilidade Pública';
  if (tile.role === 'tax') return 'Imposto';
  if (tile.role === 'card')
    return tile.deck === 'invention' ? 'Carta · Invenções' : 'Carta · Editais';
  if (tile.corner === 'start') return 'Largada';
  if (tile.corner === 'prison') return 'Prisão';
  if (tile.corner === 'public-square') return 'Praça Pública';
  return 'Vá para a Prisão';
}
