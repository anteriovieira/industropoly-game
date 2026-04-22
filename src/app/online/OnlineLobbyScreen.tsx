import { useEffect, useState } from 'react';
import { Parchment } from '@/ui/Parchment';
import { useUiStore } from '@/state/uiStore';
import { ensureAnonymousUser, isSupabaseConfigured } from '@/realtime/supabaseClient';
import { createRoom, findRoomByCode, joinRoom } from '@/realtime/roomsApi';
import { normalizeRoomCode } from '@/realtime/codeGen';

type Step = 'choose' | 'create' | 'join';

export function OnlineLobbyScreen() {
  const setPhase = useUiStore((s) => s.setPhase);
  const setActiveRoomId = useUiStore((s) => s.setActiveRoomId);
  const [step, setStep] = useState<Step>('choose');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shared invite link: ?room=CODE → jump straight to the join step with the code prefilled.
  useEffect(() => {
    const urlCode = new URL(window.location.href).searchParams.get('room');
    if (urlCode) {
      setCode(urlCode);
      setStep('join');
    }
  }, []);

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
    if (!nickname.trim()) { setError('Informe um apelido'); return; }
    setBusy(true);
    try {
      await ensureAnonymousUser();
      const { id } = await createRoom(nickname.trim());
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
    if (!nickname.trim()) { setError('Informe um apelido'); return; }
    setBusy(true);
    try {
      const userId = await ensureAnonymousUser();
      const room = await findRoomByCode(normalized);
      if (!room) { setError('Sala não encontrada'); return; }
      await joinRoom(room.id, userId, nickname.trim(), null);
      setActiveRoomId(room.id);
      setPhase('online-room');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    setError(null);
    if (step === 'choose') setPhase('intro');
    else setStep('choose');
  }

  return (
    <div className="ind-stage" style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
      <Parchment padding="32px 40px" framed style={{ maxWidth: 520, width: '100%' }}>
        <h1 style={{ marginTop: 0 }}>Jogar online</h1>

        {step === 'choose' && (
          <>
            <p>O que você quer fazer?</p>
            <button
              className="primary hero"
              onClick={() => { setError(null); setStep('create'); }}
              style={{ width: '100%', marginBottom: 12 }}
            >
              Criar sala
            </button>
            <button
              className="primary"
              onClick={() => { setError(null); setStep('join'); }}
              style={{ width: '100%' }}
            >
              Entrar com código
            </button>
          </>
        )}

        {step === 'create' && (
          <>
            <p style={{ marginBottom: 4 }}>Apelido</p>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              placeholder="Seu nome no jogo"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && !busy) handleCreate(); }}
              style={{ width: '100%', padding: 8, marginBottom: 16 }}
            />
            <button
              className="primary hero"
              onClick={handleCreate}
              disabled={busy}
              style={{ width: '100%' }}
            >
              {busy ? 'Criando…' : 'Criar sala'}
            </button>
          </>
        )}

        {step === 'join' && (
          <>
            <p style={{ marginBottom: 4 }}>Código da sala</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ABCD-1234"
              autoFocus={!code}
              style={{
                width: '100%',
                padding: 8,
                marginBottom: 16,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            />
            <p style={{ marginBottom: 4 }}>Apelido</p>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              placeholder="Seu nome no jogo"
              autoFocus={Boolean(code)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !busy) handleJoin(); }}
              style={{ width: '100%', padding: 8, marginBottom: 16 }}
            />
            <button
              className="primary hero"
              onClick={handleJoin}
              disabled={busy}
              style={{ width: '100%' }}
            >
              {busy ? 'Entrando…' : 'Entrar na sala'}
            </button>
          </>
        )}

        {error && <p style={{ color: '#a00', marginTop: 16 }}>{error}</p>}

        <button onClick={goBack} style={{ marginTop: 24 }}>← Voltar</button>
      </Parchment>
    </div>
  );
}
