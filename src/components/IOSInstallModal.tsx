interface Props {
  onClose: () => void;
}

export function IOSInstallModal({ onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(16, 10, 5, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--parchment-light)',
          color: 'var(--ink)',
          padding: 28,
          borderRadius: 10,
          border: '1px solid var(--ink)',
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h2 id="ios-install-title" style={{ marginTop: 0 }}>
          Instalar no iOS
        </h2>
        <p>
          O Safari não tem um botão de instalação automático. Para adicionar Industropoly à sua tela
          inicial:
        </p>
        <ol style={{ paddingLeft: 22, lineHeight: 1.6 }}>
          <li>
            Toque no botão <strong>Compartilhar</strong> <span aria-hidden="true">⎙</span> na barra
            do Safari.
          </li>
          <li>
            Role e toque em <strong>Adicionar à Tela de Início</strong>.
          </li>
          <li>
            Confirme em <strong>Adicionar</strong>.
          </li>
        </ol>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="primary" onClick={onClose} autoFocus>
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
