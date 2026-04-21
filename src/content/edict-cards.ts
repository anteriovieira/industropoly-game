import type { Card } from '@/engine/types';

export const EDICT_CARDS: readonly Card[] = [
  {
    id: 'edict-factory-act',
    deck: 'edict',
    title: 'Lei Fabril de 1833',
    effectText: 'O Parlamento limita o trabalho infantil. Pague £50 por indústria e £20 por melhoria que possuir.',
    effect: { kind: 'pay-per-property', perIndustry: 50, perUpgrade: 20 },
    education: {
      title: 'A Lei Fabril',
      date: '1833',
      blurb:
        'A Lei Fabril proibiu crianças menores de nove anos nas fábricas têxteis e limitou as horas das crianças mais velhas. O decisivo: criou os primeiros inspetores fabris assalariados — quatro, para cobrir todo o país. Seus relatórios anuais foram citados por décadas como prova de que o capitalismo industrial precisava, e podia sobreviver, à regulação.',
      source: 'B. L. Hutchins and A. Harrison, "A History of Factory Legislation" (1903)',
    },
  },
  {
    id: 'edict-enclosure',
    deck: 'edict',
    title: 'Lei de Cercamento',
    effectText: 'Terras comuns são cercadas em seu benefício — receba £120.',
    effect: { kind: 'gain', amount: 120 },
    education: {
      title: 'Cercamento Parlamentar',
      date: '1760–1830',
      blurb:
        'Mais de 5.000 leis parlamentares de cercamento redesenharam o campo inglês. Campos abertos e áreas comunais tornaram-se parcelas privadas, muitas vezes concentrando riqueza entre proprietários e deslocando pequenos lavradores para cidades industriais. O cercamento forneceu tanto o capital quanto a mão de obra barata de que as fábricas precisavam. Não foi por acaso que a industrialização foi tão marcadamente britânica.',
      source: 'J. M. Neeson, "Commoners: Common Right, Enclosure and Social Change" (1993)',
    },
  },
  {
    id: 'edict-poor-law',
    deck: 'edict',
    title: 'Nova Lei dos Pobres',
    effectText: 'Contribuintes pagam uma nova taxa dos pobres — perca £40.',
    effect: { kind: 'pay', amount: 40 },
    education: {
      title: 'A Reforma da Lei dos Pobres',
      date: '1834',
      blurb:
        'A reforma de 1834 canalizou os indigentes para asilos deliberadamente mais duros do que o trabalho assalariado mais mal pago, sob a teoria de que isso desencorajaria a "indolência". O Oliver Twist, de Dickens, é uma resposta direta. A economia industrial havia criado desemprego em escalas que as leis dos pobres dos Tudor não podiam administrar; a solução foi brutal, mas enormemente influente no debate posterior sobre bem-estar social.',
      source: 'N. Longmate, "The Workhouse" (1974)',
    },
  },
  {
    id: 'edict-chartism',
    deck: 'edict',
    title: 'Petição Cartista',
    effectText: 'Os trabalhadores se organizam — receba £20 de cada outro jogador.',
    effect: { kind: 'collect-from-each', amount: 20 },
    education: {
      title: 'A Carta do Povo',
      date: '1838',
      blurb:
        'Os cartistas exigiam sufrágio masculino universal, voto secreto e parlamentos anuais. Suas três grandes petições — 1839, 1842, 1848 — reuniram milhões de assinaturas e foram repetidamente rejeitadas. Ainda assim, até a década de 1880 todas as suas exigências, menos uma, haviam sido atendidas. Os trabalhadores industriais haviam aprendido a agir politicamente em escala nacional, e nada reverteu essa lição.',
      source: 'M. Chase, "Chartism: A New History" (2007)',
    },
  },
  {
    id: 'edict-anti-slavery',
    deck: 'edict',
    title: 'Abolição do Tráfico de Escravos',
    effectText: 'O tráfico é proibido — perca £60 enquanto os mercados se reorganizam.',
    effect: { kind: 'pay', amount: 60 },
    education: {
      title: 'Abolição do Tráfico de Escravos',
      date: '1807',
      blurb:
        'O Parlamento aboliu o tráfico britânico de escravos em 1807, com a emancipação plena seguindo em 1833. A economia industrial estava profundamente implicada: as fábricas de Lancashire rodaram com algodão produzido por escravos nos Estados Unidos por meio século após a abolição britânica. O argumento moral contra a escravidão foi afiado, ironicamente, pelo mesmo pensamento iluminista que justificava o capitalismo industrial.',
      source: 'A. Hochschild, "Bury the Chains" (2005)',
    },
  },
  {
    id: 'edict-corn-laws',
    deck: 'edict',
    title: 'Leis dos Cereais',
    effectText: 'Preços dos grãos disparam — pague £80 por salários mais altos.',
    effect: { kind: 'pay', amount: 80 },
    education: {
      title: 'As Leis dos Cereais',
      date: '1815',
      blurb:
        'As Leis dos Cereais de 1815 proibiam a importação de grãos abaixo de preços estabelecidos, protegendo proprietários de terra, mas inflacionando o preço do pão para os trabalhadores e os salários que os industriais precisavam pagar. Sua revogação em 1846, liderada por Richard Cobden e a Liga Anti-Leis dos Cereais, marcou a chegada política da burguesia industrial. O livre-comércio se tornou o credo britânico pelos setenta anos seguintes.',
      source: 'N. McCord, "The Anti-Corn Law League" (1958)',
    },
  },
  {
    id: 'edict-reform-act',
    deck: 'edict',
    title: 'Grande Lei de Reforma',
    effectText: 'Manchester finalmente tem um parlamentar — receba £100.',
    effect: { kind: 'gain', amount: 100 },
    education: {
      title: 'A Grande Lei de Reforma',
      date: '1832',
      blurb:
        'A industrial Manchester não tinha nenhum parlamentar; "rotten boroughs" em decadência elegiam dois. A lei de 1832 redistribuiu cadeiras e ampliou o direito de voto (ainda assim apenas para cerca de um em cada cinco homens). Foi uma meia-medida, mas justamente a metade que os interesses industriais queriam: peso político em Westminster proporcional a seu peso econômico no país.',
      source: 'E. J. Evans, "The Great Reform Act of 1832" (1994)',
    },
  },
  {
    id: 'edict-municipal',
    deck: 'edict',
    title: 'Lei das Corporações Municipais',
    effectText: 'Novos conselhos municipais investem em você — receba £50.',
    effect: { kind: 'gain', amount: 50 },
    education: {
      title: 'A Lei das Corporações Municipais',
      date: '1835',
      blurb:
        'A Lei das Corporações Municipais reformou o governo urbano, criando conselhos eleitos em 178 cidades industriais. Eles assumiram ruas, água e, depois, gás e bondes. Birmingham, sob Joseph Chamberlain nos anos 1870, mostraria quanto socialismo municipal os próprios industriais podiam praticar. A infraestrutura que hoje tomamos como certa foi construída por esses conselhos.',
      source: 'D. Fraser, "Power and Authority in the Victorian City" (1979)',
    },
  },
  {
    id: 'edict-pitt-tax',
    deck: 'edict',
    title: 'Imposto de Renda de Pitt',
    effectText: 'Imposto de guerra — pague £60.',
    effect: { kind: 'pay', amount: 60 },
    education: {
      title: 'O Primeiro Imposto de Renda da Grã-Bretanha',
      date: '1799',
      blurb:
        'William Pitt, o Jovem, introduziu o imposto de renda a 10% para financiar a guerra contra a França revolucionária. Detestado como medida emergencial, foi extinto em 1816 — o Parlamento até queimou os registros. Reinstituído por Peel em 1842 por razões fiscais semelhantes, permaneceu. Fortunas industriais passaram, pela primeira vez, a contribuir diretamente para as finanças do Estado.',
      source: 'M. Daunton, "Trusting Leviathan" (2001)',
    },
  },
  {
    id: 'edict-prison-release',
    deck: 'edict',
    title: 'Perdão Real',
    effectText: 'Um perdão real: guarde esta carta e use-a para escapar da Prisão dos Devedores.',
    effect: { kind: 'keep-get-out-of-prison' },
    education: {
      title: 'Perdões Reais',
      date: 'séculos XVIII–XIX',
      blurb:
        'O monarca manteve o poder pessoal de perdoar prisioneiros bem adentro da era industrial. Penas de degredo à Austrália foram comutadas, devedores libertos, execuções trocadas por prisão. O sistema era inconsistente e político, mas, para muitos criminosos e devedores da era industrial, um perdão era a única rota realista de volta à vida.',
      source: 'S. Devereaux, "Execution and Pardon at the Old Bailey" (2007)',
    },
  },
  {
    id: 'edict-luddite',
    deck: 'edict',
    title: 'Ataque Ludita',
    effectText: 'Teares são destruídos durante a noite — pague £70.',
    effect: { kind: 'pay', amount: 70 },
    education: {
      title: 'Os Luditas',
      date: '1811–1816',
      blurb:
        'Tecelões qualificados em Nottingham, tosadores em Yorkshire e fiandeiros em Lancashire destruíram as máquinas que aniquilavam seus ofícios. Assinavam suas ameaças como "General Ludd". O Parlamento tornou a destruição de teares crime capital; dezessete luditas foram enforcados em York em 1813. A palavra "ludita" virou sinônimo de recusa ao progresso, simplificando injustamente um movimento trabalhista complexo.',
      source: 'E. P. Thompson, "A Formação da Classe Operária Inglesa" (1963)',
    },
  },
  {
    id: 'edict-cholera',
    deck: 'edict',
    title: 'Surto de Cólera',
    effectText: 'Pague por água limpa — £40.',
    effect: { kind: 'pay', amount: 40 },
    education: {
      title: 'Cidades Industriais e Cólera',
      date: '1831, 1848, 1854',
      blurb:
        'A cólera, desconhecida na Grã-Bretanha antes de 1831, matou dezenas de milhares em surtos sucessivos. O mapeamento de mortes de John Snow em 1854, ao redor de uma bomba d\'água no Soho, provou que a transmissão era pela água. O saneamento municipal — esgotos, ruas calçadas, reservatórios cobertos — seguiu lentamente. A saúde pública como a conhecemos surgiu como reação defensiva à era industrial.',
      source: 'S. Johnson, "The Ghost Map" (2006)',
    },
  },
  {
    id: 'edict-pension',
    deck: 'edict',
    title: 'Pagamento de Sociedade de Auxílio Mútuo',
    effectText: 'Dividendos de auxílio mútuo — receba £30.',
    effect: { kind: 'gain', amount: 30 },
    education: {
      title: 'Sociedades de Auxílio Mútuo',
      date: '1793–',
      blurb:
        'A Lei Rose de 1793 reconheceu as sociedades de auxílio mútuo — clubes da classe trabalhadora que juntavam contribuições para cobrir doenças e funerais. Nos anos 1870, quase metade dos homens adultos pertencia a uma. Foram a base do bem-estar auto-organizado da Grã-Bretanha industrial e ensinaram gerações os hábitos da poupança coletiva e da confiança coletiva.',
      source: 'P. Gosden, "The Friendly Societies in England 1815–1875" (1961)',
    },
  },
  {
    id: 'edict-peterloo',
    deck: 'edict',
    title: 'Massacre de Peterloo',
    effectText: 'Você contribui para o fundo das vítimas — pague £50.',
    effect: { kind: 'pay', amount: 50 },
    education: {
      title: 'Peterloo',
      date: '1819',
      blurb:
        'Em St Peter\'s Field, Manchester, uma reunião pacífica de reforma com cerca de 60.000 pessoas foi atacada por cavalaria da milícia. Dezoito morreram, centenas ficaram feridos. O nome "Peterloo" zombava de Waterloo, quatro anos antes. Radicalizou uma geração de trabalhadores e jornalistas industriais, acelerando o longo caminho até o Reform Act de 1832 e além.',
      source: 'R. Poole, "Peterloo: The English Uprising" (2019)',
    },
  },
  {
    id: 'edict-prison',
    deck: 'edict',
    title: 'Intimação por Dívida',
    effectText: 'Você foi intimado — vá diretamente à Prisão dos Devedores.',
    effect: { kind: 'go-to-prison' },
    education: {
      title: 'A Marshalsea',
      date: '1700–1849',
      blurb:
        'A Marshalsea, em Southwark, mantinha devedores em condições que dependiam inteiramente do que eles ou suas famílias pudessem pagar aos carcereiros. O pai de Charles Dickens foi preso lá em 1824; aos doze anos, Charles trabalhou em uma fábrica de graxa para pagar os custos. A Marshalsea fechou em 1842, mas prisões menores para devedores persistiram.',
      source: 'J. Ginger, "The Notable Man: The Life and Times of Oliver Goldsmith" (1977)',
    },
  },
  {
    id: 'edict-railway-mania',
    deck: 'edict',
    title: 'Mania das Ferrovias',
    effectText: 'Suas ações disparam — receba £150.',
    effect: { kind: 'gain', amount: 150 },
    education: {
      title: 'Mania das Ferrovias',
      date: '1845–1847',
      blurb:
        'A Mania das Ferrovias viu o Parlamento autorizar mais de 14.000 km de novas linhas — mais do que a Grã-Bretanha acabou construindo. Especuladores derramaram economias em ações que muitas vezes se revelaram sem valor. Milhares ficaram arruinados; uns poucos fizeram fortunas; o país terminou com uma rede ferroviária superconstruída e mal alinhada. Os ciclos de alta e queda das finanças industriais ganharam um caso de estudo inaugural marcante.',
      source: 'A. Odlyzko, "Collective Hallucinations and Inefficient Markets: The British Railway Mania of the 1840s" (2010)',
    },
  },
];
