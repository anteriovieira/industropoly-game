import { useEffect, useState, useCallback } from 'react';
import { useUiStore } from '@/state/uiStore';
import { ensureAnonymousUser, getSupabase } from '@/realtime/supabaseClient';
import { listMembers, leaveRoom, appendAction, setCurrentPlayer } from '@/realtime/roomsApi';
import type { RoomMemberRow, RoomRow } from '@/realtime/types';
import type { TokenKind } from '@/engine/types';
import { Shell, Header, Footer } from './OnlineLobbyScreen';

const TOKENS: TokenKind[] = ['locomotive', 'top-hat', 'cotton-bobbin', 'pickaxe'];

export function RoomLobbyScreen() {
  const roomId = useUiStore((s) => s.activeRoomId);
  const setPhase = useUiStore((s) => s.setPhase);
  const [members, setMembers] = useState<RoomMemberRow[]>([]);
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [consolationMoveOnWrong, setConsolationMoveOnWrong] = useState(false);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const [membersRes, roomRes] = await Promise.all([
      listMembers(roomId),
      getSupabase().from('rooms').select('*').eq('id', roomId).single(),
    ]);
    setMembers(membersRes);
    if (roomRes.data) setRoom(roomRes.data as RoomRow);
  }, [roomId]);

  useEffect(() => {
    ensureAnonymousUser().then(setUserId);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [roomId, refresh]);

  // Guests transition to the game when the host starts it — the append_action
  // RPC flips rooms.status to 'in_game'. Host already navigated locally in
  // handleStart; this branch is for everyone else.
  useEffect(() => {
    if (room?.status === 'in_game') setPhase('game');
  }, [room?.status, setPhase]);

  const me = members.find((m) => m.user_id === userId) ?? null;
  const players = members
    .filter((m) => m.role === 'player')
    .sort((a, b) => (a.seat_index ?? 0) - (b.seat_index ?? 0));
  const isHost = me && players[0]?.user_id === me.user_id;

  const shareUrl = room
    ? `${window.location.origin}${window.location.pathname}?room=${room.code}`
    : '';

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: selected text; user can Ctrl+C.
    }
  }

  async function handleStart() {
    if (!roomId || !userId) return;
    if (players.length < 2) {
      setError('Precisa de pelo menos 2 jogadores');
      return;
    }
    setBusy(true);
    try {
      const seed = Math.floor(Math.random() * 0xffffffff);
      await appendAction(roomId, {
        type: 'GAME_START',
        seed,
        options: { consolationMoveOnWrong },
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
    <Shell>
      <Header title="Sala de espera" subtitle={room ? `Código ${room.code}` : 'Carregando…'} />

      <p style={{ textAlign: 'center' }}>
        {isHost
          ? 'Compartilhe o link com os outros jogadores. A partida começa quando você clicar em iniciar.'
          : 'Aguardando o host iniciar a partida.'}
      </p>

      {isHost && room && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            style={{ flex: 1, minWidth: 240, padding: '10px 12px', fontSize: '0.95rem' }}
            aria-label="Link de convite"
          />
          <button className="primary" onClick={handleCopy}>
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>
      )}

      <h2 style={{ marginBottom: 8 }}>Jogadores ({players.length}/4)</h2>
      <ul style={{ marginTop: 0, paddingLeft: 20 }}>
        {players.map((p) => (
          <li key={p.user_id}>
            Assento {p.seat_index! + 1}: {p.nickname}
            {p.user_id === userId ? ' (você)' : ''}
          </li>
        ))}
      </ul>

      {members.some((m) => m.role === 'spectator') && (
        <>
          <h2 style={{ marginBottom: 8 }}>Espectadores</h2>
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {members
              .filter((m) => m.role === 'spectator')
              .map((s) => (
                <li key={s.user_id}>{s.nickname}</li>
              ))}
          </ul>
        </>
      )}

      {isHost && (
        <>
          <h2 style={{ marginBottom: 8 }}>Configurações</h2>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: '0.9rem',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            <input
              type="checkbox"
              checked={consolationMoveOnWrong}
              onChange={(e) => setConsolationMoveOnWrong(e.target.checked)}
              style={{ marginTop: 4 }}
            />
            <span>
              Avançar uma casa ao errar a pergunta
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                Se desligado, quem erra fica parado e termina o turno.
              </span>
            </span>
          </label>
        </>
      )}

      <Footer>
        <button onClick={handleLeave}>Sair da sala</button>
        {isHost && (
          <button
            className="primary"
            onClick={handleStart}
            disabled={busy || players.length < 2}
          >
            {busy ? 'Iniciando…' : 'Iniciar partida'}
          </button>
        )}
      </Footer>

      {error && <p style={{ color: '#a00', marginTop: 16, textAlign: 'center' }}>{error}</p>}
    </Shell>
  );
}
