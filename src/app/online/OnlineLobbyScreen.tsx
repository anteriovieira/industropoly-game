import { useState } from 'react';
import { Parchment } from '@/ui/Parchment';
import { useUiStore } from '@/state/uiStore';
import { ensureAnonymousUser, isSupabaseConfigured } from '@/realtime/supabaseClient';
import { createRoom, findRoomByCode, joinRoom } from '@/realtime/roomsApi';
import { normalizeRoomCode } from '@/realtime/codeGen';

export function OnlineLobbyScreen() {
  const setPhase = useUiStore((s) => s.setPhase);
  const setActiveRoomId = useUiStore((s) => s.setActiveRoomId);
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <div className="ind-stage" style={{ padding: 24 }}>
        <Parchment padding="32px">
          <h2>Modo online indisponível</h2>
          <p>
            As variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> não
            estão definidas neste build.
          </p>
          <button className="primary" onClick={() => setPhase('intro')}>Voltar</button>
        </Parchment>
      </div>
    );
  }

  async function handleCreate() {
    setError(null);
    setBusy(true);
    try {
      await ensureAnonymousUser();
      const { id } = await createRoom(nickname.trim() || 'Jogador');
      setActiveRoomId(id);
      setPhase('online-room');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    setError(null);
    const normalized = normalizeRoomCode(code);
    if (!normalized) { setError('Código inválido'); return; }
    setBusy(true);
    try {
      const userId = await ensureAnonymousUser();
      const room = await findRoomByCode(normalized);
      if (!room) { setError('Sala não encontrada'); return; }
      await joinRoom(room.id, userId, nickname.trim() || 'Jogador', null);
      setActiveRoomId(room.id);
      setPhase('online-room');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ind-stage" style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
      <Parchment padding="32px 40px" framed style={{ maxWidth: 520 }}>
        <h1 style={{ marginTop: 0 }}>Jogar online</h1>
        <p>Apelido</p>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          style={{ width: '100%', padding: 8, marginBottom: 16 }}
        />

        <button className="primary hero" onClick={handleCreate} disabled={busy} style={{ width: '100%', marginBottom: 24 }}>
          Criar sala
        </button>

        <hr style={{ margin: '16px 0' }} />

        <p>Entrar com código</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD-1234"
          style={{ width: '100%', padding: 8, marginBottom: 8, textTransform: 'uppercase' }}
        />
        <button className="primary" onClick={handleJoin} disabled={busy} style={{ width: '100%' }}>
          Entrar
        </button>

        {error && <p style={{ color: '#a00', marginTop: 16 }}>{error}</p>}

        <button onClick={() => setPhase('intro')} style={{ marginTop: 24 }}>← Voltar</button>
      </Parchment>
    </div>
  );
}
