import type { Question, TileId } from '@/engine/types';

// Questions map, keyed by tileId. Every gameplay-rule tile (industry, transport,
// utility, tax, card) must have at least one question here. Corner tiles (ids
// 0, 10, 20, 30) have no questions — they skip the quiz phase.
//
// Authoring rules (enforced by scripts/lint-content.ts):
//   - 2..4 options, each with a unique short id and non-empty text
//   - exactly one `correctOptionId` that matches one of the option ids
//   - non-empty `source` citing where the answer comes from
//   - `eliminate-option` hints must reference an option id that is NOT the correct one
//
// Hint conventions:
//   - small prices (20–80) keep the shop affordable without trivializing the quiz
//   - `first-letter` hints have empty payload; the UI derives the letter
//
// Keep prompts tight (≤ 25 words) and options ≤ 12 words for mobile layout.

export const QUESTIONS: Record<TileId, readonly Question[]> = {
  1: [
    {
      id: 'q-cromford-1',
      prompt: 'Quem construiu a tecelagem de Cromford, considerada a primeira fábrica moderna?',
      options: [
        { id: 'a', text: 'James Watt' },
        { id: 'b', text: 'Richard Arkwright' },
        { id: 'c', text: 'Edmund Cartwright' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'a' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Seu sobrenome virou também o nome de um tear.' },
      ],
      source: 'R. Fitton, "The Arkwrights: Spinners of Fortune" (1989)',
    },
  ],
  2: [
    {
      id: 'q-edict-1',
      prompt: 'Quais leis destruíram direitos comunais sobre terras comuns durante a industrialização?',
      options: [
        { id: 'a', text: 'Leis de Cercamento (Enclosure Acts)' },
        { id: 'b', text: 'Leis Marítimas' },
        { id: 'c', text: 'Leis de Educação' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Permitiam aos proprietários cercar campos antes abertos.' },
      ],
      source: 'E. P. Thompson, "A Formação da Classe Operária Inglesa" (1963)',
    },
  ],
  3: [
    {
      id: 'q-strutt-1',
      prompt: 'O que a tecelagem de Jedediah Strutt em Belper introduziu na arquitetura industrial?',
      options: [
        { id: 'a', text: 'Estruturas de ferro contra incêndio' },
        { id: 'b', text: 'Telhados de zinco' },
        { id: 'c', text: 'Paredes de adobe' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'A preocupação era evitar um risco comum em fábricas de algodão.' },
      ],
      source: 'S. D. Chapman, "The Early Factory Masters" (1967)',
    },
  ],
  4: [
    {
      id: 'q-imposto-pitt-1',
      prompt: 'Quem criou o primeiro imposto de renda britânico em 1799?',
      options: [
        { id: 'a', text: 'Robert Peel' },
        { id: 'b', text: 'William Pitt, o Jovem' },
        { id: 'c', text: 'Benjamin Disraeli' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Precisava financiar a guerra contra Napoleão.' },
      ],
      source: 'M. Daunton, "Trusting Leviathan" (2001)',
    },
  ],
  5: [
    {
      id: 'q-bridgewater-1',
      prompt: 'O que o canal de Bridgewater fez com o preço do carvão em Manchester?',
      options: [
        { id: 'a', text: 'Dobrou' },
        { id: 'b', text: 'Reduziu pela metade' },
        { id: 'c', text: 'Não mudou' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Canais eram muito mais baratos que estradas de cavalos.' },
      ],
      source: 'H. Malet, "Bridgewater: The Canal Duke" (1977)',
    },
  ],
  6: [
    {
      id: 'q-cartwright-1',
      prompt: 'Qual gargalo da produção de algodão o tear mecânico de Cartwright finalmente mecanizou?',
      options: [
        { id: 'a', text: 'A fiação' },
        { id: 'b', text: 'A tecelagem' },
        { id: 'c', text: 'A cardagem' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Até então, esse passo ainda era feito à mão.' },
      ],
      source: 'D. Bythell, "The Handloom Weavers" (1969)',
    },
  ],
  7: [
    {
      id: 'q-patentes-1',
      prompt: 'Que instituição tornou-se central na explosão inventiva da era industrial?',
      options: [
        { id: 'a', text: 'O Parlamento' },
        { id: 'b', text: 'O Escritório de Patentes' },
        { id: 'c', text: 'A Royal Society' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'a' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Registrava direitos exclusivos de uso de invenções.' },
      ],
      source: 'C. MacLeod, "Inventing the Industrial Revolution" (1988)',
    },
  ],
  8: [
    {
      id: 'q-boulton-1',
      prompt: 'Quem foi o sócio comercial de James Watt na produção da máquina a vapor?',
      options: [
        { id: 'a', text: 'Matthew Boulton' },
        { id: 'b', text: 'John Wilkinson' },
        { id: 'c', text: 'Abraham Darby' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Operava a Manufatura Soho perto de Birmingham.' },
      ],
      source: 'J. Uglow, "The Lunar Men" (2002)',
    },
  ],
  9: [
    {
      id: 'q-oldknow-1',
      prompt: 'O que Samuel Oldknow conseguiu produzir a preço competitivo com as fontes indianas?',
      options: [
        { id: 'a', text: 'Seda bruta' },
        { id: 'b', text: 'Musseline fina' },
        { id: 'c', text: 'Linho grosso' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'a' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era um tecido de algodão muito leve e fino.' },
      ],
      source: 'G. Unwin, "Samuel Oldknow and the Arkwrights" (1924)',
    },
  ],
  11: [
    {
      id: 'q-wilkinson-1',
      prompt: 'Que invenção de John Wilkinson foi essencial para a máquina a vapor de Watt?',
      options: [
        { id: 'a', text: 'A caldeira tubular' },
        { id: 'b', text: 'A máquina de mandrilar canhões' },
        { id: 'c', text: 'O regulador centrífugo' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'a' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Permitia acabar cilindros com altíssima precisão.' },
      ],
      source: 'A. N. Palmer, "John Wilkinson and the Old Bersham Ironworks" (1899)',
    },
  ],
  12: [
    {
      id: 'q-newcomen-1',
      prompt: 'Para que a máquina atmosférica de Newcomen foi primeiramente usada?',
      options: [
        { id: 'a', text: 'Bombear água das minas' },
        { id: 'b', text: 'Mover locomotivas' },
        { id: 'c', text: 'Tecer algodão' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Sem ela, os poços de carvão mais profundos alagavam.' },
      ],
      source: 'L. T. C. Rolt, "Thomas Newcomen" (1963)',
    },
  ],
  13: [
    {
      id: 'q-cort-1',
      prompt: 'Qual técnica de Henry Cort permitiu produzir ferro maleável em larga escala?',
      options: [
        { id: 'a', text: 'A galvanização' },
        { id: 'b', text: 'A pudelagem e laminação' },
        { id: 'c', text: 'A temperação em óleo' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'a' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Agitava-se o ferro-gusa até retirar impurezas.' },
      ],
      source: 'R. A. Mott, "Henry Cort: The Great Finer" (1983)',
    },
  ],
  14: [
    {
      id: 'q-darby-1',
      prompt: 'O que Abraham Darby descobriu que substituiu o carvão vegetal na fundição?',
      options: [
        { id: 'a', text: 'O coque' },
        { id: 'b', text: 'O carvão betuminoso cru' },
        { id: 'c', text: 'A lenha de pinho' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'É carvão mineral processado por aquecimento.' },
      ],
      source: 'B. Trinder, "The Industrial Revolution in Shropshire" (1973)',
    },
  ],
  15: [
    {
      id: 'q-lm-railway-1',
      prompt: 'Que locomotiva venceu os Ensaios de Rainhill e abriu a ferrovia Liverpool–Manchester?',
      options: [
        { id: 'a', text: 'Locomotion' },
        { id: 'b', text: 'Rocket' },
        { id: 'c', text: 'Flying Scotsman' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O nome sugere foguete em inglês.' },
      ],
      source: 'R. H. G. Thomas, "The Liverpool and Manchester Railway" (1980)',
    },
  ],
  16: [
    {
      id: 'q-tennant-alcali-1',
      prompt: 'Qual produto patenteado por Tennant acelerou o branqueamento têxtil?',
      options: [
        { id: 'a', text: 'Pó de branqueamento (cloreto de cal)' },
        { id: 'b', text: 'Soda cáustica pura' },
        { id: 'c', text: 'Ácido sulfúrico' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Reduzia um processo de semanas ao sol para horas.' },
      ],
      source: 'A. Clow and N. L. Clow, "The Chemical Revolution" (1952)',
    },
  ],
  17: [
    {
      id: 'q-factory-act-1',
      prompt: 'O que a Lei Fabril britânica de 1833 introduziu de novo?',
      options: [
        { id: 'a', text: 'Salário mínimo nacional' },
        { id: 'b', text: 'Os primeiros inspetores fabris' },
        { id: 'c', text: 'A jornada de 8 horas' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Pela primeira vez, o Estado fiscalizava dentro das fábricas.' },
      ],
      source: 'Hutchins & Harrison, "A History of Factory Legislation" (1903)',
    },
  ],
  18: [
    {
      id: 'q-macintosh-1',
      prompt: 'Que material Charles Macintosh usou entre camadas de tecido para torná-lo impermeável?',
      options: [
        { id: 'a', text: 'Cera de abelha' },
        { id: 'b', text: 'Borracha' },
        { id: 'c', text: 'Linhaça fervida' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'a' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O mesmo material depois foi vulcanizado por Goodyear.' },
      ],
      source: 'G. Macintosh, "Biographical Memoir of the Late Charles Macintosh" (1847)',
    },
  ],
  19: [
    {
      id: 'q-branqueamento-1',
      prompt: 'Qual ácido, fabricado em larga escala, era essencial à indústria de branqueamento?',
      options: [
        { id: 'a', text: 'Ácido sulfúrico' },
        { id: 'b', text: 'Ácido cítrico' },
        { id: 'c', text: 'Ácido acético' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O processo Leblanc o produzia a partir de sal.' },
      ],
      source: 'Musson & Robinson, "Science and Technology in the Industrial Revolution" (1969)',
    },
  ],
  21: [
    {
      id: 'q-brunel-tunnel-1',
      prompt: 'Que dispositivo de Marc Brunel permitiu escavar sob o Tâmisa com segurança?',
      options: [
        { id: 'a', text: 'O escudo de escavação' },
        { id: 'b', text: 'A broca pneumática' },
        { id: 'c', text: 'O martelo a vapor' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'É o ancestral direto das técnicas usadas em metrôs.' },
      ],
      source: 'S. Brunel, "The Life of Isambard Kingdom Brunel" (1870)',
    },
  ],
  22: [
    {
      id: 'q-corn-laws-1',
      prompt: 'O que as Leis dos Cereais britânicas faziam?',
      options: [
        { id: 'a', text: 'Restringiam importações de grão' },
        { id: 'b', text: 'Subsidiavam a exportação de pão' },
        { id: 'c', text: 'Proibiam o cultivo de trigo' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Beneficiavam os proprietários de terras britânicos.' },
      ],
      source: 'N. McCord, "The Anti-Corn Law League" (1958)',
    },
  ],
  23: [
    {
      id: 'q-maudslay-1',
      prompt: 'Que inovação de Henry Maudslay tornou peças realmente intercambiáveis?',
      options: [
        { id: 'a', text: 'A furadeira radial' },
        { id: 'b', text: 'O torno de rosca de precisão' },
        { id: 'c', text: 'A serra circular' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Permitia abrir roscas idênticas a cada giro.' },
      ],
      source: 'J. Nasmyth, "James Nasmyth, Engineer: An Autobiography" (1883)',
    },
  ],
  24: [
    {
      id: 'q-clyde-1',
      prompt: 'Em que rio escocês Robert Napier fundou estaleiros pioneiros de navios a vapor?',
      options: [
        { id: 'a', text: 'Clyde' },
        { id: 'b', text: 'Tâmisa' },
        { id: 'c', text: 'Mersey' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Corta a cidade de Glasgow.' },
      ],
      source: 'J. Napier, "Life of Robert Napier of West Shandon" (1904)',
    },
  ],
  25: [
    {
      id: 'q-gwr-1',
      prompt: 'Que característica técnica tornou a Great Western Railway peculiar em seu início?',
      options: [
        { id: 'a', text: 'Uma bitola mais larga' },
        { id: 'b', text: 'Trilhos de madeira' },
        { id: 'c', text: 'Tração por cabos' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'A distância entre os trilhos era 2,13 m, não 1,43 m.' },
      ],
      source: 'L. T. C. Rolt, "Isambard Kingdom Brunel" (1957)',
    },
  ],
  26: [
    {
      id: 'q-stephenson-rocket-1',
      prompt: 'Em que ensaios de 1829 a "Rocket" de Stephenson provou o modelo da locomotiva moderna?',
      options: [
        { id: 'a', text: 'Ensaios de Rainhill' },
        { id: 'b', text: 'Testes de Edimburgo' },
        { id: 'c', text: 'Exposição de Crystal Palace' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O nome vem da pequena vila em Lancashire onde ocorreu.' },
      ],
      source: 'R. Young, "Timothy Hackworth and the Locomotive" (1923)',
    },
  ],
  27: [
    {
      id: 'q-whitworth-1',
      prompt: 'Que tipo de padronização Joseph Whitworth estabeleceu em 1841?',
      options: [
        { id: 'a', text: 'Das roscas de parafuso' },
        { id: 'b', text: 'Dos tipos tipográficos' },
        { id: 'c', text: 'Dos calibres de arma' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Sem isso, cada oficina usava suas próprias dimensões.' },
      ],
      source: 'N. Atkinson, "Sir Joseph Whitworth" (1996)',
    },
  ],
  28: [
    {
      id: 'q-water-manchester-1',
      prompt: 'Que descoberta de John Snow em 1854 ligou a cólera à água contaminada?',
      options: [
        { id: 'a', text: 'Um mapa do surto no Soho' },
        { id: 'b', text: 'Um exame microscópico do Tâmisa' },
        { id: 'c', text: 'Um experimento com ratos' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Ele visualizou os casos ao redor de uma bomba de rua.' },
      ],
      source: 'S. Johnson, "The Ghost Map" (2006)',
    },
  ],
  29: [
    {
      id: 'q-selfactor-1',
      prompt: 'Que efeito o selfactor de Richard Roberts teve sobre os fiandeiros qualificados?',
      options: [
        { id: 'a', text: 'Elevou seus salários' },
        { id: 'b', text: 'Quebrou seu poder de barganha' },
        { id: 'c', text: 'Criou um novo ofício artesanal' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'A máquina podia ser operada por trabalhadores menos qualificados.' },
      ],
      source: 'W. Lazonick, "Industrial Relations and Technical Change" (1979)',
    },
  ],
  31: [
    {
      id: 'q-koenig-times-1',
      prompt: 'Qual jornal foi o primeiro impresso em uma prensa cilíndrica a vapor em 1814?',
      options: [
        { id: 'a', text: 'The Guardian' },
        { id: 'b', text: 'The Times' },
        { id: 'c', text: 'Daily Telegraph' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'A prensa foi fabricada por Friedrich Koenig.' },
      ],
      source: 'S. Morison, "The History of The Times" (1935)',
    },
  ],
  32: [
    {
      id: 'q-stanhope-1',
      prompt: 'Qual material substituiu a madeira na prensa manual projetada por Lord Stanhope?',
      options: [
        { id: 'a', text: 'Bronze' },
        { id: 'b', text: 'Ferro' },
        { id: 'c', text: 'Aço inoxidável' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era o metal estrutural da era industrial.' },
      ],
      source: 'M. Twyman, "Printing 1770–1970" (1970)',
    },
  ],
  33: [
    {
      id: 'q-telegrafo-1',
      prompt: 'Que característica marcou o telégrafo elétrico como mudança histórica?',
      options: [
        { id: 'a', text: 'Mensagens mais rápidas que o transporte físico' },
        { id: 'b', text: 'A transmissão por rádio de voz' },
        { id: 'c', text: 'A comunicação com a Lua' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Antes dele, informação viajava na velocidade dos cavalos.' },
      ],
      source: 'T. Standage, "The Victorian Internet" (1998)',
    },
  ],
  34: [
    {
      id: 'q-caslon-1',
      prompt: 'Qual foi a principal contribuição da fundição Caslon para a impressão inglesa?',
      options: [
        { id: 'a', text: 'Tipos tipográficos elegantes e práticos' },
        { id: 'b', text: 'Papel mais branco' },
        { id: 'c', text: 'Tintas que não borram' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'A Declaração de Independência americana foi composta com eles.' },
      ],
      source: 'J. Mosley, "The Nymph and the Grot" (1999)',
    },
  ],
  35: [
    {
      id: 'q-lbr-1',
      prompt: 'Qual engenheiro projetou a ferrovia Londres–Birmingham, inaugurada em 1838?',
      options: [
        { id: 'a', text: 'Robert Stephenson' },
        { id: 'b', text: 'Thomas Telford' },
        { id: 'c', text: 'John Rennie' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Filho de George, inventor da "Rocket".' },
      ],
      source: 'T. Roscoe, "The London and Birmingham Railway" (1838)',
    },
  ],
  36: [
    {
      id: 'q-hargreaves-1',
      prompt: 'O que a spinning jenny de James Hargreaves permitia a um único operário?',
      options: [
        { id: 'a', text: 'Fiar vários fios simultaneamente' },
        { id: 'b', text: 'Tecer sem pausa durante a noite' },
        { id: 'c', text: 'Tingir sem usar mordentes' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Fios iam de oito para dezesseis ao mesmo tempo.' },
      ],
      source: 'R. C. Allen, "The British Industrial Revolution in Global Perspective" (2009)',
    },
  ],
  37: [
    {
      id: 'q-bank-england-1',
      prompt: 'Que reforma de 1826 permitiu bancos por ações além de 105 km de Londres?',
      options: [
        { id: 'a', text: 'A abertura do monopólio do Banco da Inglaterra' },
        { id: 'b', text: 'A criação da Bolsa de Liverpool' },
        { id: 'c', text: 'O Decreto de Bretton Woods' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Semeou o sistema bancário moderno a tempo da Mania das Ferrovias.' },
      ],
      source: 'P. L. Cottrell, "Industrial Finance 1830–1914" (1980)',
    },
  ],
  38: [
    {
      id: 'q-window-tax-1',
      prompt: 'O que muitos proprietários faziam para evitar o Imposto das Janelas?',
      options: [
        { id: 'a', text: 'Vedavam janelas com tijolo' },
        { id: 'b', text: 'Pintavam os vidros de preto' },
        { id: 'c', text: 'Trocavam por claraboias' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Muitos interiores georgianos ficaram escuros por isso.' },
      ],
      source: 'A. M. T. Watkin, "The Window Tax" (1890)',
    },
  ],
  39: [
    {
      id: 'q-east-india-1',
      prompt: 'Qual país fornecia o algodão produzido por escravos para as fábricas de Lancashire?',
      options: [
        { id: 'a', text: 'Estados Unidos' },
        { id: 'b', text: 'Rússia' },
        { id: 'c', text: 'Austrália' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O Sul escravocrata desse país era o maior exportador.' },
      ],
      source: 'S. Beckert, "Empire of Cotton" (2014)',
    },
  ],
};

export function getQuestionsForTile(tileId: TileId): readonly Question[] {
  return QUESTIONS[tileId] ?? [];
}

export function getQuestionById(tileId: TileId, questionId: string): Question | undefined {
  return (QUESTIONS[tileId] ?? []).find((q) => q.id === questionId);
}
