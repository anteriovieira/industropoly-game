import type { PresenceState } from '@/realtime/types';

export function PresenceDots({ presence, seatCount }: { presence: PresenceState[]; seatCount: number }) {
  const bySeat = new Map<number, PresenceState>();
  for (const p of presence) if (p.seat_index != null) bySeat.set(p.seat_index, p);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: seatCount }, (_, i) => {
        const p = bySeat.get(i);
        const color = p?.status === 'online' ? '#3a3' : p?.status === 'away' ? '#aa3' : '#999';
        return (
          <span
            key={i}
            title={p ? `Assento ${i + 1}: ${p.status}` : `Assento ${i + 1}: offline`}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: color,
              display: 'inline-block',
            }}
          />
        );
      })}
    </div>
  );
}
