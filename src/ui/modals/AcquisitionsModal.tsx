import { useMemo, useState } from 'react';
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
import { cashHistoryForPlayer, type CashHistoryEntry } from '@/engine/cashHistory';
import { getTile } from '@/content/tiles';
import { PLAYER_COLORS, sectorPalette } from '@/ui/theme';
import type { GameState, IndustryTile, PlayerId, UtilityTile } from '@/engine/types';

const TIER_LABELS = ['Base', 'Oficina', 'Fábrica', 'Cooperativa', 'Estaleiro', 'Império'] as const;
const UTILITY_RENT_HINT = 'estimativa para soma dos dados = 7';
const TRANSPORT_BAND = '#3a2a1a';
const UTILITY_BAND = '#5a6b2e';

type ViewTab = 'holdings' | 'history';

export function AcquisitionsModal() {
  const state = useGameStore((s) => s.state)!;
  const setOpen = useUiStore((s) => s.setAcquisitionsOpen);
  const focusPlayerId = useUiStore((s) => s.acquisitionsFocusPlayerId);
  const players = nonBankruptPlayers(state);
  const active = activePlayer(state);
  const [selectedId, setSelectedId] = useState<PlayerId>(
    (focusPlayerId as PlayerId | null) ?? active.id,
  );
  const [tab, setTab] = useState<ViewTab>('holdings');

  const focused = focusPlayerId != null;
  const effectiveId = focused ? (focusPlayerId as PlayerId) : selectedId;
  const selectedPlayer = players.find((p) => p.id === effectiveId) ?? active;
  const holdings = playerHoldings(state, selectedPlayer.id);
  const selectedColor =
    PLAYER_COLORS[state.players.findIndex((p) => p.id === selectedPlayer.id)] ?? PLAYER_COLORS[0]!;

  const history = useMemo(
    () => cashHistoryForPlayer(state, selectedPlayer.id),
    [state.log, selectedPlayer.id],
  );

  return (
    <Modal
      title={focused ? `Aquisições — ${selectedPlayer.name}` : 'Aquisições'}
      onClose={() => setOpen(false)}
    >
      {!focused && (
        <PlayerTabs
          state={state}
          selectedId={selectedPlayer.id}
          onSelect={setSelectedId}
        />
      )}

      <SummaryHeader
        accent={selectedColor}
        playerName={selectedPlayer.name}
        cash={selectedPlayer.cash}
        tileCount={holdings.totals.tileCount}
        mortgageValueAvailable={holdings.totals.mortgageValueAvailable}
        rentIncome={holdings.totals.rentIncome}
      />

      <ViewTabs
        current={tab}
        onSelect={setTab}
        historyCount={history.length}
        accent={selectedColor}
      />

      {tab === 'holdings' ? (
        holdings.totals.tileCount === 0 ? (
          <em style={{ display: 'block', marginBottom: 16 }}>
            Nenhuma aquisição ainda — compre uma indústria, transporte ou utilidade pública
            para começar seu portfólio.
          </em>
        ) : (
          <>
            {holdings.industriesBySector.length > 0 && (
              <section style={{ marginBottom: 16 }}>
                <SectionTitle accent={selectedColor}>Indústrias</SectionTitle>
                {holdings.industriesBySector.map((g) => (
                  <SectorGroup key={g.sector} state={state} group={g} />
                ))}
              </section>
            )}
            {holdings.transports.length > 0 && (
              <section style={{ marginBottom: 16 }}>
                <SectionTitle accent={selectedColor}>Transportes</SectionTitle>
                <div style={{ display: 'grid', gap: 6 }}>
                  {holdings.transports.map((h) => (
                    <TransportRow key={h.tileId} state={state} holding={h} />
                  ))}
                </div>
              </section>
            )}
            {holdings.utilities.length > 0 && (
              <section style={{ marginBottom: 16 }}>
                <SectionTitle accent={selectedColor}>Utilidades públicas</SectionTitle>
                <div style={{ display: 'grid', gap: 6 }}>
                  {holdings.utilities.map((h) => (
                    <UtilityRow
                      key={h.tileId}
                      state={state}
                      holding={h}
                      ownerId={selectedPlayer.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )
      ) : (
        <HistoryList entries={history} />
      )}
    </Modal>
  );
}

function ViewTabs({
  current,
  onSelect,
  historyCount,
  accent,
}: {
  current: ViewTab;
  onSelect: (tab: ViewTab) => void;
  historyCount: number;
  accent: string;
}) {
  const tabs: Array<{ id: ViewTab; label: string; badge?: string }> = [
    { id: 'holdings', label: 'Aquisições' },
    { id: 'history', label: 'Histórico', badge: historyCount > 0 ? String(historyCount) : undefined },
  ];
  return (
    <div
      role="tablist"
      aria-label="Visualização"
      style={{
        display: 'flex',
        gap: 4,
        borderBottom: '1px solid rgba(59,43,24,0.25)',
        marginBottom: 14,
      }}
    >
      {tabs.map((t) => {
        const selected = current === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(t.id)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '8px 14px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.95rem',
              color: selected ? accent : 'var(--ink-soft)',
              borderBottom: selected
                ? `3px solid ${accent}`
                : '3px solid transparent',
              marginBottom: -1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {t.label}
            {t.badge && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: selected ? accent : 'rgba(59,43,24,0.15)',
                  color: selected ? 'var(--parchment-light)' : 'var(--ink)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
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
        top: -24,
        background: 'var(--parchment-light)',
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        padding: '12px 0 10px',
        marginTop: -8,
        marginBottom: 12,
        borderBottom: '1px solid rgba(59,43,24,0.25)',
        boxShadow: '0 4px 6px -4px rgba(59,43,24,0.35)',
        zIndex: 2,
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
        background: 'var(--parchment-light)',
        border: `2px solid ${accent}`,
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 10,
        boxShadow: 'inset 0 0 20px rgba(121, 85, 42, 0.1)',
      }}
    >
      <SummaryStat label="Jogador" value={playerName} accent={accent} emphasis />
      <SummaryStat label="Caixa" value={`R$${cash}`} />
      <SummaryStat label="Aquisições" value={String(tileCount)} />
      <SummaryStat label="Hipoteca disponível" value={`R$${mortgageValueAvailable}`} />
      <SummaryStat label="Aluguel atual" value={`R$${rentIncome}`} />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
  emphasis,
}: {
  label: string;
  value: string;
  accent?: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          opacity: 0.7,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: emphasis ? '1.2rem' : '1.05rem',
          color: emphasis && accent ? accent : 'var(--ink)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ children, accent }: { children: string; accent?: string }) {
  return (
    <h3
      style={{
        margin: '0 0 10px',
        paddingLeft: 10,
        borderLeft: `3px solid ${accent ?? 'var(--ink-soft)'}`,
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
        fontWeight: 500,
      }}
    >
      {children}
    </h3>
  );
}

function HistoryList({ entries }: { entries: CashHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <em style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7 }}>
        Sem movimentações financeiras registradas.
      </em>
    );
  }
  const totals = entries.reduce(
    (acc, e) => {
      if (e.delta > 0) acc.in += e.delta;
      else acc.out += -e.delta;
      return acc;
    },
    { in: 0, out: 0 },
  );
  // Reverse so most recent appears first.
  const rows = [...entries].reverse();
  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          fontSize: '0.78rem',
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 4,
            background: 'rgba(31, 122, 68, 0.15)',
            color: '#1f7a44',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          ▲ Entradas: R${totals.in}
        </span>
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 4,
            background: 'rgba(161, 42, 31, 0.15)',
            color: '#a12a1f',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          ▼ Saídas: R${totals.out}
        </span>
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 4,
            background: 'rgba(59,43,24,0.1)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          Saldo líquido: R${totals.in - totals.out}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        {rows.map((e) => {
          const positive = e.delta > 0;
          const color = positive ? '#1f7a44' : '#a12a1f';
          return (
            <div
              key={e.index}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 10,
                alignItems: 'center',
                padding: '6px 10px',
                border: '1px solid rgba(59,43,24,0.18)',
                borderLeft: `3px solid ${color}`,
                borderRadius: 6,
                background: 'rgba(255,255,255,0.3)',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{e.reason}</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>{e.raw}</div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontVariantNumeric: 'tabular-nums',
                  color,
                  whiteSpace: 'nowrap',
                }}
              >
                {positive ? '+' : '−'} R${e.amount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectorGroup({ state, group }: { state: GameState; group: PlayerSectorGroup }) {
  const palette = sectorPalette[group.sector];
  const sectorRent = group.tiles.reduce(
    (sum, h) => sum + computeRent(state, h.tileId, UTILITY_RENT_ESTIMATE_ROLL),
    0,
  );
  const pct = group.sectorTotal > 0 ? group.tiles.length / group.sectorTotal : 0;
  // Highest-tier tiles first within a sector — they're the strategic anchors.
  const sorted = [...group.tiles].sort((a, b) => b.tier - a.tier || a.tileId - b.tileId);

  return (
    <article style={{ marginBottom: 16 }}>
      <header style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              borderRadius: 14,
              background: palette.base,
              border: '1px solid #3b2b18',
            }}
          />
          <strong style={{ flex: 1 }}>{palette.label}</strong>
          {group.monopoly && (
            <span
              data-testid={`acq-monopoly-${group.sector}`}
              style={{
                fontSize: '0.72rem',
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(31,92,62,0.18)',
                color: '#1f5c3e',
              }}
            >
              ★ Monopólio
            </span>
          )}
          <span
            style={{
              fontSize: '0.78rem',
              opacity: 0.75,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            R${sectorRent}/turno
          </span>
        </div>
        <div
          style={{
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              position: 'relative',
              flex: 1,
              height: 4,
              background: 'rgba(59,43,24,0.18)',
              borderRadius: 2,
            }}
          >
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
          <span
            style={{
              fontSize: '0.72rem',
              opacity: 0.75,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {group.tiles.length}/{group.sectorTotal} casas
          </span>
        </div>
      </header>
      <div style={{ display: 'grid', gap: 6 }}>
        {sorted.map((h) => (
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
        rent={`R$${rent}`}
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
        rent={`R$${rent}`}
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
        rent={`R$${rent}`}
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
