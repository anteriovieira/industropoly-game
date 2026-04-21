import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { getStoryById } from '@/content/stories';

// Accessible read-out of the current board-center story. Read-only — closing
// it does not dispatch any engine action.
export function StoryModal() {
  const state = useGameStore((s) => s.state);
  const setOpen = useUiStore((s) => s.setStoryOpen);
  const story = getStoryById(state?.currentStoryId);

  return (
    <Modal title="História atual" onClose={() => setOpen(false)}>
      {!story ? (
        <em>Nenhuma história disponível ainda.</em>
      ) : (
        <>
          <strong>{story.title}</strong>
          <p style={{ margin: '8px 0', lineHeight: 1.55 }}>{story.body}</p>
          <small style={{ opacity: 0.75 }}>Fonte: {story.citation}</small>
        </>
      )}
    </Modal>
  );
}
