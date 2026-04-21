import type { Card } from '@/engine/types';

export const INVENTION_CARDS: readonly Card[] = [
  {
    id: 'inv-watt-engine',
    deck: 'invention',
    title: 'Condensador Separado de Watt',
    effectText: 'Sua patente rende frutos — receba £100.',
    effect: { kind: 'gain', amount: 100 },
    education: {
      title: 'O Condensador Separado de James Watt',
      date: '1765',
      blurb:
        'James Watt percebeu que as máquinas de Newcomen desperdiçavam quase todo o combustível reaquecendo o cilindro a cada ciclo. Seu condensador separado mantinha o cilindro quente enquanto a condensação ocorria em outro lugar, triplicando a eficiência. A parceria de 1775 com Matthew Boulton comercializou a máquina e, em décadas, o vapor se tornou a fonte de energia padrão da era.',
      source: 'H. W. Dickinson, "James Watt: Craftsman and Engineer" (1935)',
    },
  },
  {
    id: 'inv-spinning-jenny',
    deck: 'invention',
    title: 'Spinning Jenny de Hargreaves',
    effectText: 'Venda seu primeiro protótipo — receba £50.',
    effect: { kind: 'gain', amount: 50 },
    education: {
      title: 'Hargreaves e a Spinning Jenny',
      date: '1764',
      blurb:
        'James Hargreaves, um tecelão de Blackburn, construiu a spinning jenny para ajudar sua própria família a acompanhar a demanda. Em cinco anos, ela estava em toda parte em Lancashire. Hargreaves tentou patenteá-la em 1770 mas não conseguiu fazer valer a patente; como muitos inventores da era, ele se beneficiou menos do que aqueles que comercializaram sua ideia.',
      source: 'R. S. Fitton, "The Arkwrights" (1989)',
    },
  },
  {
    id: 'inv-water-frame',
    deck: 'invention',
    title: 'Máquina Hidráulica de Arkwright',
    effectText: 'Avance até a Tecelagem de Cromford. Se passar pelo Início, receba £200.',
    effect: { kind: 'move-to', tileId: 1, passStartAward: true },
    education: {
      title: 'A Máquina Hidráulica',
      date: '1769',
      blurb:
        'A water frame de Richard Arkwright produzia fios fortes o bastante para servirem de urdidura — algo impossível para a jenny. Crucialmente, foi projetada desde o início para ser movida a água e depois a vapor, tornando-se o modelo da produção fabril. O gênio de Arkwright era tanto organizacional quanto mecânico: ele implantou o sistema fabril na realidade.',
      source: 'R. Fitton, "The Arkwrights: Spinners of Fortune" (1989)',
    },
  },
  {
    id: 'inv-cotton-gin',
    deck: 'invention',
    title: 'Descaroçador de Algodão de Whitney',
    effectText: 'Algodão bruto barato inunda o mercado — receba £75.',
    effect: { kind: 'gain', amount: 75 },
    education: {
      title: 'O Descaroçador de Algodão de Eli Whitney',
      date: '1793',
      blurb:
        'O descaroçador separava sementes do algodão bruto cinquenta vezes mais rápido que o trabalho manual. Nos Estados Unidos, revitalizou tragicamente a escravidão no Sul ao tornar o algodão de fibra curta subitamente lucrativo. Na Grã-Bretanha, significou matéria-prima barata sem fim para as fábricas de Lancashire. Uma só invenção, em oceanos distintos, entrelaçou sofrimento humano e riqueza industrial no mesmo tecido.',
      source: 'S. Beckert, "Empire of Cotton" (2014)',
    },
  },
  {
    id: 'inv-power-loom',
    deck: 'invention',
    title: 'Tear Mecânico de Cartwright',
    effectText: 'Seu tear funciona. Avance até o Tear Mecânico.',
    effect: { kind: 'move-to', tileId: 6, passStartAward: true },
    education: {
      title: 'O Tear Mecânico',
      date: '1785',
      blurb:
        'Edmund Cartwright era um clérigo rural sem formação em engenharia quando projetou seu tear mecânico. As primeiras versões quebravam constantemente; foram precisos quarenta anos de refinamento por outros para que a máquina vencesse economicamente o tecelão manual. Um lembrete de que invenção e adoção são problemas inteiramente distintos.',
      source: 'D. Bythell, "The Handloom Weavers" (1969)',
    },
  },
  {
    id: 'inv-puddling',
    deck: 'invention',
    title: 'Processo de Pudelagem de Cort',
    effectText: 'Ferro maleável em larga escala — receba £150.',
    effect: { kind: 'gain', amount: 150 },
    education: {
      title: 'Pudelagem e Laminação',
      date: '1784',
      blurb:
        'O processo de pudelagem de Henry Cort agitava o ferro-gusa derretido em um forno reverberatório, mantendo o combustível separado. Produzia ferro maleável em barras grandes e trabalháveis. Seu laminador as transformava em trilhos e vigas. A produção britânica de ferro quadruplicou em trinta anos, e o nome de Cort devia ser tão famoso quanto o de Watt — mas seus sócios o arruinaram.',
      source: 'R. A. Mott, "Henry Cort: The Great Finer" (1983)',
    },
  },
  {
    id: 'inv-locomotion',
    deck: 'invention',
    title: 'Locomotion No. 1 de Stephenson',
    effectText: 'Suas ações na Ferrovia Stockton-Darlington valorizam — receba £100.',
    effect: { kind: 'gain', amount: 100 },
    education: {
      title: 'A Ferrovia Stockton e Darlington',
      date: '1825',
      blurb:
        'A Stockton e Darlington, a primeira ferrovia pública do mundo puxada a vapor, foi inaugurada em setembro de 1825 com a Locomotion No. 1, de George Stephenson, à frente. Foi construída principalmente para carvão, mas transportou passageiros pagantes desde o primeiro dia. Em poucos anos, a especulação com ações ferroviárias se tornaria um dos comportamentos financeiros definidores da era.',
      source: 'R. H. G. Thomas, "The Stockton & Darlington Railway" (1975)',
    },
  },
  {
    id: 'inv-macadam',
    deck: 'invention',
    title: 'Pavimentação de McAdam',
    effectText: 'Avance até o Canal de Bridgewater. Se passar pelo Início, receba £200.',
    effect: { kind: 'move-to', tileId: 5, passStartAward: true },
    education: {
      title: 'As Estradas de John Loudon McAdam',
      date: '1820',
      blurb:
        'Antes que as ferrovias conquistassem as longas distâncias, as estradas em camadas de pedra de McAdam reduziram pela metade os tempos de viagem entre cidades britânicas. Sua receita — pedra britada compactada para escoar a água — era barata e durável. Permitia aos correios rodar em horários que envergonhariam um ônibus moderno. McAdam mostrou que avanços em transporte não precisam ser dramáticos para serem transformadores.',
      source: 'W. J. Reader, "Macadam: The McAdam Family and the Turnpike Roads" (1980)',
    },
  },
  {
    id: 'inv-gas-lighting',
    deck: 'invention',
    title: 'Iluminação a Gás de Murdoch',
    effectText: 'Sua fábrica produz sob a luz do gás — receba £80.',
    effect: { kind: 'gain', amount: 80 },
    education: {
      title: 'William Murdoch e o Gás de Carvão',
      date: '1802',
      blurb:
        'William Murdoch, engenheiro de Boulton & Watt na Cornualha, canalizou gás de carvão em sua casa e a iluminou em 1792. Em uma década, as obras Soho de Boulton estavam iluminadas a gás e, em 1814, a Westminster Bridge brilhava sob lampiões de gás. As fábricas podiam funcionar em turnos noturnos com segurança; as ruas tornavam-se caminháveis após o anoitecer. Foi, literalmente, a primeira era que trabalhava no escuro.',
      source: 'F. Accum, "A Practical Treatise on Gas-Light" (1815)',
    },
  },
  {
    id: 'inv-steam-hammer',
    deck: 'invention',
    title: 'Martelo a Vapor de Nasmyth',
    effectText: 'Contratos de forja chegam em massa — receba £120.',
    effect: { kind: 'gain', amount: 120 },
    education: {
      title: 'O Martelo a Vapor',
      date: '1839',
      blurb:
        'James Nasmyth projetou seu martelo a vapor em uma única página de 1839 em seu caderno de patentes. Ele permitiu às fundições forjar peças de ferro maiores do que jamais: eixos de navios, blindagens de couraçados, cubos de rodas de pás. O martelo de Nasmyth era tão controlável, gabava-se ele, que podia quebrar um ovo sem derramá-lo. Potência com precisão era a nova gramática da era.',
      source: 'J. Nasmyth, "James Nasmyth, Engineer: An Autobiography" (1883)',
    },
  },
  {
    id: 'inv-chronometer',
    deck: 'invention',
    title: 'Cronômetro Marítimo de Harrison',
    effectText: 'Seus interesses marítimos prosperam — receba £60.',
    effect: { kind: 'gain', amount: 60 },
    education: {
      title: 'John Harrison e a Longitude',
      date: '1761',
      blurb:
        'O cronômetro marítimo H4 de John Harrison, preciso em segundos por meses no mar, finalmente solucionou o problema da longitude. O Almirantado resistiu a pagar-lhe o prêmio por décadas. A navegação oceânica confiável sustentou o transporte marítimo que alimentava o algodão industrial e distribuía os produtos acabados. Um carpinteiro obsessivo de Yorkshire praticamente tornou o comércio global algo passível de cronograma.',
      source: 'D. Sobel, "Longitude" (1995)',
    },
  },
  {
    id: 'inv-battery',
    deck: 'invention',
    title: 'Pilha de Volta',
    effectText: 'Você se aventura na nova ciência elétrica — receba £40.',
    effect: { kind: 'gain', amount: 40 },
    education: {
      title: 'A Pilha Voltaica',
      date: '1800',
      blurb:
        'A "pilha" de placas de zinco e cobre em salmoura de Alessandro Volta produziu a primeira corrente elétrica estável. Químicos imediatamente decompuseram água e sais com ela; nascia toda uma ciência eletroquímica. Os usos industriais vieram lentamente — galvanoplastia nos anos 1840, circuitos telegráficos —, mas a pilha acendeu o pavio.',
      source: 'G. Pancaldi, "Volta: Science and Culture in the Age of Enlightenment" (2003)',
    },
  },
  {
    id: 'inv-threshing',
    deck: 'invention',
    title: 'Debulhadora de Meikle',
    effectText: 'Avance até a Sede da Companhia das Índias Orientais. Se passar pelo Início, receba £200.',
    effect: { kind: 'move-to', tileId: 39, passStartAward: true },
    education: {
      title: 'Mecanizando a Colheita',
      date: '1786',
      blurb:
        'A máquina de debulhar de Andrew Meikle separava os grãos da palha mais rápido do que qualquer equipe de trabalhadores. Nos anos 1830, trabalhadores rurais do sul da Inglaterra, temendo passar fome, se revoltaram e destruíram debulhadoras pelo campo — os chamados Swing Riots. A mecanização agrícola libertava trabalhadores para as fábricas urbanas, quisessem eles ir ou não.',
      source: 'E. J. Hobsbawm and G. Rudé, "Captain Swing" (1969)',
    },
  },
  {
    id: 'inv-chlorine-bleach',
    deck: 'invention',
    title: 'Branqueamento com Cloro',
    effectText: 'Campos de branqueamento liberados — receba £70.',
    effect: { kind: 'gain', amount: 70 },
    education: {
      title: 'O Branqueador de Cloro de Berthollet',
      date: '1785',
      blurb:
        'Claude Louis Berthollet descobriu que o gás cloro dissolvido em água branqueava tecido rapidamente. Químicos escoceses transformaram a descoberta no pó de branqueamento de Tennant. Campos que antes ficavam estendidos com tecidos por semanas ao sol foram liberados para a produção de alimentos. A química silenciosamente devolveu paisagens inteiras aos industriais.',
      source: 'C. Singer, "The Earliest Chemical Industry" (1948)',
    },
  },
  {
    id: 'inv-photography',
    deck: 'invention',
    title: 'Fotografia de Daguerre',
    effectText: 'A era se vê — receba £30.',
    effect: { kind: 'gain', amount: 30 },
    education: {
      title: 'O Daguerreótipo',
      date: '1839',
      blurb:
        'O processo fotográfico de Louis Daguerre, revelado em 1839, fixava imagens em placas de cobre prateadas usando vapor de mercúrio. O governo francês comprou a patente e a liberou ao mundo. Em uma década, cidades industriais eram fotografadas de todos os ângulos; a Revolução Industrial seria o primeiro evento histórico com registro visual próprio.',
      source: 'J. Hannavy, "Encyclopedia of Nineteenth-Century Photography" (2008)',
    },
  },
  {
    id: 'inv-anaesthesia',
    deck: 'invention',
    title: 'Anestesia com Éter',
    effectText: 'Contratos hospitalares — receba £90.',
    effect: { kind: 'gain', amount: 90 },
    education: {
      title: 'Éter e Medicina Industrial',
      date: '1846',
      blurb:
        'A cirurgia sem anestesia era um dos terrores da medicina. Em 1846, William Morton usou éter publicamente em Boston para operar sem dor; a técnica cruzou o Atlântico em semanas. Está ligeiramente além da janela estrita da Revolução Industrial, mas pertence aqui porque vidraria industrial, química e distribuição ferroviária tornaram possível sua rápida difusão.',
      source: 'S. Snow, "Blessed Days of Anaesthesia" (2008)',
    },
  },
];
