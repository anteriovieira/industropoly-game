import { useMemo, useState } from 'react';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { Parchment } from '@/ui/Parchment';
import type { TokenKind } from '@/engine/types';
import { TokenPreview } from '@/scene/tokens/TokenPreview';

const TOKENS: ReadonlyArray<{ id: TokenKind; label: string }> = [
  { id: 'locomotive', label: 'Locomotiva' },
  { id: 'top-hat', label: 'Cartola' },
  { id: 'cotton-bobbin', label: 'Bobina de Algodão' },
  { id: 'pickaxe', label: 'Picareta' },
  { id: 'pocket-watch', label: 'Relógio de Bolso' },
  { id: 'factory-chimney', label: 'Chaminé Fabril' },
];

const PLAYER_COLORS = ['#e5624a', '#5aa0c8', '#b174c7', '#a8cf68'];

interface Draft {
  name: string;
  token: TokenKind | '';
}

export function SetupScreen() {
  const newGame = useGameStore((s) => s.newGame);
  const setPhase = useUiStore((s) => s.setPhase);
  const [count, setCount] = useState(2);
  const [drafts, setDrafts] = useState<Draft[]>([
    { name: 'Jogador 1', token: 'locomotive' },
    { name: 'Jogador 2', token: 'top-hat' },
    { name: 'Jogador 3', token: 'cotton-bobbin' },
    { name: 'Jogador 4', token: 'pickaxe' },
  ]);

  const effective = useMemo(() => drafts.slice(0, count), [drafts, count]);
  const taken = useMemo(
    () => new Set(effective.map((d) => d.token).filter((t): t is TokenKind => t !== '')),
    [effective],
  );
  const valid =
    effective.every((d) => d.name.trim().length > 0 && d.token !== '') &&
    effective.length === new Set(effective.map((d) => d.token)).size;

  function update(i: number, patch: Partial<Draft>): void {
    setDrafts((prev) => prev.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  }

  function start(): void {
    if (!valid) return;
    newGame(effective.map((d) => ({ name: d.name.trim(), token: d.token as TokenKind })));
    setPhase('game');
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 'clamp(12px, 3vw, 32px)',
        background: 'linear-gradient(#1a120a, #342410)',
        overflow: 'auto',
      }}
    >
      <Parchment
        padding={0}
        style={{
          width: '100%',
          maxWidth: 1080,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: 'clamp(16px, 3vw, 28px) clamp(20px, 3vw, 32px)',
            borderBottom: '1px solid rgba(59, 43, 24, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3vw, 2.3rem)' }}>
            Reúna os Investidores
          </h1>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.95rem' }}>
            Escolha o número de jogadores, nomeie cada um e selecione uma peça única.
          </p>

          <div
            role="radiogroup"
            aria-label="Número de jogadores"
            style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
          >
            <span style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>Jogadores:</span>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={count === n}
                className={count === n ? 'primary' : 'ghost'}
                onClick={() => setCount(n)}
                style={{ minWidth: 48 }}
              >
                {n}
              </button>
            ))}
          </div>
        </header>

        {/* Player cards */}
        <div
          style={{
            padding: 'clamp(16px, 3vw, 24px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: 'clamp(12px, 2vw, 20px)',
          }}
        >
          {effective.map((d, i) => (
            <PlayerCard
              key={i}
              index={i}
              draft={d}
              accent={PLAYER_COLORS[i]!}
              taken={taken}
              onUpdate={(patch) => update(i, patch)}
            />
          ))}
        </div>

        {/* Footer */}
        <footer
          style={{
            padding: 'clamp(14px, 2vw, 20px) clamp(20px, 3vw, 32px)',
            borderTop: '1px solid rgba(59, 43, 24, 0.25)',
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button className="ghost" onClick={() => setPhase('intro')}>
            ← Voltar
          </button>
          {!valid && (
            <span
              role="status"
              style={{ fontSize: '0.85rem', color: 'var(--danger)', flex: '1 1 auto', textAlign: 'center' }}
            >
              Cada jogador precisa de um nome e de uma peça única.
            </span>
          )}
          <button className="primary" disabled={!valid} onClick={start}>
            Iniciar Jogo →
          </button>
        </footer>
      </Parchment>
    </div>
  );
}

interface PlayerCardProps {
  index: number;
  draft: Draft;
  accent: string;
  taken: Set<TokenKind>;
  onUpdate: (patch: Partial<Draft>) => void;
}

function PlayerCard({ index, draft, accent, taken, onUpdate }: PlayerCardProps) {
  return (
    <section
      aria-label={`Jogador ${index + 1}`}
      style={{
        background: 'rgba(255, 247, 214, 0.5)',
        border: `1px solid rgba(59, 43, 24, 0.3)`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        padding: 'clamp(14px, 2vw, 18px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: accent,
            color: '#fff5d6',
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
          }}
        >
          {index + 1}
        </span>
        <label
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Nome do jogador</span>
          <input
            value={draft.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            aria-label={`Nome do jogador ${index + 1}`}
            style={{ width: '100%' }}
          />
        </label>
      </div>

      <div>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--ink-soft)',
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <span>Peça</span>
          <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
            {draft.token ? TOKENS.find((t) => t.id === draft.token)?.label : 'nenhuma selecionada'}
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="Escolher peça"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {TOKENS.map((t) => {
            const selected = draft.token === t.id;
            const disabled = !selected && taken.has(t.id);
            return (
              <TokenOption
                key={t.id}
                label={t.label}
                kind={t.id}
                accent={accent}
                selected={selected}
                disabled={disabled}
                onSelect={() => onUpdate({ token: t.id })}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface TokenOptionProps {
  label: string;
  kind: TokenKind;
  accent: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}

function TokenOption({ label, kind, accent, selected, disabled, onSelect }: TokenOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      title={disabled ? `${label} (já escolhida)` : label}
      style={{
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0,
        minHeight: 128,
        background: selected
          ? '#fff2c8'
          : disabled
            ? 'rgba(200, 180, 140, 0.35)'
            : 'rgba(255, 247, 214, 0.85)',
        border: selected ? `2px solid ${accent}` : '1px solid rgba(59, 43, 24, 0.3)',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transform: selected ? 'translateY(-1px)' : 'none',
        boxShadow: selected ? '0 3px 10px rgba(0, 0, 0, 0.18)' : 'none',
        transition: 'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
      }}
    >
      <div
        style={{
          flex: '1 1 auto',
          minHeight: 88,
          background:
            'radial-gradient(circle at 30% 25%, rgba(255, 245, 200, 0.6), transparent 60%),' +
            'linear-gradient(180deg, rgba(232, 214, 168, 0.35), rgba(201, 169, 107, 0.3))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TokenPreview kind={kind} color={selected ? accent : '#4a2b10'} size={88} />
      </div>
      <div
        style={{
          padding: '6px 4px',
          fontSize: '0.72rem',
          lineHeight: 1.2,
          textAlign: 'center',
          color: 'var(--ink)',
          fontWeight: selected ? 600 : 500,
          background: selected ? 'rgba(160, 65, 13, 0.08)' : 'rgba(59, 43, 24, 0.05)',
          borderTop: '1px solid rgba(59, 43, 24, 0.15)',
        }}
      >
        {label}
      </div>
    </button>
  );
}
