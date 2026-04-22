import { useEffect, useRef, useState } from 'react';
import { getSupabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { BroadcastEvent, GameActionRow, PresenceState } from './types';

interface UseRoomChannelOptions {
  roomId: string;
  userId: string;
  seatIndex: number | null;
  onAction: (row: GameActionRow) => void;
  onBroadcast: (ev: BroadcastEvent) => void;
}

export function useRoomChannel({
  roomId,
  userId,
  seatIndex,
  onAction,
  onBroadcast,
}: UseRoomChannelOptions) {
  const [presence, setPresence] = useState<PresenceState[]>([]);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const cbs = useRef({ onAction, onBroadcast });
  cbs.current = { onAction, onBroadcast };

  useEffect(() => {
    if (!roomId || !userId) return;
    const supabase = getSupabase();
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: userId } },
    });
    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_actions', filter: `room_id=eq.${roomId}` },
        (payload) => cbs.current.onAction(payload.new as GameActionRow),
      )
      .on('broadcast', { event: '*' }, (payload) => {
        cbs.current.onBroadcast(payload.payload as BroadcastEvent);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const flat: PresenceState[] = [];
        for (const key of Object.keys(state)) for (const p of state[key]!) flat.push(p);
        setPresence(flat);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          await channel.track({ user_id: userId, seat_index: seatIndex, status: 'online' });
        } else {
          setConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, userId, seatIndex]);

  function sendBroadcast(event: BroadcastEvent) {
    channelRef.current?.send({ type: 'broadcast', event: event.type, payload: event });
  }

  return { presence, connected, sendBroadcast };
}
