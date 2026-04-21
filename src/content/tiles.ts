import type { Tile } from '@/engine/types';

// 40-tile roster, indices 0..39, traversed in ascending order.
// Corner tiles sit at 0, 10, 20, 30. Card and special tiles interleave with industries.
// Prices, rents, and upgrade costs are first-cut values for v0.1 and will be tuned via playtest.

export const TILES: readonly Tile[] = [
  {
    id: 0,
    role: 'corner',
    corner: 'start',
    name: 'Manchester — Início',
    education: {
      title: 'Manchester: A Oficina do Mundo',
      date: 'década de 1780',
      blurb:
        'No final do século XVIII, Manchester havia se tornado o coração pulsante da Revolução Industrial. Seu clima úmido favorecia a fiação de algodão, suas minas de carvão alimentavam máquinas a vapor, e seus canais transportavam fardos a baixo custo. Viajantes a descreviam como chocante e maravilhosa ao mesmo tempo. Cada volta ao redor do tabuleiro traz os jogadores de volta aqui, onde novos investimentos são financiados.',
      source: 'Friedrich Engels, "A Situação da Classe Trabalhadora na Inglaterra" (1845)',
    },
  },
  {
    id: 1,
    role: 'industry',
    name: 'Tecelagem de Cromford',
    sector: 'textiles',
    price: 60,
    rents: [4, 10, 30, 90, 160, 250],
    upgradeCost: 50,
    mortgage: 30,
    education: {
      title: 'A Tecelagem de Arkwright em Cromford',
      date: '1771',
      blurb:
        'A tecelagem de algodão movida a água de Richard Arkwright, em Cromford, é amplamente considerada a primeira fábrica moderna. Funcionava dia e noite, alojava os trabalhadores no local e dividia as tarefas em turnos disciplinados. O modelo inspirou cidades-fábrica em todo o mundo e redefiniu o próprio trabalho: algo medido pelo relógio, não mais pelo sol.',
      source: 'R. Fitton, "The Arkwrights: Spinners of Fortune" (1989)',
    },
  },
  {
    id: 2,
    role: 'card',
    deck: 'edict',
    name: 'Edital Comunitário',
    education: {
      title: 'Editais e Decretos',
      date: '1760–1840',
      blurb:
        'O Parlamento e as autoridades locais emitiram uma torrente de editais durante a industrialização — leis de cercamento, leis fabris, leis dos pobres, administrações de pedágios. Alguns ergueram o país à modernidade; outros destruíram comunidades. O baralho de Editais representa essas decisões coletivas: às vezes um ganho inesperado, às vezes um custo duro imposto a todos os proprietários.',
      source: 'E. P. Thompson, "A Formação da Classe Operária Inglesa" (1963)',
    },
  },
  {
    id: 3,
    role: 'industry',
    name: 'Tecelagem Norte de Strutt',
    sector: 'textiles',
    price: 60,
    rents: [4, 10, 30, 90, 160, 250],
    upgradeCost: 50,
    mortgage: 30,
    education: {
      title: 'Jedediah Strutt e o Tear de Meias',
      date: '1758',
      blurb:
        'As melhorias de Jedediah Strutt nos teares de meias e sua posterior parceria com Arkwright tornaram o vale do Derwent um berço do sistema fabril. A Tecelagem Norte em Belper introduziu estruturas de ferro para reduzir o risco de incêndio — um caso raro em que a engenharia de segurança impulsionou a inovação arquitetônica antes que a regulação exigisse isso.',
      source: 'S. D. Chapman, "The Early Factory Masters" (1967)',
    },
  },
  {
    id: 4,
    role: 'tax',
    name: 'Imposto do Parlamento',
    amount: 100,
    education: {
      title: 'Imposto de Renda e as Guerras Napoleônicas',
      date: '1799',
      blurb:
        'William Pitt, o Jovem, introduziu o primeiro imposto de renda da Grã-Bretanha em 1799 para financiar a guerra contra Napoleão. Extremamente impopular, foi revogado, reinstaurado e revogado novamente ao longo de décadas antes de se tornar permanente. Os industriais sentiam seu peso diretamente, moldando debates sobre quem deveria pagar pelas ambições crescentes do Estado.',
      source: 'M. Daunton, "Trusting Leviathan: The Politics of Taxation in Britain 1799–1914" (2001)',
    },
  },
  {
    id: 5,
    role: 'transport',
    name: 'Canal de Bridgewater',
    price: 200,
    rentByCount: [25, 50, 100, 200],
    mortgage: 100,
    education: {
      title: 'O Canal de Bridgewater',
      date: '1761',
      blurb:
        'O canal do Duque de Bridgewater reduziu pela metade o preço do carvão em Manchester e provou que vias aquáticas artificiais podiam superar as estradas de cavalos. Iniciou a chamada Mania dos Canais: em 1820, uma rede de águas interiores ligava todas as grandes cidades manufatureiras. Os canais foram a primeira superpotência logística da Revolução Industrial, antes que as ferrovias os ultrapassassem.',
      source: 'H. Malet, "Bridgewater: The Canal Duke" (1977)',
    },
  },
  {
    id: 6,
    role: 'industry',
    name: 'Tear Mecânico de Cartwright',
    sector: 'textiles',
    price: 100,
    rents: [6, 15, 45, 125, 200, 300],
    upgradeCost: 50,
    mortgage: 50,
    education: {
      title: 'O Tear Mecânico de Edmund Cartwright',
      date: '1785',
      blurb:
        'O tear mecânico de Cartwright mecanizou a tecelagem, o último gargalo persistente na produção de algodão. As primeiras máquinas eram rudimentares e odiadas pelos tecelões manuais, cujo sustento desmoronou. Em uma geração, galpões a vapor cheios de teares operados por crianças substituíram as oficinas familiares, acelerando tanto a produtividade quanto a convulsão social.',
      source: 'D. Bythell, "The Handloom Weavers" (1969)',
    },
  },
  {
    id: 7,
    role: 'card',
    deck: 'invention',
    name: 'Painel de Invenções',
    education: {
      title: 'Patentes e a Explosão Inventiva',
      date: '1760–1830',
      blurb:
        'O Escritório de Patentes tornou-se uma das instituições mais movimentadas da era. A máquina a vapor de Watt, o processo de pudelagem de Cort, o conversor de Bessemer e incontáveis dispositivos menores passaram por lá. O baralho de Invenções representa as apostas do capitalismo de patentes: às vezes uma patente paga, às vezes o detentor é chamado a pagar.',
      source: 'C. MacLeod, "Inventing the Industrial Revolution" (1988)',
    },
  },
  {
    id: 8,
    role: 'industry',
    name: 'Manufatura Soho de Boulton',
    sector: 'textiles',
    price: 100,
    rents: [6, 15, 45, 125, 200, 300],
    upgradeCost: 50,
    mortgage: 50,
    education: {
      title: 'Matthew Boulton e as Obras de Soho',
      date: '1762',
      blurb:
        'A Manufatura Soho de Matthew Boulton, perto de Birmingham, foi pioneira na produção integrada: desenho, fundição, acabamento e montagem sob um mesmo teto. Abrigou a parceria com James Watt que comercializou a máquina a vapor. O talento de Boulton para o marketing — ele vendeu potência rotativa a vapor para moinhos e cervejarias — fez a nova tecnologia dar lucro.',
      source: 'J. Uglow, "The Lunar Men" (2002)',
    },
  },
  {
    id: 9,
    role: 'industry',
    name: 'Tecelagem de Algodão de Oldknow',
    sector: 'textiles',
    price: 120,
    rents: [8, 20, 60, 160, 250, 350],
    upgradeCost: 50,
    mortgage: 60,
    education: {
      title: 'Samuel Oldknow e a Musseline Fina',
      date: 'década de 1780',
      blurb:
        'Samuel Oldknow provou que o algodão britânico podia igualar a musselina indiana em finura por uma fração do custo. Suas obras em Mellor, Derbyshire, combinavam fiação, tecelagem e estampa; sua propriedade incluía até uma escola. O experimento de Oldknow uniu produção industrial e bem-estar paternalista, um padrão repetido depois por Titus Salt e George Cadbury.',
      source: 'G. Unwin, "Samuel Oldknow and the Arkwrights" (1924)',
    },
  },
  {
    id: 10,
    role: 'corner',
    corner: 'prison',
    name: 'Prisão dos Devedores',
    education: {
      title: 'A Marshalsea e a Prisão dos Devedores',
      date: 'séculos XVIII–XIX',
      blurb:
        'Antes da reforma da falência, uma dívida não paga podia aprisionar o devedor indefinidamente, às custas dos próprios credores. O pai de Charles Dickens foi preso na Marshalsea por uma conta de padeiro. Prisões como a King\'s Bench abrigavam famílias inteiras. A reforma veio lentamente, mas o espectro da prisão por dívida assombrou os comerciantes da era — e assombra este tabuleiro.',
      source: 'C. Dickens, "A Pequena Dorrit" (1857)',
    },
  },
  {
    id: 11,
    role: 'industry',
    name: 'Siderurgia de Bersham — Wilkinson',
    sector: 'coal-iron',
    price: 140,
    rents: [10, 25, 75, 225, 300, 400],
    upgradeCost: 100,
    mortgage: 70,
    education: {
      title: 'John Wilkinson e o Mandrilamento de Precisão',
      date: '1775',
      blurb:
        'John "Iron-Mad" Wilkinson patenteou uma máquina de mandrilar canhões precisa o bastante para finalizar os cilindros da máquina a vapor de Watt. Sem ela, a máquina de condensação poderia ter permanecido uma curiosidade. Wilkinson também construiu a primeira barca de ferro, o primeiro púlpito de ferro e o primeiro caixão de ferro — era obcecado pelo material e ajudou a torná-lo moeda industrial.',
      source: 'A. N. Palmer, "John Wilkinson and the Old Bersham Ironworks" (1899)',
    },
  },
  {
    id: 12,
    role: 'utility',
    name: 'Bomba de Mina de Newcomen',
    price: 150,
    multipliers: [4, 10],
    mortgage: 75,
    education: {
      title: 'A Máquina Atmosférica de Newcomen',
      date: '1712',
      blurb:
        'A máquina atmosférica de Thomas Newcomen, posta a bombear água das minas de carvão, foi o primeiro uso prático da energia a vapor. Era ineficiente — queimava uma montanha de carvão por um trabalho modesto —, mas resolvia um problema crítico: poços mais profundos. Carvão alimentava o ferro, ferro alimentava as máquinas, máquinas alimentavam o algodão. A máquina sob a mina tornou todo o resto possível.',
      source: 'L. T. C. Rolt, "Thomas Newcomen: The Prehistory of the Steam Engine" (1963)',
    },
  },
  {
    id: 13,
    role: 'industry',
    name: 'Forno de Pudelagem de Cort',
    sector: 'coal-iron',
    price: 140,
    rents: [10, 25, 75, 225, 300, 400],
    upgradeCost: 100,
    mortgage: 70,
    education: {
      title: 'Henry Cort e a Pudelagem',
      date: '1784',
      blurb:
        'O processo de pudelagem e laminação de Henry Cort produziu ferro maleável a partir do ferro-gusa em volumes inéditos. A Grã-Bretanha deixou de importar ferro para inundar a Europa com ele. O processo literalmente remodelou edifícios, navios e maquinário. O próprio Cort foi arruinado pela fraude de um sócio e morreu na miséria — uma nota cruel para uma técnica que transformou o mundo.',
      source: 'R. A. Mott, "Henry Cort: The Great Finer" (1983)',
    },
  },
  {
    id: 14,
    role: 'industry',
    name: 'Coalbrookdale de Darby',
    sector: 'coal-iron',
    price: 160,
    rents: [12, 30, 90, 270, 360, 460],
    upgradeCost: 100,
    mortgage: 80,
    education: {
      title: 'Abraham Darby e o Ferro Fundido a Coque',
      date: '1709',
      blurb:
        'Abraham Darby I descobriu que o coque, e não o carvão vegetal, podia fundir ferro em Coalbrookdale. Foi uma revolução silenciosa: a produção britânica de ferro se libertou dos limites de suas florestas. Três gerações dos Darby refinaram o processo e, em 1779, a família construiu a Iron Bridge — a primeira do gênero e um símbolo da era que ainda hoje se mantém de pé.',
      source: 'B. Trinder, "The Industrial Revolution in Shropshire" (1973)',
    },
  },
  {
    id: 15,
    role: 'transport',
    name: 'Ferrovia Liverpool-Manchester',
    price: 200,
    rentByCount: [25, 50, 100, 200],
    mortgage: 100,
    education: {
      title: 'A Primeira Ferrovia Interurbana',
      date: '1830',
      blurb:
        'A Ferrovia Liverpool-Manchester foi a primeira a operar serviços regulares de passageiros e cargas a vapor entre duas grandes cidades. Provou que o trem podia superar os canais em todos os quesitos. O dia da inauguração teve um parlamentar morto pela locomotiva Rocket, de Stephenson — um custo precoce e público da velocidade —, mas pedidos de novas linhas inundaram o país em semanas.',
      source: 'R. H. G. Thomas, "The Liverpool and Manchester Railway" (1980)',
    },
  },
  {
    id: 16,
    role: 'industry',
    name: 'Fábrica de Álcali de Tennant',
    sector: 'chemicals',
    price: 180,
    rents: [14, 35, 100, 300, 400, 500],
    upgradeCost: 100,
    mortgage: 90,
    education: {
      title: 'Charles Tennant e o Pó de Branqueamento',
      date: '1799',
      blurb:
        'O pó de branqueamento patenteado por Charles Tennant transformou o acabamento têxtil — antes, uma tarefa de semanas sob o sol — em questão de horas. Sua fábrica em St Rollox, perto de Glasgow, tornou-se a maior planta química da Europa. O lado sombrio da indústria — vazamentos de cloro, desmatamento de encostas por combustível — motivou, meio século depois, algumas das primeiras leis de poluição.',
      source: 'A. Clow and N. L. Clow, "The Chemical Revolution" (1952)',
    },
  },
  {
    id: 17,
    role: 'card',
    deck: 'edict',
    name: 'Edital Comunitário',
    education: {
      title: 'A Lei Fabril de 1833',
      date: '1833',
      blurb:
        'A Lei Fabril de 1833 proibiu o emprego de crianças abaixo dos nove anos em fábricas têxteis e limitou as horas das crianças menores de treze. Também nomeou os primeiros inspetores fabris — o Estado finalmente aprendendo a olhar dentro dos prédios que produziam sua riqueza. A lei foi muito burlada, mas o princípio da inspeção havia chegado.',
      source: 'B. L. Hutchins and A. Harrison, "A History of Factory Legislation" (1903)',
    },
  },
  {
    id: 18,
    role: 'industry',
    name: 'Fábrica de Borracha de Macintosh',
    sector: 'chemicals',
    price: 180,
    rents: [14, 35, 100, 300, 400, 500],
    upgradeCost: 100,
    mortgage: 90,
    education: {
      title: 'Charles Macintosh e o Tecido Impermeável',
      date: '1823',
      blurb:
        'Charles Macintosh patenteou um método para colocar borracha entre camadas de tecido, dando ao mundo seu primeiro casaco verdadeiramente impermeável. A borracha, por si só, era um problema — endurecia no inverno e fedia no verão — até que a vulcanização de Charles Goodyear resolveu isso em 1839. O mackintosh se tornou tanto uma palavra quanto uma peça essencial do guarda-roupa industrial britânico.',
      source: 'G. Macintosh, "Biographical Memoir of the Late Charles Macintosh" (1847)',
    },
  },
  {
    id: 19,
    role: 'industry',
    name: 'Campos de Branqueamento de Tennant',
    sector: 'chemicals',
    price: 200,
    rents: [16, 40, 110, 330, 440, 550],
    upgradeCost: 100,
    mortgage: 100,
    education: {
      title: 'A Química do Tecido Branco',
      date: 'década de 1790',
      blurb:
        'O branqueamento industrial usava cloro derivado de sal, cal e ácido sulfúrico — o ácido, por sua vez, fabricado em larga escala nas usinas Leblanc. A demanda por tecidos, lençóis e papéis "brancos" criou a primeira indústria química pesada da Europa. Também produziu as neves negras do Black Country e rios envenenados que moldariam a futura legislação ambiental.',
      source: 'A. E. Musson and E. Robinson, "Science and Technology in the Industrial Revolution" (1969)',
    },
  },
  {
    id: 20,
    role: 'corner',
    corner: 'public-square',
    name: 'Praça Pública',
    education: {
      title: 'Os Protestos nas Praças de Manchester',
      date: '1819',
      blurb:
        'As cidades industriais não tinham representação parlamentar até bem adentro do século XIX. As praças públicas tornaram-se sua arena política — a mais famosa sendo St Peter\'s Field, em Manchester, onde a cavalaria atacou uma reunião reformista em 1819, matando dezoito pessoas. O Massacre de Peterloo galvanizou a luta pelo Reform Act. A praça pública deste tabuleiro é uma pausa em meio à tempestade.',
      source: 'R. Poole, "Peterloo: The English Uprising" (2019)',
    },
  },
  {
    id: 21,
    role: 'industry',
    name: 'Túnel do Tâmisa de Brunel',
    sector: 'shipyards',
    price: 220,
    rents: [18, 45, 125, 375, 500, 620],
    upgradeCost: 150,
    mortgage: 110,
    education: {
      title: 'O Escudo de Escavação de Brunel',
      date: '1825',
      blurb:
        'Marc Isambard Brunel inventou o escudo de escavação — um quadro de ferro rolante que permitia aos mineiros cavar sob o Tâmisa com segurança. Seu filho, Isambard Kingdom Brunel, conduziu a construção. Enchentes e mortes atrasaram a obra por anos, mas a técnica se tornou o ancestral de todos os túneis de metrô desde então. Abriu novas fronteiras à engenharia sob as cidades, e não apenas ao lado delas.',
      source: 'S. Brunel, "The Life of Isambard Kingdom Brunel" (1870)',
    },
  },
  {
    id: 22,
    role: 'card',
    deck: 'edict',
    name: 'Edital Comunitário',
    education: {
      title: 'As Leis dos Cereais',
      date: '1815–1846',
      blurb:
        'As Leis dos Cereais mantinham os preços do grão altos, restringindo importações, agradando aos proprietários de terra e enfurecendo os manufatureiros que pagavam os salários que compravam o pão. A Liga Anti-Leis dos Cereais, financiada por donos de fábricas, tornou-se um dos primeiros grupos de pressão de massa organizados. Sua vitória em 1846 marcou um ponto de virada política: os interesses industriais finalmente pesavam mais que os rurais.',
      source: 'N. McCord, "The Anti-Corn Law League" (1958)',
    },
  },
  {
    id: 23,
    role: 'industry',
    name: 'Motores Marítimos Maudslay',
    sector: 'shipyards',
    price: 220,
    rents: [18, 45, 125, 375, 500, 620],
    upgradeCost: 150,
    mortgage: 110,
    education: {
      title: 'Henry Maudslay, o Mecânico dos Mecânicos',
      date: 'século XIX inicial',
      blurb:
        'Henry Maudslay formou uma geração de engenheiros — Joseph Whitworth, James Nasmyth, Richard Roberts — e produziu o primeiro torno de rosca preciso o bastante para peças intercambiáveis. Seus motores marítimos impulsionavam navios a vapor que uniriam impérios. Maudslay argumentava que a arte manual, não a escala, era o verdadeiro motor da indústria. O argumento ainda ecoa nos debates de manufatura.',
      source: 'J. Nasmyth, "James Nasmyth, Engineer: An Autobiography" (1883)',
    },
  },
  {
    id: 24,
    role: 'industry',
    name: 'Estaleiro Clyde de Napier',
    sector: 'shipyards',
    price: 240,
    rents: [20, 50, 140, 400, 540, 670],
    upgradeCost: 150,
    mortgage: 120,
    education: {
      title: 'Construído no Clyde',
      date: 'década de 1830',
      blurb:
        'Os estaleiros de Robert Napier no rio Clyde foram pioneiros em navios a vapor de ferro e formaram engenheiros que fundariam metade das firmas famosas do Clyde. "Clydebuilt" tornou-se sinônimo global de qualidade. A indústria atingiria seu auge mais tarde no século, mas seu DNA industrial — caldeiras marítimas, eixos de hélice, desenho de cascos — foi estabelecido nessas primeiras décadas de construção naval a ferro e vapor.',
      source: 'J. Napier, "Life of Robert Napier of West Shandon" (1904)',
    },
  },
  {
    id: 25,
    role: 'transport',
    name: 'Great Western Railway',
    price: 200,
    rentByCount: [25, 50, 100, 200],
    mortgage: 100,
    education: {
      title: 'A Bitola Larga de Brunel',
      date: '1835',
      blurb:
        'Isambard Kingdom Brunel projetou a Great Western Railway com bitola de 2,13 m, mais larga que os 1,43 m adotados em outros lugares. A bitola larga rodava mais suave e rápido, mas a incompatibilidade com o resto da rede britânica a condenou. A "Lei das Bitolas" de 1846 padronizou a maioria das rotas — uma lição precoce sobre efeitos de rede e travas técnicas.',
      source: 'L. T. C. Rolt, "Isambard Kingdom Brunel" (1957)',
    },
  },
  {
    id: 26,
    role: 'industry',
    name: 'Oficina de Locomotivas Stephenson',
    sector: 'railways-industries',
    price: 260,
    rents: [22, 55, 150, 430, 580, 720],
    upgradeCost: 150,
    mortgage: 130,
    education: {
      title: 'A "Rocket" de George Stephenson',
      date: '1829',
      blurb:
        'Nos Ensaios de Rainhill, a "Rocket" de George e Robert Stephenson alcançou em média 19 km/h puxando carga e 48 km/h sem carga, superando todas as rivais. A vitória estabeleceu o modelo de todas as locomotivas futuras: caldeira multitubular, tração direta, um par de rodas motrizes. Nasceu a era da ferrovia — e, com ela, a primeira viagem diária ao trabalho e o primeiro horário nacional.',
      source: 'R. Young, "Timothy Hackworth and the Locomotive" (1923)',
    },
  },
  {
    id: 27,
    role: 'industry',
    name: 'Ferramentaria de Whitworth',
    sector: 'railways-industries',
    price: 260,
    rents: [22, 55, 150, 430, 580, 720],
    upgradeCost: 150,
    mortgage: 130,
    education: {
      title: 'Joseph Whitworth e a Rosca Padrão',
      date: '1841',
      blurb:
        'As roscas, porcas e parafusos padronizados por Joseph Whitworth puseram fim a uma indústria caótica em que cada oficina fabricava seus próprios tamanhos. A padronização soa entediante, mas foi revolucionária — peças de fábricas diferentes finalmente encaixavam. A rosca Whitworth tornou-se norma britânica e inspirou padrões internacionais posteriores.',
      source: 'N. Atkinson, "Sir Joseph Whitworth: The World\'s Best Mechanician" (1996)',
    },
  },
  {
    id: 28,
    role: 'utility',
    name: 'Abastecimento de Água de Manchester',
    price: 150,
    multipliers: [4, 10],
    mortgage: 75,
    education: {
      title: 'Reservatórios e Água Pública',
      date: '1847',
      blurb:
        "As cidades industriais superaram seus poços. Os reservatórios de Longdendale, em Manchester, iniciados em 1848, abasteciam centenas de milhares de pessoas com água limpa e serviram de modelo para conselhos municipais de águas. As mesmas décadas viram surtos aterradores de cólera. O mapa de 1854, de John Snow, ligando uma bomba do bairro do Soho à doença, foi um momento fundador da epidemiologia.",
      source: 'S. Johnson, "The Ghost Map" (2006)',
    },
  },
  {
    id: 29,
    role: 'industry',
    name: 'Selfactor de Roberts',
    sector: 'railways-industries',
    price: 280,
    rents: [24, 60, 165, 460, 620, 760],
    upgradeCost: 150,
    mortgage: 140,
    education: {
      title: 'O Selfactor de Richard Roberts',
      date: '1830',
      blurb:
        'Richard Roberts mecanizou o delicado movimento de retorno do tear-mula com um mecanismo de came e corrente. O selfactor podia ser operado por trabalhadores relativamente não qualificados — muitas vezes mulheres e crianças — e quebrou o poder de barganha dos fiandeiros qualificados que haviam formado os primeiros sindicatos industriais britânicos. A produtividade cresceu; os salários, para muitos, caíram.',
      source: 'W. Lazonick, "Industrial Relations and Technical Change" (1979)',
    },
  },
  {
    id: 30,
    role: 'corner',
    corner: 'go-to-prison',
    name: 'Preso pelo Guarda',
    education: {
      title: 'Guardas e a Nova Polícia',
      date: '1829',
      blurb:
        'Antes da Lei da Polícia Metropolitana de 1829, de Sir Robert Peel, o policiamento londrino era feito por guardas paroquiais e vigias privados. Os "peelers" de Peel usavam azul para se distinguir de soldados. A densidade de estranhos das cidades industriais tornara obsoleto o sistema antigo; a nova força era um produto industrial como qualquer outro.',
      source: 'C. Emsley, "The English Police: A Political and Social History" (1991)',
    },
  },
  {
    id: 31,
    role: 'industry',
    name: 'Oficina de Impressão do Times',
    sector: 'publishing',
    price: 300,
    rents: [26, 65, 180, 500, 670, 820],
    upgradeCost: 200,
    mortgage: 150,
    education: {
      title: 'A Prensa a Vapor de Koenig',
      date: '1814',
      blurb:
        'Em 29 de novembro de 1814, o The Times foi impresso pela primeira vez na prensa cilíndrica a vapor de Friedrich Koenig — 1.100 folhas por hora, quatro vezes a velocidade da impressão manual. Jornais de massa tornaram-se possíveis; a opinião pública de massa também. O editor contrabandeou a máquina para dentro do prédio, com medo de que os impressores a destruíssem.',
      source: 'S. Morison, "The History of The Times" (1935)',
    },
  },
  {
    id: 32,
    role: 'industry',
    name: 'Prensa de Ferro de Stanhope',
    sector: 'publishing',
    price: 300,
    rents: [26, 65, 180, 500, 670, 820],
    upgradeCost: 200,
    mortgage: 150,
    education: {
      title: 'A Prensa Manual de Ferro',
      date: '1800',
      blurb:
        'Charles, Conde de Stanhope, substituiu a prensa de parafuso de madeira — essencialmente um design do século XV — por uma estrutura toda em ferro e uma alavanca articulada. O resultado imprimia páginas maiores e mais nítidas com menos esforço. A produtividade da impressão começou sua escalada rumo às prensas rotativas que inundariam as cidades de jornais baratos e livros populares.',
      source: 'M. Twyman, "Printing 1770–1970" (1970)',
    },
  },
  {
    id: 33,
    role: 'card',
    deck: 'invention',
    name: 'Painel de Invenções',
    education: {
      title: 'O Telégrafo',
      date: '1837',
      blurb:
        'O telégrafo de cinco agulhas de Cooke e Wheatstone, patenteado em 1837, enviava mensagens mais rápido do que um trem — pela primeira vez na história, a comunicação superava o transporte. Foi usado pela primeira vez para capturar um assassino que fugia de Slough em 1845. Em vinte anos, cabos transatlânticos haviam encolhido o mundo para a primeira geração que aprenderia a chamá-lo de "pequeno".',
      source: 'T. Standage, "The Victorian Internet" (1998)',
    },
  },
  {
    id: 34,
    role: 'industry',
    name: 'Fundição de Tipos Caslon',
    sector: 'publishing',
    price: 320,
    rents: [28, 70, 200, 550, 750, 900],
    upgradeCost: 200,
    mortgage: 160,
    education: {
      title: 'Os Tipos Caslon e a Face do Impresso Inglês',
      date: 'década de 1720',
      blurb:
        'A fundição de William Caslon produziu tipos tão práticos e elegantes que a Declaração de Independência dos Estados Unidos foi inicialmente composta com eles. Sob a industrialização, as fundições de tipos se mecanizaram e se multiplicaram. A forma dos livros, panfletos e jornais de todo um século foi decidida em lugares como Chiswell Street — fábricas silenciosas que quase se podia ler.',
      source: 'J. Mosley, "The Nymph and the Grot" (1999)',
    },
  },
  {
    id: 35,
    role: 'transport',
    name: 'Ferrovia Londres-Birmingham',
    price: 200,
    rentByCount: [25, 50, 100, 200],
    mortgage: 100,
    education: {
      title: 'A Londres-Birmingham',
      date: '1838',
      blurb:
        'Robert Stephenson projetou a Ferrovia Londres-Birmingham atravessando o calcário das Chilterns e a argila londrina ao norte. Seu Arco de Euston, demolido em 1962, foi por um século o portão cerimonial da era ferroviária. A linha transportava quatro classes de passageiros, cada uma em carruagens diferentes — as ferrovias tornaram a classe visível em aço e veludo.',
      source: 'T. Roscoe, "The London and Birmingham Railway" (1838)',
    },
  },
  {
    id: 36,
    role: 'card',
    deck: 'invention',
    name: 'Painel de Invenções',
    education: {
      title: 'A Fiandeira de Hargreaves',
      date: '1764',
      blurb:
        'A spinning jenny de James Hargreaves permitia a um operário fiar oito fios ao mesmo tempo, depois dezesseis, depois mais. Um ofício artesanal que ocupava aldeias inteiras desabou em fábricas caseiras em uma década. Fiandeiros manuais enfurecidos destruíram jennies nas ruas de Blackburn em 1768; a invenção se espalhou ainda assim. A produtividade pode ser cruel com seus perdedores.',
      source: 'J. Allen, "The British Industrial Revolution in Global Perspective" (2009)',
    },
  },
  {
    id: 37,
    role: 'industry',
    name: 'Banco da Inglaterra',
    sector: 'banking',
    price: 350,
    rents: [35, 80, 220, 600, 800, 980],
    upgradeCost: 200,
    mortgage: 175,
    education: {
      title: 'O Banco da Inglaterra e o Capital Industrial',
      date: 'fundado em 1694',
      blurb:
        'O monopólio do Banco da Inglaterra sobre o banco por ações em Londres atrasou o financiamento industrial por décadas — os donos de siderúrgicas dos Midlands e os fiandeiros de Lancashire se apoiavam em bancos regionais e redes pessoais de crédito. A reforma de 1826 permitiu bancos por ações além de 105 km de Londres, semeando o sistema bancário moderno bem a tempo da Mania das Ferrovias.',
      source: 'P. L. Cottrell, "Industrial Finance 1830–1914" (1980)',
    },
  },
  {
    id: 38,
    role: 'tax',
    name: 'Tributo da Coroa',
    amount: 75,
    education: {
      title: 'O Imposto das Janelas',
      date: '1696–1851',
      blurb:
        'O Imposto das Janelas cobrava das residências por cada janela acima de um limite. Os proprietários vedavam aberturas com tijolo para evitá-lo, produzindo o "roubo em plena luz do dia" dos interiores georgianos sombrios. Foi uma de muitas taxas fragmentadas — sobre lareiras, sabão, velas, sal — pelas quais a Coroa extraía receita das residências industriais sem um imposto de renda formal durante a maior parte do século XVIII.',
      source: 'A. M. T. Watkin, "The Window Tax" (1890)',
    },
  },
  {
    id: 39,
    role: 'industry',
    name: 'Sede da Companhia das Índias Orientais',
    sector: 'empire',
    price: 400,
    rents: [50, 100, 280, 700, 900, 1100],
    upgradeCost: 200,
    mortgage: 200,
    education: {
      title: 'A Revolução Industrial e o Império',
      date: '1757–1858',
      blurb:
        'A Revolução Industrial britânica não pode ser separada de seu império. O algodão indiano foi superado em preço — e depois teve seu mercado capturado — pelas fábricas de Lancashire. O algodão produzido por escravos nos Estados Unidos alimentava essas mesmas fábricas. O exército privado, a alfândega e a máquina fiscal da Companhia das Índias Orientais estavam entrelaçados com a ascensão industrial do país. Este espaço é seu contrapeso mais sombrio.',
      source: 'S. Beckert, "Empire of Cotton" (2014)',
    },
  },
] as const;

export function getTile(id: number): Tile {
  const t = TILES[id];
  if (!t) throw new Error(`Tile not found: ${id}`);
  return t;
}

export function tilesInSector(sector: string): ReadonlyArray<Tile> {
  return TILES.filter((t) => t.role === 'industry' && t.sector === sector);
}

export function transportTiles(): ReadonlyArray<Tile> {
  return TILES.filter((t) => t.role === 'transport');
}

export function utilityTiles(): ReadonlyArray<Tile> {
  return TILES.filter((t) => t.role === 'utility');
}
