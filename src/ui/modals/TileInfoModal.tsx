import type { Tile } from '@/engine/types';
import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { getTile } from '@/content/tiles';
import { sectorPalette } from '@/ui/theme';
import { activePlayer } from '@/engine/selectors';

export function TileInfoModal({ tileId, readOnly = false }: { tileId: number; readOnly?: boolean }) {
  const state = useGameStore((s) => s.state)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const tile = getTile(tileId);
  const owner = state.tiles[tileId]?.owner ?? null;
  const p = activePlayer(state);
  const canBuy =
    !readOnly &&
    !owner &&
    (tile.role === 'industry' || tile.role === 'transport' || tile.role === 'utility') &&
    p.cash >= tile.price &&
    !state.pendingLandingResolved;

  const canUpgrade =
    !readOnly &&
    tile.role === 'industry' &&
    owner === p.id &&
    (state.tiles[tileId]?.tier ?? 0) < 5 &&
    p.cash >= tile.upgradeCost;

  return (
    <Modal
      title={tile.name}
      label={`${roleLabel(tile)} · ${tile.education.date}`}
      onClose={() => dispatch({ type: 'ACK_MODAL' })}
      footer={
        <>
          {canBuy && (
            <>
              <button className="ghost" onClick={() => dispatch({ type: 'DECLINE_BUY' })}>
                Recusar
              </button>
              <button className="primary" onClick={() => dispatch({ type: 'BUY_TILE' })}>
                Comprar por R${'price' in tile ? tile.price : 0}
              </button>
            </>
          )}
          {canUpgrade && (
            <button
              className="primary"
              onClick={() => dispatch({ type: 'UPGRADE_TILE', tileId })}
            >
              Melhorar (R${tile.upgradeCost})
            </button>
          )}
          {!canBuy && (
            <button onClick={() => dispatch({ type: 'ACK_MODAL' })}>Continuar</button>
          )}
        </>
      }
    >
      <TileBody tile={tile} />
    </Modal>
  );
}

function TileBody({ tile }: { tile: Tile }) {
  const band = sectorBand(tile);
  return (
    <>
      {/* Sector swatch — brass-ringed chip that feels like an inlaid jewel */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <span
          aria-hidden="true"
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: band,
            boxShadow:
              '0 0 0 1px #8a6422, 0 0 0 2px #e8c26a, 0 0 0 3px #8a6422,' +
              'inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)',
          }}
        />
        <strong style={{ fontSize: '1.08rem', color: 'var(--ink)' }}>
          {tile.education.title}
        </strong>
      </div>
      <p style={{ margin: '0 0 10px' }}>{tile.education.blurb}</p>
      <small style={{ color: 'var(--ink-muted)', fontStyle: 'italic' }}>
        Fonte: {tile.education.source}
      </small>
      {'price' in tile && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            background:
              'linear-gradient(180deg, rgba(26, 14, 6, 0.08) 0%, rgba(26, 14, 6, 0.04) 100%)',
            border: '1px solid rgba(26, 14, 6, 0.25)',
            borderLeft: '3px solid #c9943a',
            borderRadius: 6,
            boxShadow: 'inset 0 1px 0 rgba(250, 226, 160, 0.25)',
            display: 'grid',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="ind-label">Preço</span>
            <span
              className="ind-tabular"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                color: 'var(--copper)',
              }}
            >
              R${tile.price}
            </span>
          </div>
          {tile.role === 'industry' && (
            <div style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
              <span className="ind-label" style={{ fontSize: '0.68rem' }}>Aluguel</span>{' '}
              R${tile.rents[0]} base · até R${tile.rents[5]} no nível Império · melhoria R${tile.upgradeCost}.
            </div>
          )}
          {tile.role === 'transport' && (
            <div style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
              <span className="ind-label" style={{ fontSize: '0.68rem' }}>Aluguel</span>{' '}
              por rotas possuídas — R${tile.rentByCount[0]} / R${tile.rentByCount[1]} /
              R${tile.rentByCount[2]} / R${tile.rentByCount[3]}.
            </div>
          )}
          {tile.role === 'utility' && (
            <div style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
              <span className="ind-label" style={{ fontSize: '0.68rem' }}>Aluguel</span>{' '}
              dados × {tile.multipliers[0]} (uma só) ou × {tile.multipliers[1]} (ambas).
            </div>
          )}
        </div>
      )}
    </>
  );
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
  if (tile.role === 'card') return tile.deck === 'invention' ? 'Invenção' : 'Edital';
  return 'Canto';
}
