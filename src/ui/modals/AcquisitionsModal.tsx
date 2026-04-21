import { useState } from 'react';
import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import {
  activePlayer,
  computeRent,
  nonBankruptPlayers,
  playerHoldings,
  UTILITY_RENT_ESTIMATE_ROLL,
  type PlayerSectorGroup,
  type PlayerSimpleHolding,
} from '@/engine/selectors';
import { getTile } from '@/content/tiles';
import { PLAYER_COLORS, sectorPalette } from '@/ui/theme';
import type { GameState, IndustryTile, PlayerId, UtilityTile } from '@/engine/types';

const TIER_LABELS = ['Base', 'Oficina', 'Fábrica', 'Cooperativa', 'Estaleiro', 'Império'] as const;
const UTILITY_RENT_HINT = 'estimativa para soma dos dados = 7';
const TRANSPORT_BAND = '#3a2a1a';
const UTILITY_BAND = '#5a6b2e';

export function AcquisitionsModal() {
  const state = useGameStore((s) => s.state)!;
  const setOpen = useUiStore((s) => s.setAcquisitionsOpen);
  const players = nonBankruptPlayers(state);
  const active = activePlayer(state);
  const [selectedId, setSelectedId] = useState<PlayerId>(active.id);

  const selectedPlayer = players.find((p) => p.id === selectedId) ?? active;
  const holdings = playerHoldings(state, selectedPlayer.id);
  const selectedColor =
    PLAYER_COLORS[state.players.findIndex((p) => p.id === selectedPlayer.id)] ?? PLAYER_COLORS[0]!;

  return (
    <Modal title="Aquisições" onClose={() => setOpen(false)}>
      <PlayerTabs
        state={state}
        selectedId={selectedPlayer.id}
        onSelect={setSelectedId}
      />

      <SummaryHeader
        accent={selectedColor}
        playerName={selectedPlayer.name}
        cash={selectedPlayer.cash}
        tileCount={holdings.totals.tileCount}
        mortgageValueAvailable={holdings.totals.mortgageValueAvailable}
        rentIncome={holdings.totals.rentIncome}
      />

      {holdings.totals.tileCount === 0 ? (
        <em>
          Nenhuma aquisição ainda — compre uma indústria, transporte ou utilidade pública para
          começar seu portfólio.
        </em>
      ) : (
        <>
          {holdings.industriesBySector.length > 0 && (
            <section>
              <SectionTitle>Indústrias</SectionTitle>
              {holdings.industriesBySector.map((g) => (
                <SectorGroup key={g.sector} state={state} group={g} />
              ))}
            </section>
          )}
          {holdings.transports.length > 0 && (
            <section>
              <SectionTitle>Transportes</SectionTitle>
              {holdings.transports.map((h) => (
                <TransportRow key={h.tileId} state={state} holding={h} />
              ))}
            </section>
          )}
          {holdings.utilities.length > 0 && (
            <section>
              <SectionTitle>Utilidades públicas</SectionTitle>
              {holdings.utilities.map((h) => (
                <UtilityRow
                  key={h.tileId}
                  state={state}
                  holding={h}
                  ownerId={selectedPlayer.id}
                />
              ))}
            </section>
          )}
        </>
      )}
    </Modal>
  );
}

function PlayerTabs({
  state,
  selectedId,
  onSelect,
}: {
  state: GameState;
  selectedId: PlayerId;
  onSelect: (id: PlayerId) => void;
}) {
  const active = activePlayer(state);
  const players = nonBankruptPlayers(state);
  return (
    <div
      role="tablist"
      aria-label="Selecionar jogador"
      style={{
        position: 'sticky',
        top: 0,
        background: 'var(--parchment-light, #f3e7c1)',
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        padding: '4px 0 8px',
        marginBottom: 4,
        borderBottom: '1px solid rgba(59,43,24,0.25)',
        zIndex: 1,
      }}
    >
      {players.map((p) => {
        const idx = state.players.findIndex((x) => x.id === p.id);
        const color = PLAYER_COLORS[idx] ?? PLAYER_COLORS[0]!;
        const selected = p.id === selectedId;
        const isActive = p.id === active.id;
        return (
          <button
            key={p.id}
            role="tab"
            aria-selected={selected}
            data-testid={`acq-tab-${p.id}`}
            onClick={() => onSelect(p.id)}
            style={{
              padding: '6px 10px',
              fontSize: '0.85rem',
              border: selected ? `2px solid ${color}` : '1px solid rgba(59,43,24,0.4)',
              background: selected ? 'rgba(59,43,24,0.06)' : 'transparent',
              color: 'var(--ink, #3b2b18)',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 10,
                background: color,
              }}
            />
            {!isActive && <span aria-hidden="true">👁</span>}
            {p.name}
            {!isActive && (
              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>(visualização)</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SummaryHeader({
  accent,
  playerName,
  cash,
  tileCount,
  mortgageValueAvailable,
  rentIncome,
}: {
  accent: string;
  playerName: string;
  cash: number;
  tileCount: number;
  mortgageValueAvailable: number;
  rentIncome: number;
}) {
  return (
    <div
      data-testid="acq-summary"
      style={{
        position: 'sticky',
        top: 44,
        background: 'rgba(0,0,0,0.04)',
        border: `1px solid ${accent}`,
        borderRadius: 6,
        padding: '8px 12px',
        marginBottom: 12,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 8,
        zIndex: 1,
      }}
    >
      <SummaryStat label={playerName} value="" />
      <SummaryStat label="Caixa" value={`£${cash}`} />
      <SummaryStat label="Aquisições" value={String(tileCount)} />
      <SummaryStat label="Hipoteca disponível" value={`£${mortgageValueAvailable}`} />
      <SummaryStat label="Aluguel atual" value={`£${rentIncome}`} />
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.7 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h3 style={{ marginBottom: 8 }}>{children}</h3>;
}

function SectorGroup({ state, group }: { state: GameState; group: PlayerSectorGroup }) {
  const palette = sectorPalette[group.sector];
  return (
    <article style={{ marginBottom: 14 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: 12,
            background: palette.base,
            border: '1px solid #3b2b18',
          }}
        />
        <strong>{palette.label}</strong>
        <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>
          {group.tiles.length}/{group.sectorTotal} tiles
        </span>
        {group.monopoly && (
          <span
            data-testid={`acq-monopoly-${group.sector}`}
            style={{
              fontSize: '0.75rem',
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(31,92,62,0.18)',
              color: '#1f5c3e',
            }}
          >
            Monopólio
          </span>
        )}
      </header>
      <div style={{ display: 'grid', gap: 6 }}>
        {group.tiles.map((h) => (
          <IndustryRow key={h.tileId} state={state} tier={h.tier} mortgaged={h.mortgaged} tileId={h.tileId} />
        ))}
      </div>
    </article>
  );
}

function IndustryRow({
  state,
  tier,
  mortgaged,
  tileId,
}: {
  state: GameState;
  tier: number;
  mortgaged: boolean;
  tileId: number;
}) {
  const tile = getTile(tileId) as IndustryTile;
  const rent = computeRent(state, tileId, UTILITY_RENT_ESTIMATE_ROLL);
  const tierLabel = TIER_LABELS[Math.min(tier, TIER_LABELS.length - 1)]!;
  return (
    <Row band={sectorPalette[tile.sector].base}>
      <RowMain title={tile.name} subtitle={`${tile.education.title} — ${tile.education.date}`} />
      <RowMeta
        chips={[
          { label: tierLabel, key: 'tier' },
          ...(mortgaged ? [{ label: 'Hipotecado', key: 'mortgaged', danger: true }] : []),
        ]}
        rent={`£${rent}`}
      />
    </Row>
  );
}

function TransportRow({ state, holding }: { state: GameState; holding: PlayerSimpleHolding }) {
  const tile = getTile(holding.tileId);
  const rent = computeRent(state, holding.tileId, UTILITY_RENT_ESTIMATE_ROLL);
  return (
    <Row band={TRANSPORT_BAND}>
      <RowMain title={tile.name} subtitle={`${tile.education.title} — ${tile.education.date}`} />
      <RowMeta
        chips={holding.mortgaged ? [{ label: 'Hipotecado', key: 'mortgaged', danger: true }] : []}
        rent={`£${rent}`}
      />
    </Row>
  );
}

function UtilityRow({
  state,
  holding,
  ownerId,
}: {
  state: GameState;
  holding: PlayerSimpleHolding;
  ownerId: PlayerId;
}) {
  const tile = getTile(holding.tileId) as UtilityTile;
  const rent = computeRent(state, holding.tileId, UTILITY_RENT_ESTIMATE_ROLL);
  const utilitiesOwned = countUtilitiesOwnedBy(state, ownerId);
  const multiplier = utilitiesOwned >= 2 ? tile.multipliers[1] : tile.multipliers[0];
  return (
    <Row band={UTILITY_BAND}>
      <RowMain title={tile.name} subtitle={`${tile.education.title} — ${tile.education.date}`} />
      <RowMeta
        chips={[
          { label: `×${multiplier}`, key: 'mult' },
          ...(holding.mortgaged ? [{ label: 'Hipotecado', key: 'mortgaged', danger: true }] : []),
        ]}
        rent={`£${rent}`}
        rentTitle={UTILITY_RENT_HINT}
        caption={UTILITY_RENT_HINT}
      />
    </Row>
  );
}

function countUtilitiesOwnedBy(state: GameState, owner: PlayerId): number {
  let n = 0;
  for (const id of Object.keys(state.tiles)) {
    const o = state.tiles[Number(id)]!;
    if (o.owner !== owner) continue;
    const t = getTile(Number(id));
    if (t.role === 'utility') n += 1;
  }
  return n;
}

function Row({ band, children }: { band: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '8px 1fr auto',
        gap: 10,
        alignItems: 'center',
        padding: '6px 10px',
        border: '1px solid rgba(59,43,24,0.2)',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.25)',
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 8, height: '100%', background: band, borderRadius: 2, alignSelf: 'stretch' }}
      />
      {children}
    </div>
  );
}

function RowMain({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{title}</div>
      <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>{subtitle}</div>
    </div>
  );
}

function RowMeta({
  chips,
  rent,
  rentTitle,
  caption,
}: {
  chips: Array<{ label: string; key: string; danger?: boolean }>;
  rent: string;
  rentTitle?: string;
  caption?: string;
}) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {chips.map((c) => (
          <span
            key={c.key}
            style={{
              fontSize: '0.72rem',
              padding: '2px 6px',
              borderRadius: 4,
              background: c.danger ? 'rgba(138,42,27,0.18)' : 'rgba(59,43,24,0.1)',
              color: c.danger ? 'var(--danger)' : 'var(--ink, #3b2b18)',
            }}
          >
            {c.label}
          </span>
        ))}
      </div>
      <div
        title={rentTitle}
        style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginTop: 2 }}
      >
        {rent}
      </div>
      {caption && (
        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{caption}</div>
      )}
    </div>
  );
}
