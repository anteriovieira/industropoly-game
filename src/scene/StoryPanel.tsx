import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { BOARD, colors } from '@/ui/theme';
import { useGameStore } from '@/state/gameStore';
import { getStoryById } from '@/content/stories';

// Faded "handwritten letter" panel lying flat at the board's geometric center.
// Opacity, italic style and the soft ink color make it fade into the parchment
// so it reads like background texture — something you can catch up on during
// other players' turns. Dice and tokens render above it (different y / depth).
export function StoryPanel({ innerSize }: { innerSize: number }) {
  const storyId = useGameStore((s) => s.state?.currentStoryId ?? null);
  const story = getStoryById(storyId);

  // Slight deterministic z-tilt from the story id so the text has "character"
  // without spinning every render.
  const tilt = useMemo(() => {
    if (!storyId) return 0;
    let h = 0;
    for (let i = 0; i < storyId.length; i++) h = (h * 31 + storyId.charCodeAt(i)) | 0;
    // Small range: about ±1.5°
    return ((h % 60) - 30) / 30 * (Math.PI / 120);
  }, [storyId]);

  if (!story) return null;

  const y = BOARD.tileDepth / 2 + 0.025;
  const maxWidth = innerSize - 4;

  return (
    <group position={[0, y, 0]} rotation={[-Math.PI / 2, 0, tilt]}>
      {/* Title — small, italic, set one line above the body. */}
      <Text
        position={[0, 0.9, 0]}
        fontSize={0.36}
        color={colors.ink}
        anchorX="center"
        anchorY="middle"
        fontStyle="italic"
        maxWidth={maxWidth}
        fillOpacity={0.45}
        raycast={() => null}
      >
        {story.title}
      </Text>
      {/* Body — lowered opacity + italic gives the "letter" feel. */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.28}
        color={colors.inkSoft}
        anchorX="center"
        anchorY="middle"
        fontStyle="italic"
        textAlign="center"
        maxWidth={maxWidth}
        lineHeight={1.35}
        fillOpacity={0.35}
        raycast={() => null}
      >
        {story.body}
      </Text>
      {/* Citation — even fainter, small. */}
      <Text
        position={[0, -2.1, 0]}
        fontSize={0.18}
        color={colors.inkSoft}
        anchorX="center"
        anchorY="middle"
        fontStyle="italic"
        maxWidth={maxWidth}
        fillOpacity={0.3}
        raycast={() => null}
      >
        — {story.citation}
      </Text>
    </group>
  );
}
