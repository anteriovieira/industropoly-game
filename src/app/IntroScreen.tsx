import { useUiStore } from '@/state/uiStore';
import { Parchment } from '@/ui/Parchment';

export function IntroScreen() {
  const setPhase = useUiStore((s) => s.setPhase);
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'safe center',
        padding: 24,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        background: 'linear-gradient(#1a120a, #342410)',
      }}
    >
      <Parchment padding={36} style={{ maxWidth: 680, margin: 'auto 0' }}>
        <h1 style={{ marginTop: 0 }}>Industropoly</h1>
        <p style={{ fontStyle: 'italic', marginTop: 0 }}>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="primary" onClick={() => setPhase('setup')} autoFocus>
            Começar
          </button>
        </div>
      </Parchment>
    </div>
  );
}
