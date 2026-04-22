import { useEffect, useState } from 'react';
import type { BroadcastEvent } from '@/realtime/types';

const EMOJIS = ['👍', '😂', '😱', '🎉', '🤔'];

interface Props {
  send: (ev: BroadcastEvent) => void;
  incoming: { userId: string; emoji: string; key: number } | null;
}

export function EmoteTray({ send, incoming }: Props) {
  const [recent, setRecent] = useState<{ key: number; emoji: string } | null>(null);

  useEffect(() => {
    if (!incoming) return;
    setRecent({ key: incoming.key, emoji: incoming.emoji });
    const t = setTimeout(() => setRecent((c) => (c?.key === incoming.key ? null : c)), 2000);
    return () => clearTimeout(t);
  }, [incoming]);

  return (
    <div style={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', gap: 8 }}>
      {EMOJIS.map((e) => (
        <button key={e} onClick={() => send({ type: 'emote', userId: '', emoji: e })} aria-label={`Reagir ${e}`}>
          {e}
        </button>
      ))}
      {recent && (
        <div style={{ position: 'absolute', bottom: 50, right: 0, fontSize: 32 }}>{recent.emoji}</div>
      )}
    </div>
  );
}
