import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { Parchment } from '@/ui/Parchment';
import { clear } from '@/lib/persist';

export function SummaryScreen() {
  const state = useGameStore((s) => s.state)!;
  const clearStore = useGameStore((s) => s.clear);
  const setPhase = useUiStore((s) => s.setPhase);

  const winner = state.winner ? state.players.find((p) => p.id === state.winner) : null;
  const tileEntries = state.factsJournal.filter((e) => e.kind === 'tile');
  const cardEntries = state.factsJournal.filter((e) => e.kind === 'card');

  function newGame(): void {
    clear();
    clearStore();
    setPhase('intro');
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        overflow: 'auto',
        background: 'linear-gradient(#1a120a, #342410)',
      }}
    >
      <Parchment padding={32} style={{ maxWidth: 760, width: '100%' }}>
        <h1 style={{ marginTop: 0 }}>O Tabuleiro Silencia</h1>
        {winner ? (
          <p style={{ fontSize: '1.1rem' }}>
            <strong>{winner.name}</strong> permanece como o último industrial solvente.
          </p>
        ) : (
          <p>Não foi possível determinar um vencedor.</p>
        )}

        <h3>Classificação Final</h3>
        <ol>
          {state.players.map((p) => (
            <li key={p.id}>
              {p.name}: {p.bankrupt ? <em>falido</em> : <>£{p.cash}</>}
            </li>
          ))}
        </ol>

        <h3>O que a mesa aprendeu</h3>
        {tileEntries.length > 0 && (
          <section>
            <h4>Lugares e Indústrias</h4>
            {tileEntries.map((e) => (
              <article key={`${e.kind}-${e.refId}`} style={{ marginBottom: 12 }}>
                <strong>{e.title}</strong> — <em>{e.date}</em>
                <p style={{ margin: '4px 0' }}>{e.blurb}</p>
                <small style={{ opacity: 0.75 }}>Fonte: {e.source}</small>
              </article>
            ))}
          </section>
        )}
        {cardEntries.length > 0 && (
          <section>
            <h4>Invenções e Editais</h4>
            {cardEntries.map((e) => (
              <article key={`${e.kind}-${e.refId}`} style={{ marginBottom: 12 }}>
                <strong>{e.title}</strong> — <em>{e.date}</em>
                <p style={{ margin: '4px 0' }}>{e.blurb}</p>
                <small style={{ opacity: 0.75 }}>Fonte: {e.source}</small>
              </article>
            ))}
          </section>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="primary" onClick={newGame}>
            Novo Jogo
          </button>
        </div>
      </Parchment>
    </div>
  );
}
