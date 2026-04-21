import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';

export function FactsJournal() {
  const state = useGameStore((s) => s.state)!;
  const setOpen = useUiStore((s) => s.setJournalOpen);
  const tileEntries = state.factsJournal.filter((e) => e.kind === 'tile');
  const cardEntries = state.factsJournal.filter((e) => e.kind === 'card');

  return (
    <Modal title="Diário de Fatos" onClose={() => setOpen(false)}>
      {state.factsJournal.length === 0 && <em>Nenhum fato registrado ainda.</em>}
      {tileEntries.length > 0 && (
        <section>
          <h3>Lugares e Indústrias</h3>
          {tileEntries.map((e) => (
            <article key={`${e.kind}-${e.refId}`} style={{ marginBottom: 14 }}>
              <strong>{e.title}</strong> — <em>{e.date}</em>
              <p style={{ margin: '4px 0' }}>{e.blurb}</p>
              <small style={{ opacity: 0.75 }}>Fonte: {e.source}</small>
            </article>
          ))}
        </section>
      )}
      {cardEntries.length > 0 && (
        <section>
          <h3>Invenções e Editais</h3>
          {cardEntries.map((e) => (
            <article key={`${e.kind}-${e.refId}`} style={{ marginBottom: 14 }}>
              <strong>{e.title}</strong> — <em>{e.date}</em>
              <p style={{ margin: '4px 0' }}>{e.blurb}</p>
              <small style={{ opacity: 0.75 }}>Fonte: {e.source}</small>
            </article>
          ))}
        </section>
      )}
    </Modal>
  );
}
