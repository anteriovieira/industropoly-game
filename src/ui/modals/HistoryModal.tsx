import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';

export function HistoryModal() {
  const log = useGameStore((s) => s.state?.log) ?? [];
  const setOpen = useUiStore((s) => s.setHistoryOpen);

  // Newest events on top.
  const entries = log.slice().reverse();

  return (
    <Modal title="Histórico de Eventos" onClose={() => setOpen(false)}>
      {entries.length === 0 ? (
        <em style={{ opacity: 0.75 }}>Nenhum evento registrado ainda.</em>
      ) : (
        <ol
          aria-label="Eventos do jogo, do mais recente ao mais antigo"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {entries.map((msg, i) => {
            const n = log.length - i;
            return (
              <li
                key={`${n}-${msg}`}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'baseline',
                  padding: '6px 8px',
                  borderRadius: 4,
                  background:
                    i % 2 === 0 ? 'rgba(59,43,24,0.06)' : 'transparent',
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '0.75rem',
                    opacity: 0.55,
                    minWidth: 36,
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono, monospace)',
                    flexShrink: 0,
                  }}
                >
                  #{n}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>{msg}</span>
              </li>
            );
          })}
        </ol>
      )}
    </Modal>
  );
}
