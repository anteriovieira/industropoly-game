import { useEffect, useState, type CSSProperties } from 'react';
import type { Card } from '@/engine/types';
import { prefersReducedMotion } from '@/scene/animTiming';

// Plays a brief (≈1s) cinematic of a deck of cards shuffling into view, the
// top card lifting off, and flipping over to reveal its face. When the
// sequence finishes, `onDone` fires and the caller (CardModal) swaps in the
// full modal with educational content.
//
// With prefers-reduced-motion the whole thing collapses to an instant reveal
// so the player can still read the card without motion fatigue.

type Phase = 'stack' | 'lift' | 'flip' | 'reveal';

const PHASE_DELAYS: Record<Exclude<Phase, 'stack'>, number> = {
  lift: 260,
  flip: 520,
  reveal: 820,
};
const DONE_DELAY = 1020;

export function CardDrawAnimation({
  card,
  onDone,
}: {
  card: Card;
  onDone: () => void;
}) {
  const reduced = prefersReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduced ? 'reveal' : 'stack');

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(onDone, 120);
      return () => clearTimeout(t);
    }
    const timers = [
      setTimeout(() => setPhase('lift'), PHASE_DELAYS.lift),
      setTimeout(() => setPhase('flip'), PHASE_DELAYS.flip),
      setTimeout(() => setPhase('reveal'), PHASE_DELAYS.reveal),
      setTimeout(onDone, DONE_DELAY),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced, onDone]);

  const deckLabel = card.deck === 'invention' ? 'Baralho de Invenções' : 'Baralho de Editais';
  const emblem = card.deck === 'invention' ? INVENTION_EMBLEM : EDICT_EMBLEM;
  const topCardTransform = transformForPhase(phase);

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background:
          'radial-gradient(ellipse at center, rgba(15, 9, 4, 0.72) 0%, rgba(5, 3, 1, 0.9) 100%)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 55,
        animation: 'indModalBackdrop 180ms ease-out',
      }}
    >
      <div
        style={{
          display: 'grid',
          justifyItems: 'center',
          gap: 18,
          perspective: '1400px',
        }}
      >
        <div
          className="ind-label"
          style={{
            color: '#f3d886',
            letterSpacing: '0.18em',
            opacity: phase === 'stack' ? 0 : 1,
            transition: 'opacity 320ms ease',
          }}
        >
          {deckLabel}
        </div>

        <div
          style={{
            position: 'relative',
            width: 168,
            height: 240,
            transformStyle: 'preserve-3d',
          }}
        >
          <CardBack style={staticCardStyle(2)} emblem={emblem} />
          <CardBack style={staticCardStyle(1)} emblem={emblem} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformStyle: 'preserve-3d',
              transform: topCardTransform,
              transition: 'transform 340ms cubic-bezier(0.34, 1.28, 0.5, 1)',
              willChange: 'transform',
            }}
          >
            <CardBack
              emblem={emblem}
              style={{
                ...absolute,
                backfaceVisibility: 'hidden',
              }}
            />
            <CardFront
              title={card.title}
              deckLabel={card.deck === 'invention' ? 'Invenção' : 'Edital'}
              style={{
                ...absolute,
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const absolute: CSSProperties = { position: 'absolute', inset: 0 };

function staticCardStyle(depth: number): CSSProperties {
  // Stacked deck offset — higher depth pushes the card down-right and darkens it.
  const offset = depth * 4;
  return {
    position: 'absolute',
    inset: 0,
    transform: `translate(${offset}px, ${offset}px)`,
    filter: `brightness(${1 - depth * 0.12})`,
  };
}

function transformForPhase(phase: Phase): string {
  switch (phase) {
    case 'stack':
      return 'translateY(-8px) translateZ(0) rotateY(0deg)';
    case 'lift':
      return 'translateY(-44px) translateZ(48px) rotateY(0deg)';
    case 'flip':
      return 'translateY(-44px) translateZ(48px) rotateY(180deg)';
    case 'reveal':
      return 'translateY(-44px) translateZ(48px) rotateY(180deg) scale(1.04)';
  }
}

// A static "card back" — parchment panel with double brass border + emblem.
function CardBack({
  emblem,
  style,
}: {
  emblem: JSX.Element;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        ...style,
        width: 168,
        height: 240,
        borderRadius: 10,
        background:
          'linear-gradient(140deg, #2a1a0c 0%, #3a2a14 45%, #20130a 100%)',
        boxShadow:
          '0 10px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(138, 100, 34, 0.85), inset 0 1px 0 rgba(250, 226, 160, 0.18)',
        display: 'grid',
        placeItems: 'center',
        padding: 12,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 6,
          border: '1px solid rgba(232, 194, 106, 0.65)',
          display: 'grid',
          placeItems: 'center',
          background:
            'radial-gradient(ellipse at center, rgba(201, 148, 58, 0.15) 0%, transparent 70%)',
        }}
      >
        <div style={{ color: '#e8c26a', opacity: 0.9 }}>{emblem}</div>
      </div>
    </div>
  );
}

// A "card front" shown during the flip — parchment panel showing the card's
// title. Kept deliberately spare; the full Modal takes over once the
// animation completes.
function CardFront({
  title,
  deckLabel,
  style,
}: {
  title: string;
  deckLabel: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        ...style,
        width: 168,
        height: 240,
        borderRadius: 10,
        background:
          'linear-gradient(180deg, #f3e3b6 0%, #e2cd92 55%, #d4ba7a 100%)',
        boxShadow:
          '0 12px 28px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(138, 100, 34, 0.9), inset 0 1px 0 rgba(250, 226, 160, 0.5)',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        padding: 14,
        color: '#1a0e06',
      }}
    >
      <div
        className="ind-label"
        style={{
          color: '#8a6422',
          letterSpacing: '0.14em',
          fontSize: '0.7rem',
          textAlign: 'center',
          borderBottom: '1px solid rgba(138, 100, 34, 0.5)',
          paddingBottom: 6,
          marginBottom: 8,
        }}
      >
        {deckLabel}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1rem',
          lineHeight: 1.25,
          textAlign: 'center',
          alignSelf: 'center',
        }}
      >
        {title}
      </div>
    </div>
  );
}

const INVENTION_EMBLEM = (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="7" />
      <circle cx="24" cy="24" r="2.2" fill="currentColor" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x1 = 24 + Math.cos(a) * 9;
        const y1 = 24 + Math.sin(a) * 9;
        const x2 = 24 + Math.cos(a) * 15;
        const y2 = 24 + Math.sin(a) * 15;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </g>
  </svg>
);

const EDICT_EMBLEM = (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 10 h28 v22 q0 6 -6 6 h-22 q-6 0 -6 -6 v-16 q0 -6 6 -6" />
      <path d="M4 16 q6 0 6 6 v10" />
      <circle cx="32" cy="24" r="4" />
      <line x1="14" y1="18" x2="26" y2="18" />
      <line x1="14" y1="24" x2="24" y2="24" />
    </g>
  </svg>
);
