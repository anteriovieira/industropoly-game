import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { getStoryById } from '@/content/stories';

// Read-out of the current newspaper issue: masthead, edition number and every
// headline with its full body and citation. Read-only — closing it dispatches
// no engine action.
export function StoryModal() {
  const newspaper = useGameStore((s) => s.state?.currentNewspaper ?? null);
  const setOpen = useUiStore((s) => s.setStoryOpen);

  return (
    <Modal
      title={`📰 Jornal — Edição ${newspaper?.issueNumber ?? '—'}`}
      onClose={() => setOpen(false)}
    >
      {!newspaper || newspaper.headlineIds.length === 0 ? (
        <em>Nenhuma edição disponível ainda.</em>
      ) : (
        newspaper.headlineIds.map((id) => {
          const story = getStoryById(id);
          if (!story) return null;
          return (
            <article key={id} style={{ marginBottom: 18 }}>
              <strong>{story.title}</strong>
              <p style={{ margin: '6px 0', lineHeight: 1.55 }}>{story.body}</p>
              <small style={{ opacity: 0.75 }}>Fonte: {story.citation}</small>
            </article>
          );
        })
      )}
    </Modal>
  );
}
