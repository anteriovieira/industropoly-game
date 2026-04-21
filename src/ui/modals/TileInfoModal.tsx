import type { Tile } from '@/engine/types';
import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { getTile } from '@/content/tiles';
import { sectorPalette } from '@/ui/theme';
import { activePlayer } from '@/engine/selectors';

export function TileInfoModal({ tileId }: { tileId: number }) {
  const state = useGameStore((s) => s.state)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const tile = getTile(tileId);
  const owner = state.tiles[tileId]?.owner ?? null;
  const p = activePlayer(state);
  const canBuy =
    !owner &&
    (tile.role === 'industry' || tile.role === 'transport' || tile.role === 'utility') &&
    p.cash >= tile.price &&
    !state.pendingLandingResolved;

  const canUpgrade =
    tile.role === 'industry' &&
    owner === p.id &&
    (state.tiles[tileId]?.tier ?? 0) < 5 &&
    p.cash >= tile.upgradeCost;

  return (
    <Modal
      title={tile.name}
      onClose={() => dispatch({ type: 'ACK_MODAL' })}
      footer={
        <>
          {canBuy && (
            <>
              <button className="ghost" onClick={() => dispatch({ type: 'DECLINE_BUY' })}>
                Recusar
              </button>
              <button className="primary" onClick={() => dispatch({ type: 'BUY_TILE' })}>
                Comprar por £{'price' in tile ? tile.price : 0}
              </button>
            </>
          )}
          {canUpgrade && (
            <button
              className="primary"
              onClick={() => dispatch({ type: 'UPGRADE_TILE', tileId })}
            >
              Melhorar (£{tile.upgradeCost})
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
  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 10,
            background: sectorBand(tile),
            border: '1px solid #3b2b18',
          }}
        />
        <em>
          {roleLabel(tile)} — {tile.education.date}
        </em>
      </div>
      <strong style={{ fontSize: '1.05rem' }}>{tile.education.title}</strong>
      <p style={{ margin: '0.5em 0 0.75em' }}>{tile.education.blurb}</p>
      <small style={{ opacity: 0.75 }}>Fonte: {tile.education.source}</small>
      {'price' in tile && (
        <div
          style={{
            marginTop: 14,
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: 6,
          }}
        >
          <div>
            <strong>Preço:</strong> £{tile.price}
          </div>
          {tile.role === 'industry' && (
            <div>
              <strong>Aluguel:</strong> £{tile.rents[0]} base; até £{tile.rents[5]} no nível Império.
              Melhoria £{tile.upgradeCost}.
            </div>
          )}
          {tile.role === 'transport' && (
            <div>
              <strong>Aluguel:</strong> por rotas possuídas — £{tile.rentByCount[0]} / £{tile.rentByCount[1]} /
              £{tile.rentByCount[2]} / £{tile.rentByCount[3]}.
            </div>
          )}
          {tile.role === 'utility' && (
            <div>
              <strong>Aluguel:</strong> dados × {tile.multipliers[0]} (uma só) ou × {tile.multipliers[1]} (ambas).
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
