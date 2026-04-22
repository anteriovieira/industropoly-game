import { useEffect, useMemo, useRef, useState } from 'react';
import { useUiStore } from '@/state/uiStore';
import { ensureAnonymousUser } from '@/realtime/supabaseClient';
import { createOnlineGameStore } from '@/realtime/onlineGameStore';
import { useRoomChannel } from '@/realtime/useRoomChannel';
import { fetchActions, listMembers, appendAction } from '@/realtime/roomsApi';
import { useGameStore } from '@/state/gameStore';
import { GameScreen } from '../GameScreen';
import { EmoteTray } from '@/ui/hud/EmoteTray';
import { ConnectionBanner } from '@/ui/hud/ConnectionBanner';
import type { GameActionRow, RoomMemberRow, BroadcastEvent } from '@/realtime/types';
import type { Action, TokenKind } from '@/engine/types';

const TOKENS: TokenKind[] = ['locomotive', 'top-hat', 'cotton-bobbin', 'pickaxe'];

export function OnlineGameContainer() {
  const roomId = useUiStore((s) => s.activeRoomId)!;
  const [userId, setUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<RoomMemberRow[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);

  const onlineStore = useMemo(
    () => createOnlineGameStore({ append: (a) => appendAction(roomId, a) }),
    [roomId],
  );

  const loadGameState = useGameStore((s) => s.loadState);

  useEffect(() => {
    ensureAnonymousUser().then(setUserId);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    listMembers(roomId).then(setMembers);
  }, [roomId]);

  // Bootstrap: fetch GAME_START + replay all actions.
  useEffect(() => {
    if (!roomId || bootstrapped || members.length === 0) return;
    let cancelled = false;
    (async () => {
      const all = await fetchActions(roomId);
      if (cancelled) return;
      const startRow = all.find((r) => (r.action as { type: string }).type === 'GAME_START');
      if (!startRow) return;
      const startAction = startRow.action as unknown as { seed: number; players: { seat_index: number; name: string }[] };
      const playersInput = startAction.players
        .slice()
        .sort((a, b) => a.seat_index - b.seat_index)
        .map((p) => ({ name: p.name, token: TOKENS[p.seat_index]! }));
      onlineStore.getState().initialize(startAction.seed, playersInput);
      for (const row of all.filter((r) => r.seq > startRow.seq)) {
        onlineStore.getState().applyRemoteAction({ seq: row.seq, action: row.action });
      }
      const state = onlineStore.getState().state;
      if (state) loadGameState(state);
      setBootstrapped(true);
    })();
    return () => { cancelled = true; };
  }, [roomId, bootstrapped, members, onlineStore, loadGameState]);

  const seatIndex = members.find((m) => m.user_id === userId)?.seat_index ?? null;

  const [incoming, setIncoming] = useState<{ userId: string; emoji: string; key: number } | null>(null);
  const broadcastRef = useRef<((ev: BroadcastEvent) => void) | null>(null);

  const channelCbsRef = useRef({
    onAction: (row: GameActionRow) => {
      onlineStore.getState().applyRemoteAction({ seq: row.seq, action: row.action as Action });
      const state = onlineStore.getState().state;
      if (state) loadGameState(state);
    },
    onBroadcast: (ev: BroadcastEvent) => {
      if (ev.type === 'emote') setIncoming({ userId: ev.userId, emoji: ev.emoji, key: Date.now() });
    },
  });

  const channel = useRoomChannel({
    roomId,
    userId: userId ?? '',
    seatIndex,
    onAction: (row) => channelCbsRef.current.onAction(row),
    onBroadcast: (ev) => channelCbsRef.current.onBroadcast(ev),
  });
  broadcastRef.current = channel.sendBroadcast;

  useEffect(() => {
    if (!roomId || members.length === 0) return;
    const gameStoreApi = useGameStore;
    const original = gameStoreApi.getState().dispatch;
    gameStoreApi.setState({
      dispatch: (action: Action) => {
        onlineStore.getState().dispatch(action);
        if (action.type === 'END_TURN') {
          const state = onlineStore.getState().state;
          if (!state) return;
          const players = members.filter((m) => m.role === 'player').sort((a, b) => (a.seat_index ?? 0) - (b.seat_index ?? 0));
          if (players.length === 0) return;
          const nextSeat = (state.activePlayerIndex + 1) % players.length;
          const nextUserId = players[nextSeat]!.user_id;
          import('@/realtime/roomsApi').then((mod) => mod.setCurrentPlayer(roomId, nextUserId).catch(console.error));
        }
      },
    });
    return () => {
      gameStoreApi.setState({ dispatch: original });
    };
  }, [members, onlineStore, roomId]);

  const wasConnectedRef = useRef(false);
  useEffect(() => {
    if (channel.connected && !wasConnectedRef.current && bootstrapped) {
      (async () => {
        const sinceSeq = onlineStore.getState().lastSeq;
        const rows = await fetchActions(roomId, sinceSeq);
        for (const r of rows) {
          onlineStore.getState().applyRemoteAction({ seq: r.seq, action: r.action });
        }
        const state = onlineStore.getState().state;
        if (state) loadGameState(state);
      })();
    }
    wasConnectedRef.current = channel.connected;
  }, [channel.connected, bootstrapped, onlineStore, roomId, loadGameState]);

  if (!bootstrapped) return <div style={{ padding: 24 }}>Carregando partida…</div>;
  return (
    <>
      <ConnectionBanner connected={channel.connected} />
      <GameScreen />
      <EmoteTray
        send={(ev) => broadcastRef.current?.({ ...ev, userId: userId ?? '' })}
        incoming={incoming}
      />
    </>
  );
}
