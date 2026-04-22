import { useEffect, useState, useCallback } from 'react';
import { Parchment } from '@/ui/Parchment';
import { useUiStore } from '@/state/uiStore';
import { ensureAnonymousUser, getSupabase } from '@/realtime/supabaseClient';
import { listMembers, leaveRoom, appendAction, setCurrentPlayer } from '@/realtime/roomsApi';
import type { RoomMemberRow, RoomRow } from '@/realtime/types';
import type { TokenKind } from '@/engine/types';

const TOKENS: TokenKind[] = ['locomotive', 'top-hat', 'cotton-bobbin', 'pickaxe'];

export function RoomLobbyScreen() {
  const roomId = useUiStore((s) => s.activeRoomId);
  const setPhase = useUiStore((s) => s.setPhase);
  const [members, setMembers] = useState<RoomMemberRow[]>([]);
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    setMembers(await listMembers(roomId));
  }, [roomId]);

  useEffect(() => {
    ensureAnonymousUser().then(setUserId);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    refresh();
    getSupabase().from('rooms').select('*').eq('id', roomId).single().then(({ data }) => {
      if (data) setRoom(data as RoomRow);
    });
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [roomId, refresh]);

  const me = members.find((m) => m.user_id === userId) ?? null;
  const players = members.filter((m) => m.role === 'player').sort((a, b) => (a.seat_index ?? 0) - (b.seat_index ?? 0));
  const isHost = me && players[0]?.user_id === me.user_id;

  async function handleStart() {
    if (!roomId || !userId) return;
    if (players.length < 2) { setError('Precisa de pelo menos 2 jogadores'); return; }
    setBusy(true);
    try {
      const seed = Math.floor(Math.random() * 0xffffffff);
      await appendAction(roomId, {
        type: 'GAME_START',
        seed,
        players: players.map((p) => ({
          user_id: p.user_id,
          seat_index: p.seat_index!,
          name: p.nickname,
          token: TOKENS[p.seat_index!]!,
        })),
      } as never);
      await setCurrentPlayer(roomId, players[0]!.user_id);
      setPhase('game');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!roomId || !userId) return;
    await leaveRoom(roomId, userId);
    setPhase('online-lobby');
  }

  if (!roomId) return null;

  return (
    <div className="ind-stage" style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
      <Parchment padding="32px 40px" framed style={{ maxWidth: 520 }}>
        <h1 style={{ marginTop: 0 }}>Sala</h1>
        {room && (
          <p style={{ fontSize: '1.4rem', letterSpacing: 2 }}>
            Código: <strong>{room.code}</strong>
          </p>
        )}
        <p>Compartilhe o código com os outros jogadores. A partida começa quando o host clicar em "Iniciar".</p>

        <h2>Jogadores ({players.length}/4)</h2>
        <ul>
          {players.map((p) => (
            <li key={p.user_id}>
              Assento {p.seat_index! + 1}: {p.nickname} {p.user_id === userId ? '(você)' : ''}
            </li>
          ))}
        </ul>

        <h2>Espectadores</h2>
        <ul>
          {members.filter((m) => m.role === 'spectator').map((s) => (
            <li key={s.user_id}>{s.nickname}</li>
          ))}
        </ul>

        {isHost && (
          <button
            className="primary hero"
            onClick={handleStart}
            disabled={busy || players.length < 2}
            style={{ width: '100%', marginTop: 16 }}
          >
            Iniciar partida
          </button>
        )}
        <button onClick={handleLeave} style={{ marginTop: 12 }}>Sair da sala</button>
        {error && <p style={{ color: '#a00' }}>{error}</p>}
      </Parchment>
    </div>
  );
}
