import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Parchment } from './Parchment';
import { useAudioStore } from '@/state/audioStore';
import { audio } from '@/lib/audio';

interface HudMenuProps {
  shakeSupported: boolean;
  shakeEnabled: boolean;
  onOpenJournal: () => void;
  onOpenStory: () => void;
  onOpenAcquisitions: () => void;
  onResetCamera: () => void;
  onToggleShake: () => void;
  onRequestQuit: () => void;
}

export function HudMenu({
  shakeSupported,
  shakeEnabled,
  onOpenJournal,
  onOpenStory,
  onOpenAcquisitions,
  onResetCamera,
  onToggleShake,
  onRequestQuit,
}: HudMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(e: PointerEvent): void {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function runAndClose(fn: () => void): void {
    fn();
    setOpen(false);
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu"
        title="Menu"
        onClick={() => {
          audio.play('click');
          setOpen((o) => !o);
        }}
      >
        ☰ Menu
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            right: 0,
            minWidth: 260,
            zIndex: 20,
          }}
        >
          <Parchment padding={8} style={{ borderRadius: 10 }}>
            <MenuItem
              onClick={() =>
                runAndClose(() => {
                  audio.play('click');
                  onOpenJournal();
                })
              }
            >
              📔 Diário <Shortcut>J</Shortcut>
            </MenuItem>
            <MenuItem
              onClick={() =>
                runAndClose(() => {
                  audio.play('click');
                  onOpenStory();
                })
              }
            >
              📰 Jornal <Shortcut>H</Shortcut>
            </MenuItem>
            <MenuItem
              onClick={() =>
                runAndClose(() => {
                  audio.play('click');
                  onOpenAcquisitions();
                })
              }
            >
              🏭 Aquisições <Shortcut>A</Shortcut>
            </MenuItem>
            <MenuItem
              onClick={() =>
                runAndClose(() => {
                  audio.play('click');
                  onResetCamera();
                })
              }
            >
              🎯 Centralizar câmera <Shortcut>C</Shortcut>
            </MenuItem>

            <Divider />

            <MuteMenuItem />
            {shakeSupported && (
              <MenuItem
                onClick={() =>
                  runAndClose(() => {
                    onToggleShake();
                  })
                }
                aria-pressed={shakeEnabled}
              >
                {shakeEnabled ? '📳' : '📴'} Chacoalhar para lançar
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.75rem',
                    opacity: 0.7,
                  }}
                >
                  {shakeEnabled ? 'ligado' : 'desligado'}
                </span>
              </MenuItem>
            )}

            <Divider />

            <MenuItem
              danger
              onClick={() =>
                runAndClose(() => {
                  audio.play('click');
                  onRequestQuit();
                })
              }
            >
              ✕ Encerrar jogo
            </MenuItem>
          </Parchment>
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
  'aria-pressed'?: boolean;
}

function MenuItem({ children, onClick, danger, ...rest }: MenuItemProps) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 6,
        fontSize: '0.9rem',
        color: danger ? 'var(--danger)' : 'var(--ink)',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          'rgba(121, 85, 42, 0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

function MuteMenuItem() {
  const muted = useAudioStore((s) => s.muted);
  const toggle = useAudioStore((s) => s.toggleMuted);
  return (
    <MenuItem
      onClick={() => {
        audio.play('click');
        toggle();
      }}
      aria-pressed={muted}
    >
      {muted ? '🔇' : '🔊'} Som
      <span
        style={{
          marginLeft: 'auto',
          fontSize: '0.75rem',
          opacity: 0.7,
        }}
      >
        {muted ? 'mudo' : 'ligado'}
      </span>
    </MenuItem>
  );
}

function Divider() {
  return (
    <div
      role="separator"
      style={{
        height: 1,
        background: 'rgba(59, 43, 24, 0.25)',
        margin: '4px 6px',
      }}
    />
  );
}

function Shortcut({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        marginLeft: 'auto',
        fontSize: '0.7rem',
        opacity: 0.6,
        fontFamily: 'var(--font-mono, monospace)',
        border: '1px solid rgba(59,43,24,0.3)',
        padding: '1px 5px',
        borderRadius: 4,
      }}
    >
      {children}
    </span>
  );
}
