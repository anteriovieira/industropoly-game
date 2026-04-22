import { useUiStore } from '@/state/uiStore';
import { Parchment } from '@/ui/Parchment';
import { InstallButton } from '@/components/InstallButton';

export function IntroScreen() {
  const setPhase = useUiStore((s) => s.setPhase);
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
        style={{ maxWidth: 720, margin: 'auto 0', position: 'relative', zIndex: 1 }}
      >
        <div
          className="ind-label"
          style={{ marginBottom: 10, textAlign: 'center' }}
        >
          Um jogo de tabuleiro sobre a Revolução Industrial
        </div>
        <h1 style={{ marginTop: 0, textAlign: 'center', fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}>
          Industropoly
        </h1>
        {/* Brass divider */}
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
        <p
          style={{
            fontStyle: 'italic',
            marginTop: 0,
            textAlign: 'center',
            fontSize: '1.05rem',
            color: 'var(--ink-soft)',
          }}
        >
          Manchester, 1785 — a era do vapor está amanhecendo.
        </p>
        <p>
          Pelos vales de Derbyshire e pelas cidades do algodão de Lancashire, novas máquinas estão
          mudando o que significa trabalhar, comerciar e enriquecer. Uma única máquina hidráulica
          consegue superar uma aldeia inteira de fiandeiros; a fornalha de um ferreiro pode
          alimentar uma marinha; uma patente concedida pela Coroa pode refazer a sorte de um
          condado.
        </p>
        <p>
          Você é um investidor chegando a este século estranho e barulhento. Compre tecelagens e
          ferrovias, domine setores inteiros — do Carvão e Ferro aos Estaleiros —, enfrente as
          tempestades dos Editais do Parlamento e das revoltas luditas, e tente permanecer de pé
          quando todos os demais houverem quebrado.
        </p>
        <p>
          Cada espaço em que você pisar e cada carta que comprar carrega um pedaço de história
          real. Jogue bem e aprenderá, de dentro, o formato da primeira revolução industrial do
          mundo.
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginTop: 28,
            flexWrap: 'wrap',
          }}
        >
          <InstallButton />
          <button className="primary hero" onClick={() => setPhase('setup')} autoFocus>
            Começar &rarr;
          </button>
        </div>
      </Parchment>
    </div>
  );
}
