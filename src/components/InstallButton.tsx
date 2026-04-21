import { useState, type CSSProperties } from 'react';
import { useInstallPrompt } from '@/pwa/useInstallPrompt';
import { IOSInstallModal } from './IOSInstallModal';

interface Props {
  style?: CSSProperties;
}

export function InstallButton({ style }: Props) {
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [iosOpen, setIosOpen] = useState(false);

  if (isInstalled) return null;

  if (canInstall) {
    return (
      <button
        type="button"
        onClick={() => void promptInstall()}
        style={style}
        aria-label="Instalar Industropoly"
      >
        Instalar app
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIosOpen(true)}
          style={style}
          aria-label="Adicionar Industropoly à tela de início"
        >
          Adicionar à tela de início
        </button>
        {iosOpen && <IOSInstallModal onClose={() => setIosOpen(false)} />}
      </>
    );
  }

  return null;
}
