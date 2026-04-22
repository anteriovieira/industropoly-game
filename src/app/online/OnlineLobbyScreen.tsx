import { useEffect, useState } from 'react';
import { Parchment } from '@/ui/Parchment';
import { useUiStore } from '@/state/uiStore';
import { ensureAnonymousUser, isSupabaseConfigured } from '@/realtime/supabaseClient';
import { createRoom, findRoomByCode, joinRoom } from '@/realtime/roomsApi';
import { normalizeRoomCode } from '@/realtime/codeGen';

type Step = 'choose' | 'create' | 'join';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '1rem',
  fontFamily: 'inherit',
};

export function OnlineLobbyScreen() {
  const setPhase = useUiStore((s) => s.setPhase);
  const setActiveRoomId = useUiStore((s) => s.setActiveRoomId);
  const [step, setStep] = useState<Step>('choose');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlCode = new URL(window.location.href).searchParams.get('room');
    if (urlCode) {
      setCode(urlCode);
      setStep('join');
    }
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <Header title="Modo online indisponível" subtitle="Configuração ausente" />
        <p>
          As variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> não
          estão definidas neste build.
        </p>
        <Footer>
          <button className="primary" onClick={() => setPhase('intro')}>
            Voltar
          </button>
        </Footer>
      </Shell>
    );
  }

  async function handleCreate() {
    setError(null);
    if (!nickname.trim()) {
      setError('Informe um apelido');
      return;
    }
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
    if (!normalized) {
      setError('Código inválido');
      return;
    }
    if (!nickname.trim()) {
      setError('Informe um apelido');
      return;
    }
    setBusy(true);
    try {
      const userId = await ensureAnonymousUser();
      const room = await findRoomByCode(normalized);
      if (!room) {
        setError('Sala não encontrada');
        return;
      }
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
    <Shell>
      <Header title="Jogar online" subtitle="Salas com até 4 jogadores" />

      {step === 'choose' && (
        <>
          <p style={{ textAlign: 'center' }}>O que você quer fazer?</p>
          <Footer>
            <button
              className="primary"
              onClick={() => {
                setError(null);
                setStep('create');
              }}
            >
              Criar sala
            </button>
            <button
              className="primary"
              onClick={() => {
                setError(null);
                setStep('join');
              }}
            >
              Entrar com código
            </button>
          </Footer>
        </>
      )}

      {step === 'create' && (
        <>
          <p style={{ marginBottom: 6 }}>Apelido</p>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="Seu nome no jogo"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !busy) handleCreate();
            }}
            style={inputStyle}
          />
          <Footer>
            <button className="primary" onClick={handleCreate} disabled={busy}>
              {busy ? 'Criando…' : 'Criar sala'}
            </button>
          </Footer>
        </>
      )}

      {step === 'join' && (
        <>
          <p style={{ marginBottom: 6 }}>Código da sala</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ABCD-1234"
            autoFocus={!code}
            style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}
          />
          <p style={{ marginBottom: 6 }}>Apelido</p>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="Seu nome no jogo"
            autoFocus={Boolean(code)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !busy) handleJoin();
            }}
            style={inputStyle}
          />
          <Footer>
            <button className="primary" onClick={handleJoin} disabled={busy}>
              {busy ? 'Entrando…' : 'Entrar na sala'}
            </button>
          </Footer>
        </>
      )}

      {error && <p style={{ color: '#a00', marginTop: 16, textAlign: 'center' }}>{error}</p>}

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={goBack}>← Voltar</button>
      </div>
    </Shell>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="ind-stage"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'safe center',
        padding: 24,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Parchment
        padding="40px 44px"
        framed
        elevation="hero"
        style={{ maxWidth: 720, margin: 'auto 0', position: 'relative', zIndex: 1, width: '100%' }}
      >
        {children}
      </Parchment>
    </div>
  );
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      {subtitle && (
        <div className="ind-label" style={{ marginBottom: 10, textAlign: 'center' }}>
          {subtitle}
        </div>
      )}
      <h1 style={{ marginTop: 0, textAlign: 'center', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
        {title}
      </h1>
      <div
        aria-hidden="true"
        style={{
          height: 2,
          margin: '4px auto 18px',
          width: 180,
          background:
            'linear-gradient(90deg, transparent 0%, #8a6422 20%, #e8c26a 50%, #8a6422 80%, transparent 100%)',
          borderRadius: 2,
        }}
      />
    </>
  );
}

export function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
        flexWrap: 'wrap',
      }}
    >
      {children}
    </div>
  );
}
