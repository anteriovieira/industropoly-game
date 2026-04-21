import { useAudioStore } from '@/state/audioStore';

export function MuteButton() {
  const muted = useAudioStore((s) => s.muted);
  const toggle = useAudioStore((s) => s.toggleMuted);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? 'Ativar som' : 'Desativar som'}
      title={muted ? 'Som desativado' : 'Som ativado'}
      className="ghost"
      style={{
        width: 44,
        height: 44,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
      }}
    >
      <SpeakerIcon muted={muted} />
    </button>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10v4h4l5 4V6L8 10H4z" fill="currentColor" stroke="none" />
      {muted ? (
        <>
          <line x1="17" y1="9" x2="22" y2="14" />
          <line x1="22" y1="9" x2="17" y2="14" />
        </>
      ) : (
        <>
          <path d="M17 8c1.5 1.5 1.5 6.5 0 8" />
          <path d="M19.5 5.5c3 3 3 10 0 13" />
        </>
      )}
    </svg>
  );
}
