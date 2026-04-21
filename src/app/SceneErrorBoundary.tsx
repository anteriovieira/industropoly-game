import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

// Catches render-time exceptions from the 3D scene (or anything else inside).
// Without this, an uncaught error inside <Canvas> tears down the whole React
// tree and the user sees a fully blank screen with no clue what happened.
//
// On error we render a visible card with the message + stack so the user (or
// QA on a tablet) can read or screenshot it without needing dev tools.
export class SceneErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error('Scene crashed:', error, info);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          position: 'fixed',
          inset: 0,
          background: '#1a120a',
          color: '#f3e7c1',
          padding: 24,
          overflow: 'auto',
          zIndex: 9999,
          fontFamily: 'monospace',
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        <h2 style={{ marginTop: 0, color: '#f3a04a' }}>Algo deu errado ao renderizar a cena</h2>
        <p style={{ opacity: 0.85 }}>
          Tire um print desta tela e envie. Em seguida toque em &quot;Recarregar&quot;.
        </p>
        <pre
          style={{
            background: '#000',
            padding: 12,
            borderRadius: 6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '40vh',
            overflow: 'auto',
          }}
        >
          {this.state.error.name}: {this.state.error.message}
          {'\n\n'}
          {this.state.error.stack ?? '(sem stack)'}
        </pre>
        {this.state.info?.componentStack && (
          <>
            <h3 style={{ color: '#f3a04a', marginBottom: 6 }}>Componente</h3>
            <pre
              style={{
                background: '#000',
                padding: 12,
                borderRadius: 6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '30vh',
                overflow: 'auto',
              }}
            >
              {this.state.info.componentStack}
            </pre>
          </>
        )}
        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 16px',
              background: '#a0410d',
              color: '#fff',
              border: '1px solid #3b2b18',
              borderRadius: 6,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
          <button
            onClick={() => {
              try {
                localStorage.clear();
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
            style={{
              padding: '10px 16px',
              background: '#5a2a68',
              color: '#fff',
              border: '1px solid #3b2b18',
              borderRadius: 6,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Limpar dados e recarregar
          </button>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
          UA: {navigator.userAgent}
        </p>
      </div>
    );
  }
}
