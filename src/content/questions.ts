import type { Question, TileId } from '@/engine/types';

// Questions map, keyed by tileId. Every gameplay-rule tile (industry, transport,
// utility, tax, card) must have at least one question here. Corner tiles (ids
// 0, 10, 20, 30) have no questions — they skip the quiz phase.
//
// Each tile ships 2–3 authored variants; the engine picks one at random via
// `drawQuestionIndex` every time the player rolls from that tile, so revisits
// feel fresh instead of replaying the same prompt.
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
    {
      id: 'q-cromford-2',
      prompt: 'Qual fonte de energia movia os fusos do water frame em Cromford?',
      options: [
        { id: 'a', text: 'Vapor de carvão' },
        { id: 'b', text: 'Tração animal' },
        { id: 'c', text: 'Queda de água do rio Derwent' },
      ],
      correctOptionId: 'c',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'a' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O próprio nome da máquina entrega a fonte.' },
      ],
      source: 'R. S. Fitton & A. P. Wadsworth, "The Strutts and the Arkwrights" (1958)',
    },
    {
      id: 'q-cromford-3',
      prompt: 'Que perfil de trabalhador Arkwright preferia contratar em Cromford?',
      options: [
        { id: 'a', text: 'Mestres artesãos experientes' },
        { id: 'b', text: 'Mulheres e crianças' },
        { id: 'c', text: 'Soldados aposentados' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Mãos pequenas e salários baixos atendiam o modelo fabril.' },
      ],
      source: 'S. Chapman, "The Cotton Industry in the Industrial Revolution" (1987)',
    },
    {
      id: 'q-cromford-4',
      prompt: 'Que mudança no conceito de tempo de trabalho a fábrica de Cromford simbolizou?',
      options: [
        { id: 'a', text: 'Trabalho medido pelo relógio, não pelo sol' },
        { id: 'b', text: 'Pagamento por dia inteiro de luz solar' },
        { id: 'c', text: 'Calendário lunar de turnos' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'A fábrica funcionava dia e noite em turnos disciplinados.' },
      ],
      source: 'E. P. Thompson, "Time, Work-Discipline, and Industrial Capitalism" (1967)',
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
    {
      id: 'q-edict-2',
      prompt: 'O que as Leis de Combinação (1799–1800) proibiam aos trabalhadores?',
      options: [
        { id: 'a', text: 'Organizar-se em sindicatos' },
        { id: 'b', text: 'Casar antes dos 25 anos' },
        { id: 'c', text: 'Viajar entre condados' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Temia-se que os operários barganhassem salários coletivamente.' },
      ],
      source: 'J. Orth, "Combination and Conspiracy" (1991)',
    },
    {
      id: 'q-edict-3',
      prompt: 'O que a Poor Law Amendment de 1834 criou para receber os pobres?',
      options: [
        { id: 'a', text: 'Workhouses com regime severo' },
        { id: 'b', text: 'Colônias agrícolas livres' },
        { id: 'c', text: 'Bolsas para aprendizes' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'A ideia era tornar a assistência menos atraente que qualquer trabalho.' },
      ],
      source: 'A. Brundage, "The English Poor Laws, 1700–1930" (2002)',
    },
    {
      id: 'q-edict-4',
      prompt: 'Que tipo de administração local cobrava taxas de uso em estradas industriais?',
      options: [
        { id: 'a', text: 'Administrações de pedágios (turnpike trusts)' },
        { id: 'b', text: 'Guildas medievais' },
        { id: 'c', text: 'Companhias coloniais' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Mantinham e cobravam por trechos viários.' },
      ],
      source: 'W. Albert, "The Turnpike Road System in England" (1972)',
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
    {
      id: 'q-strutt-2',
      prompt: 'Qual invento têxtil prévio rendeu fama a Jedediah Strutt antes de Belper?',
      options: [
        { id: 'a', text: 'A malhadeira Derby Rib' },
        { id: 'b', text: 'O pente de aço temperado' },
        { id: 'c', text: 'O fuso duplo de linho' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era um acessório para produzir meias canelada em tricô.' },
      ],
      source: 'R. S. Fitton & A. P. Wadsworth, "The Strutts and the Arkwrights" (1958)',
    },
    {
      id: 'q-strutt-3',
      prompt: 'O que mais as fábricas de Belper ofereciam para prender a mão de obra?',
      options: [
        { id: 'a', text: 'Casas e escolas para operários' },
        { id: 'b', text: 'Ações da empresa' },
        { id: 'c', text: 'Pensão vitalícia' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Os Strutt construíram uma vila fabril ao redor da tecelagem.' },
      ],
      source: 'C. Aspin, "The Water-Spinners" (2003)',
    },
    {
      id: 'q-strutt-4',
      prompt: 'Em que década Jedediah Strutt começou suas melhorias nos teares de meias?',
      options: [
        { id: 'a', text: 'Década de 1750' },
        { id: 'b', text: 'Década de 1820' },
        { id: 'c', text: 'Década de 1870' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Antes da parceria com Arkwright.' },
      ],
      source: 'R. S. Fitton & A. P. Wadsworth, "The Strutts and the Arkwrights" (1958)',
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
    {
      id: 'q-imposto-pitt-2',
      prompt: 'Como o público britânico recebeu o primeiro imposto de renda de Pitt?',
      options: [
        { id: 'a', text: 'Aclamado e mantido sem alterações' },
        { id: 'b', text: 'Extremamente impopular: revogado e reinstaurado' },
        { id: 'c', text: 'Limitado a poucas paróquias rurais' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Demorou décadas até se tornar permanente.' },
      ],
      source: 'M. Daunton, "Trusting Leviathan" (2001)',
    },
    {
      id: 'q-imposto-pitt-3',
      prompt: 'Que despesa consumia a maior parte do orçamento britânico na era de Pitt?',
      options: [
        { id: 'a', text: 'Educação pública' },
        { id: 'b', text: 'Juros da dívida e guerra' },
        { id: 'c', text: 'Obras públicas civis' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'a' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Décadas de conflito europeu inflaram esses gastos.' },
      ],
      source: 'P. K. O\'Brien, "The Political Economy of British Taxation, 1660–1815" (1988)',
    },
    {
      id: 'q-imposto-pitt-4',
      prompt: 'Que classe social sentia mais diretamente o peso do imposto de renda de Pitt?',
      options: [
        { id: 'a', text: 'Os industriais' },
        { id: 'b', text: 'Os arrendatários rurais' },
        { id: 'c', text: 'Os pescadores costeiros' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Geravam a maior parte da renda monetária da época.' },
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
    {
      id: 'q-bridgewater-2',
      prompt: 'Qual engenheiro autodidata projetou o canal de Bridgewater?',
      options: [
        { id: 'a', text: 'James Brindley' },
        { id: 'b', text: 'Thomas Telford' },
        { id: 'c', text: 'John Smeaton' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Ficou famoso por rejeitar mapas e projetar tudo de cabeça.' },
      ],
      source: 'C. Hadfield, "British Canals: An Illustrated History" (1950)',
    },
    {
      id: 'q-bridgewater-3',
      prompt: 'Que obra notável permitiu ao canal cruzar o vale do rio Irwell?',
      options: [
        { id: 'a', text: 'Um túnel submarino' },
        { id: 'b', text: 'O aqueduto de Barton' },
        { id: 'c', text: 'Uma eclusa tripla' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'a' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era visto como uma das maravilhas de engenharia do século.' },
      ],
      source: 'H. Malet, "Bridgewater: The Canal Duke" (1977)',
    },
    {
      id: 'q-bridgewater-4',
      prompt: 'Como ficou conhecido o período de expansão acelerada dos canais britânicos?',
      options: [
        { id: 'a', text: 'A Mania dos Canais' },
        { id: 'b', text: 'O Salto do Ouro' },
        { id: 'c', text: 'A Era do Vapor' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Em 1820 ligava as grandes cidades manufatureiras.' },
      ],
      source: 'C. Hadfield, "British Canals: An Illustrated History" (1950)',
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
    {
      id: 'q-cartwright-2',
      prompt: 'Qual movimento de operários destruiu teares mecânicos entre 1811 e 1816?',
      options: [
        { id: 'a', text: 'Os Chartistas' },
        { id: 'b', text: 'Os Luddites' },
        { id: 'c', text: 'Os Peterloo' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'a' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O nome deriva de um líder mítico chamado Ned.' },
      ],
      source: 'K. Binfield, "Writings of the Luddites" (2004)',
    },
    {
      id: 'q-cartwright-3',
      prompt: 'Qual era a profissão original de Edmund Cartwright, antes de inventar teares?',
      options: [
        { id: 'a', text: 'Clérigo anglicano' },
        { id: 'b', text: 'Oficial naval' },
        { id: 'c', text: 'Farmacêutico' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era reverendo em Leicestershire.' },
      ],
      source: 'M. Strickland, "A Memoir of the Life of Edmund Cartwright" (1843)',
    },
    {
      id: 'q-cartwright-4',
      prompt: 'Que mão de obra preencheu os galpões a vapor com teares mecânicos?',
      options: [
        { id: 'a', text: 'Crianças operadoras' },
        { id: 'b', text: 'Soldados convalescentes' },
        { id: 'c', text: 'Comerciantes itinerantes' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Substituíram as oficinas familiares em uma geração.' },
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
    {
      id: 'q-patentes-2',
      prompt: 'Quantos anos durava uma patente britânica no período georgiano?',
      options: [
        { id: 'a', text: '7 anos' },
        { id: 'b', text: '14 anos' },
        { id: 'c', text: '50 anos' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O prazo era pensado como duas "gerações" de aprendizes de 7 anos.' },
      ],
      source: 'H. Dutton, "The Patent System and Inventive Activity" (1984)',
    },
    {
      id: 'q-patentes-3',
      prompt: 'Qual sociedade científica reunia inventores como Boulton, Watt e Priestley?',
      options: [
        { id: 'a', text: 'Lunar Society de Birmingham' },
        { id: 'b', text: 'Royal Institution' },
        { id: 'c', text: 'Royal Academy' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Reuniam-se sempre perto da lua cheia para voltar em segurança.' },
      ],
      source: 'J. Uglow, "The Lunar Men" (2002)',
    },
    {
      id: 'q-patentes-4',
      prompt: 'Qual conversor de aço passou pelo Escritório de Patentes décadas mais tarde?',
      options: [
        { id: 'a', text: 'O conversor de Bessemer' },
        { id: 'b', text: 'O conversor a propano' },
        { id: 'c', text: 'O conversor de Edison' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Soprava ar para produzir aço barato em larga escala.' },
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
    {
      id: 'q-boulton-2',
      prompt: 'Qual inovação de Watt reduziu drasticamente o consumo de carvão da máquina?',
      options: [
        { id: 'a', text: 'O condensador separado' },
        { id: 'b', text: 'A caldeira aquatubular' },
        { id: 'c', text: 'O pistão duplo horizontal' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Evitava resfriar o cilindro a cada ciclo.' },
      ],
      source: 'R. Dickinson, "James Watt: Craftsman and Engineer" (1936)',
    },
    {
      id: 'q-boulton-3',
      prompt: 'A que clientes Boulton notavelmente vendia potência rotativa a vapor?',
      options: [
        { id: 'a', text: 'Moinhos e cervejarias' },
        { id: 'b', text: 'Forças armadas reais' },
        { id: 'c', text: 'Fazendas de gado' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Eram clientes industriais e de bebidas que precisavam de eixos rotativos.' },
      ],
      source: 'J. Uglow, "The Lunar Men" (2002)',
    },
    {
      id: 'q-boulton-4',
      prompt: 'Que prática de produção a Manufatura Soho foi pioneira em adotar?',
      options: [
        { id: 'a', text: 'Produção integrada sob mesmo teto' },
        { id: 'b', text: 'Trabalho terceirizado em casas' },
        { id: 'c', text: 'Cooperativa autônoma de mestres' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Reunia desenho, fundição, acabamento e montagem em um só lugar.' },
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
    {
      id: 'q-oldknow-2',
      prompt: 'Em que vila Oldknow construiu sua grande tecelagem de algodão?',
      options: [
        { id: 'a', text: 'Mellor, em Derbyshire' },
        { id: 'b', text: 'Leeds, em Yorkshire' },
        { id: 'c', text: 'Bristol, em Somerset' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Ficava perto de outras propriedades de Richard Arkwright.' },
      ],
      source: 'G. Unwin, "Samuel Oldknow and the Arkwrights" (1924)',
    },
    {
      id: 'q-oldknow-3',
      prompt: 'Qual processo intensivo de mão de obra acompanhava a tecelagem de musseline inglesa?',
      options: [
        { id: 'a', text: 'A estampagem por blocos' },
        { id: 'b', text: 'O escaldamento em sal' },
        { id: 'c', text: 'A fermentação em azeite' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Um artesão aplicava carimbos entintados um a um sobre o tecido.' },
      ],
      source: 'S. Chapman, "The Cotton Industry in the Industrial Revolution" (1987)',
    },
    {
      id: 'q-oldknow-4',
      prompt: 'Que padrão paternalista Oldknow combinou em sua propriedade industrial?',
      options: [
        { id: 'a', text: 'Indústria com bem-estar paternalista' },
        { id: 'b', text: 'Bancos e fábricas integrados' },
        { id: 'c', text: 'Cooperativas autônomas' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Sua propriedade incluía até uma escola.' },
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
    {
      id: 'q-wilkinson-2',
      prompt: 'Wilkinson ficou famoso por insistir em usar ferro até para construir…',
      options: [
        { id: 'a', text: 'Seu próprio caixão' },
        { id: 'b', text: 'Casas inteiras' },
        { id: 'c', text: 'Móveis de jardim' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Queria ser enterrado no material que o fez rico.' },
      ],
      source: 'R. A. Mott, "Henry Cort: The Great Finer" (1983)',
    },
    {
      id: 'q-wilkinson-3',
      prompt: 'Qual símbolo da era industrial inglesa foi fundido com ferro de Wilkinson em 1779?',
      options: [
        { id: 'a', text: 'A Ponte de Ferro em Coalbrookdale' },
        { id: 'b', text: 'O Big Ben' },
        { id: 'c', text: 'A Tower Bridge' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Fica sobre o rio Severn, em Shropshire.' },
      ],
      source: 'B. Trinder, "The Industrial Revolution in Shropshire" (1973)',
    },
    {
      id: 'q-wilkinson-4',
      prompt: 'Que outra "primeira" feita de ferro Wilkinson construiu antes do caixão?',
      options: [
        { id: 'a', text: 'Uma barca de ferro' },
        { id: 'b', text: 'Um relógio de bolso' },
        { id: 'c', text: 'Um piano' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Mostrava que ferro podia até flutuar.' },
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
    {
      id: 'q-newcomen-2',
      prompt: 'Em que ano Thomas Newcomen instalou sua primeira máquina atmosférica comercial?',
      options: [
        { id: 'a', text: '1712' },
        { id: 'b', text: '1769' },
        { id: 'c', text: '1800' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Décadas antes de Watt receber sua famosa patente.' },
      ],
      source: 'L. T. C. Rolt, "Thomas Newcomen" (1963)',
    },
    {
      id: 'q-newcomen-3',
      prompt: 'Qual era a maior ineficiência da máquina de Newcomen comparada à de Watt?',
      options: [
        { id: 'a', text: 'Rodas dentadas lentas' },
        { id: 'b', text: 'Grande consumo de carvão' },
        { id: 'c', text: 'Vazamentos de óleo' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Seu cilindro era resfriado e reaquecido a cada ciclo.' },
      ],
      source: 'D. S. Landes, "The Unbound Prometheus" (1969)',
    },
    {
      id: 'q-newcomen-4',
      prompt: 'Segundo a metáfora industrial citada, o que o carvão alimentava diretamente?',
      options: [
        { id: 'a', text: 'O ferro' },
        { id: 'b', text: 'A linhaça' },
        { id: 'c', text: 'A pólvora' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Carvão → ferro → máquinas → algodão.' },
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
    {
      id: 'q-cort-2',
      prompt: 'Em que ano Henry Cort patenteou seu processo de pudelagem?',
      options: [
        { id: 'a', text: '1725' },
        { id: 'b', text: '1784' },
        { id: 'c', text: '1851' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Em plena década da criação dos Estados Unidos.' },
      ],
      source: 'R. A. Mott, "Henry Cort: The Great Finer" (1983)',
    },
    {
      id: 'q-cort-3',
      prompt: 'Que produto final da pudelagem ficava pronto para viras trilhos e vigas?',
      options: [
        { id: 'a', text: 'Ferro-gusa' },
        { id: 'b', text: 'Ferro forjado em barras' },
        { id: 'c', text: 'Aço temperado' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Um material dúctil, fácil de laminar sob rolos.' },
      ],
      source: 'C. K. Hyde, "Technological Change and the British Iron Industry" (1977)',
    },
    {
      id: 'q-cort-4',
      prompt: 'Qual foi o destino pessoal de Henry Cort após sua descoberta?',
      options: [
        { id: 'a', text: 'Foi arruinado por fraude de um sócio' },
        { id: 'b', text: 'Tornou-se par do reino' },
        { id: 'c', text: 'Migrou para a América' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Morreu na miséria, apesar de seu invento.' },
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
    {
      id: 'q-darby-2',
      prompt: 'Em que vale ficava a siderurgia de Darby, berço da fundição com coque?',
      options: [
        { id: 'a', text: 'Vale do Tyne' },
        { id: 'b', text: 'Coalbrookdale, em Shropshire' },
        { id: 'c', text: 'Vale do Tâmisa' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O próprio nome cita o carvão mineral.' },
      ],
      source: 'B. Trinder, "The Industrial Revolution in Shropshire" (1973)',
    },
    {
      id: 'q-darby-3',
      prompt: 'Qual estrutura icônica foi inaugurada em 1779 usando ferro de Coalbrookdale?',
      options: [
        { id: 'a', text: 'A Ponte de Ferro sobre o Severn' },
        { id: 'b', text: 'O farol de Eddystone' },
        { id: 'c', text: 'O Palácio de Cristal' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Até hoje é um marco Patrimônio da Humanidade.' },
      ],
      source: 'N. Cossons & B. Trinder, "The Iron Bridge" (2002)',
    },
    {
      id: 'q-darby-4',
      prompt: 'Quantas gerações da família Darby refinaram o processo de fundição com coque?',
      options: [
        { id: 'a', text: 'Três' },
        { id: 'b', text: 'Uma' },
        { id: 'c', text: 'Sete' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Em 1779 a família construiu a Iron Bridge.' },
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
    {
      id: 'q-lm-railway-2',
      prompt: 'Que político notório morreu atropelado no dia da inauguração de 1830?',
      options: [
        { id: 'a', text: 'William Huskisson' },
        { id: 'b', text: 'Robert Peel' },
        { id: 'c', text: 'George Canning' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Foi a primeira morte por impacto de locomotiva registrada.' },
      ],
      source: 'S. Garfield, "The Last Journey of William Huskisson" (2002)',
    },
    {
      id: 'q-lm-railway-3',
      prompt: 'Que inovação técnica da Rocket otimizava a geração de vapor?',
      options: [
        { id: 'a', text: 'Caldeira multitubular' },
        { id: 'b', text: 'Cilindro único vertical' },
        { id: 'c', text: 'Freio a vácuo' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Aumentava drasticamente a área de troca de calor.' },
      ],
      source: 'M. Bailey, "Stephenson\'s Rocket: A History of a Pioneering Locomotive" (2010)',
    },
    {
      id: 'q-lm-railway-4',
      prompt: 'Que pioneirismo a Liverpool–Manchester estabeleceu em 1830?',
      options: [
        { id: 'a', text: 'Serviço regular interurbano de passageiros e carga a vapor' },
        { id: 'b', text: 'Primeira eletrificação ferroviária' },
        { id: 'c', text: 'Primeira ferrovia subterrânea' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Pedidos por novas linhas inundaram o país semanas depois.' },
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
    {
      id: 'q-tennant-alcali-2',
      prompt: 'Em qual cidade Tennant ergueu sua enorme fábrica de álcali de St. Rollox?',
      options: [
        { id: 'a', text: 'Glasgow' },
        { id: 'b', text: 'Liverpool' },
        { id: 'c', text: 'Bristol' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Ficava na Escócia, perto do rio Clyde.' },
      ],
      source: 'A. & N. L. Clow, "The Chemical Revolution" (1952)',
    },
    {
      id: 'q-tennant-alcali-3',
      prompt: 'Qual processo químico francês alimentou a indústria britânica de soda?',
      options: [
        { id: 'a', text: 'O processo Leblanc' },
        { id: 'b', text: 'O processo Solvay' },
        { id: 'c', text: 'O processo Haber' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Leva o nome de seu inventor francês, da era napoleônica.' },
      ],
      source: 'A. & N. L. Clow, "The Chemical Revolution" (1952)',
    },
    {
      id: 'q-tennant-alcali-4',
      prompt: 'Que dano ambiental da fábrica Tennant motivou primeiras leis de poluição?',
      options: [
        { id: 'a', text: 'Vazamentos de cloro e desmatamento de encostas' },
        { id: 'b', text: 'Erosão costeira severa' },
        { id: 'c', text: 'Tempestades de areia' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'A planta queimava encostas inteiras como combustível.' },
      ],
      source: 'A. & N. L. Clow, "The Chemical Revolution" (1952)',
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
    {
      id: 'q-factory-act-2',
      prompt: 'A Lei Fabril de 1833 proibiu o trabalho de crianças abaixo de qual idade?',
      options: [
        { id: 'a', text: '9 anos' },
        { id: 'b', text: '14 anos' },
        { id: 'c', text: '18 anos' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Ainda era uma idade surpreendentemente baixa para a época.' },
      ],
      source: 'Hutchins & Harrison, "A History of Factory Legislation" (1903)',
    },
    {
      id: 'q-factory-act-3',
      prompt: 'Qual lei posterior limitou a jornada de mulheres e crianças a dez horas?',
      options: [
        { id: 'a', text: 'Ten Hours Act, 1847' },
        { id: 'b', text: 'Reform Act, 1832' },
        { id: 'c', text: 'Merchant Shipping Act, 1854' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O nome já anuncia o limite estabelecido.' },
      ],
      source: 'J. T. Ward, "The Factory Movement 1830–1855" (1962)',
    },
    {
      id: 'q-factory-act-4',
      prompt: 'Que limitação prática a Lei Fabril de 1833 sofria, segundo cronistas da época?',
      options: [
        { id: 'a', text: 'Era frequentemente burlada' },
        { id: 'b', text: 'Aplicava-se apenas em Londres' },
        { id: 'c', text: 'Vigia só aos domingos' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Mesmo assim, o princípio da inspeção foi estabelecido.' },
      ],
      source: 'B. L. Hutchins and A. Harrison, "A History of Factory Legislation" (1903)',
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
    {
      id: 'q-macintosh-2',
      prompt: 'Qual solvente Macintosh usou para dissolver a borracha antes do laminado?',
      options: [
        { id: 'a', text: 'Óleo de linhaça' },
        { id: 'b', text: 'Nafta de carvão' },
        { id: 'c', text: 'Vinagre destilado' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era um subproduto da destilação de hulha.' },
      ],
      source: 'A. & N. L. Clow, "The Chemical Revolution" (1952)',
    },
    {
      id: 'q-macintosh-3',
      prompt: 'Por que as primeiras capas Macintosh costumavam falhar no verão?',
      options: [
        { id: 'a', text: 'A borracha ficava pegajosa no calor' },
        { id: 'b', text: 'O tecido desbotava rápido' },
        { id: 'c', text: 'Os botões derretiam' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Só a vulcanização, décadas depois, resolveria o problema.' },
      ],
      source: 'J. Loadman, "Tears of the Tree: The Story of Rubber" (2005)',
    },
    {
      id: 'q-macintosh-4',
      prompt: 'Quem resolveu, em 1839, o problema da borracha endurecer no inverno?',
      options: [
        { id: 'a', text: 'Charles Goodyear, com a vulcanização' },
        { id: 'b', text: 'Thomas Edison, com aditivos elétricos' },
        { id: 'c', text: 'Louis Pasteur, com ácidos suaves' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Hoje seu sobrenome batiza uma marca de pneus.' },
      ],
      source: 'C. Slack, "Noble Obsession: Charles Goodyear" (2002)',
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
    {
      id: 'q-branqueamento-2',
      prompt: 'Como o branqueamento tradicional do linho era feito antes dos químicos?',
      options: [
        { id: 'a', text: 'Com soro de leite e sol' },
        { id: 'b', text: 'Com corantes azuis' },
        { id: 'c', text: 'Imerso em vinho tinto' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O tecido passava semanas estendido em campos abertos.' },
      ],
      source: 'A. & N. L. Clow, "The Chemical Revolution" (1952)',
    },
    {
      id: 'q-branqueamento-3',
      prompt: 'Que dano ambiental do branqueamento industrial motivou primeiras leis de poluição?',
      options: [
        { id: 'a', text: 'Neves negras e rios envenenados' },
        { id: 'b', text: 'Tornados frequentes' },
        { id: 'c', text: 'Frio anormal nos verões' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era marca registrada do Black Country.' },
      ],
      source: 'A. E. Musson and E. Robinson, "Science and Technology in the Industrial Revolution" (1969)',
    },
    {
      id: 'q-branqueamento-4',
      prompt: 'Que três insumos químicos eram base do branqueamento industrial?',
      options: [
        { id: 'a', text: 'Cloro, cal e ácido sulfúrico' },
        { id: 'b', text: 'Iodo, gesso e álcool' },
        { id: 'c', text: 'Bromo, magnésio e nitrogênio' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O ácido vinha das usinas Leblanc.' },
      ],
      source: 'A. E. Musson and E. Robinson, "Science and Technology in the Industrial Revolution" (1969)',
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
    {
      id: 'q-brunel-tunnel-2',
      prompt: 'O túnel sob o Tâmisa de Marc Brunel foi inaugurado em qual ano?',
      options: [
        { id: 'a', text: '1825' },
        { id: 'b', text: '1843' },
        { id: 'c', text: '1870' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Levou quase 20 anos desde o início das obras.' },
      ],
      source: 'S. Brunel, "The Life of Isambard Kingdom Brunel" (1870)',
    },
    {
      id: 'q-brunel-tunnel-3',
      prompt: 'Quem assumiu como engenheiro-chefe do túnel após inundações quase matarem-no?',
      options: [
        { id: 'a', text: 'Isambard Kingdom Brunel' },
        { id: 'b', text: 'Thomas Telford' },
        { id: 'c', text: 'Joseph Bazalgette' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era o filho do engenheiro fundador do projeto.' },
      ],
      source: 'L. T. C. Rolt, "Isambard Kingdom Brunel" (1957)',
    },
    {
      id: 'q-brunel-tunnel-4',
      prompt: 'Que tipo de obra moderna o escudo de escavação tornou possível?',
      options: [
        { id: 'a', text: 'Túneis de metrô urbano' },
        { id: 'b', text: 'Eclusas marítimas' },
        { id: 'c', text: 'Pontes pênseis' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Permitiu engenharia sob as cidades, não só ao lado delas.' },
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
    {
      id: 'q-corn-laws-2',
      prompt: 'Qual primeiro-ministro rompeu com seu próprio partido para revogar as Leis dos Cereais?',
      options: [
        { id: 'a', text: 'Robert Peel' },
        { id: 'b', text: 'Lord Palmerston' },
        { id: 'c', text: 'William Gladstone' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Também organizou a polícia moderna; os "Bobbies" levam seu nome.' },
      ],
      source: 'B. Hilton, "A Mad, Bad, and Dangerous People?" (2006)',
    },
    {
      id: 'q-corn-laws-3',
      prompt: 'Qual liga de Manchester liderou a campanha popular contra as Leis dos Cereais?',
      options: [
        { id: 'a', text: 'Anti-Corn Law League' },
        { id: 'b', text: 'Liga Chartista' },
        { id: 'c', text: 'Liga Hanseática' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era liderada por Richard Cobden e John Bright.' },
      ],
      source: 'N. McCord, "The Anti-Corn Law League" (1958)',
    },
    {
      id: 'q-corn-laws-4',
      prompt: 'Quem financiava a Liga Anti-Leis dos Cereais em sua campanha de massa?',
      options: [
        { id: 'a', text: 'Donos de fábricas' },
        { id: 'b', text: 'A Igreja Anglicana' },
        { id: 'c', text: 'A Companhia das Índias Orientais' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Pagavam os salários que compravam o pão.' },
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
    {
      id: 'q-maudslay-2',
      prompt: 'Em qual estaleiro real Maudslay produziu máquinas para fabricar blocos navais?',
      options: [
        { id: 'a', text: 'Estaleiro de Portsmouth' },
        { id: 'b', text: 'Estaleiro de Chatham' },
        { id: 'c', text: 'Estaleiro de Harland' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era o principal porto da Marinha Real inglesa.' },
      ],
      source: 'K. R. Gilbert, "The Portsmouth Block-Making Machinery" (1965)',
    },
    {
      id: 'q-maudslay-3',
      prompt: 'Qual aprendiz famoso de Maudslay inventou depois o martelo a vapor?',
      options: [
        { id: 'a', text: 'James Nasmyth' },
        { id: 'b', text: 'Joseph Bramah' },
        { id: 'c', text: 'Eli Whitney' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Seu sobrenome escocês começa com N.' },
      ],
      source: 'J. Nasmyth, "James Nasmyth, Engineer: An Autobiography" (1883)',
    },
    {
      id: 'q-maudslay-4',
      prompt: 'Quais três engenheiros notáveis se formaram nas oficinas de Maudslay?',
      options: [
        { id: 'a', text: 'Whitworth, Nasmyth e Richard Roberts' },
        { id: 'b', text: 'Watt, Boulton e Trevithick' },
        { id: 'c', text: 'Stephenson, Telford e Brunel' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Todos depois nomearam padrões ou máquinas próprios.' },
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
    {
      id: 'q-clyde-2',
      prompt: 'Qual foi o primeiro navio comercial europeu a vapor, lançado no Clyde em 1812?',
      options: [
        { id: 'a', text: 'Comet' },
        { id: 'b', text: 'Sirius' },
        { id: 'c', text: 'Great Eastern' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Seu nome evocava um astro celestial recém-observado.' },
      ],
      source: 'J. R. Hume & M. S. Moss, "Clyde Shipbuilding from Old Photographs" (1977)',
    },
    {
      id: 'q-clyde-3',
      prompt: 'A que companhia Napier forneceu motores que inauguraram o serviço transatlântico?',
      options: [
        { id: 'a', text: 'Cunard Line' },
        { id: 'b', text: 'East India Company' },
        { id: 'c', text: 'Hudson\'s Bay Company' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Foi fundada por Samuel Cunard em 1840.' },
      ],
      source: 'F. E. Hyde, "Cunard and the North Atlantic 1840–1973" (1975)',
    },
    {
      id: 'q-clyde-4',
      prompt: 'Que termo virou sinônimo global de qualidade na construção naval?',
      options: [
        { id: 'a', text: 'Clydebuilt' },
        { id: 'b', text: 'Mersey-rated' },
        { id: 'c', text: 'Tyne-tested' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Vem do rio escocês onde ficavam os estaleiros pioneiros.' },
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
    {
      id: 'q-gwr-2',
      prompt: 'Quem projetou a GWR ligando Londres a Bristol?',
      options: [
        { id: 'a', text: 'Isambard Kingdom Brunel' },
        { id: 'b', text: 'George Stephenson' },
        { id: 'c', text: 'Joseph Locke' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era filho do engenheiro que escavou o túnel do Tâmisa.' },
      ],
      source: 'L. T. C. Rolt, "Isambard Kingdom Brunel" (1957)',
    },
    {
      id: 'q-gwr-3',
      prompt: 'Qual famoso viaduto de Brunel atravessa o vale do rio Brent, em Hanwell?',
      options: [
        { id: 'a', text: 'Viaduto de Wharncliffe' },
        { id: 'b', text: 'Ponte de Britannia' },
        { id: 'c', text: 'Ponte do Forth' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Leva o nome de um barão ligado à concessão da GWR.' },
      ],
      source: 'S. Brindle, "Brunel: The Man Who Built the World" (2005)',
    },
    {
      id: 'q-gwr-4',
      prompt: 'Qual lei de 1846 condenou na prática a bitola larga de Brunel?',
      options: [
        { id: 'a', text: 'A Lei das Bitolas (Gauge Act)' },
        { id: 'b', text: 'O Reform Act' },
        { id: 'c', text: 'O Mines Act' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Lição precoce sobre travas técnicas em redes.' },
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
    {
      id: 'q-stephenson-rocket-2',
      prompt: 'Antes de construir locomotivas, George Stephenson trabalhava em qual indústria?',
      options: [
        { id: 'a', text: 'Têxtil' },
        { id: 'b', text: 'Minas de carvão' },
        { id: 'c', text: 'Fabricação de pólvora' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Começou como operador de máquinas de bombeamento nas minas.' },
      ],
      source: 'L. T. C. Rolt, "George and Robert Stephenson" (1960)',
    },
    {
      id: 'q-stephenson-rocket-3',
      prompt: 'Que ferrovia de carvão foi inaugurada por Stephenson em 1825?',
      options: [
        { id: 'a', text: 'Stockton & Darlington' },
        { id: 'b', text: 'Grand Junction Railway' },
        { id: 'c', text: 'Metropolitan Railway' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Ligava minas do norte ao rio Tees.' },
      ],
      source: 'M. Kirby, "The Origins of Railway Enterprise" (1993)',
    },
    {
      id: 'q-stephenson-rocket-4',
      prompt: 'Que mudança social cotidiana a era ferroviária inaugurou?',
      options: [
        { id: 'a', text: 'A primeira viagem diária ao trabalho' },
        { id: 'b', text: 'O fim das hospedarias rurais' },
        { id: 'c', text: 'A criação do correio postal' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Junto veio o primeiro horário nacional.' },
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
    {
      id: 'q-whitworth-2',
      prompt: 'Whitworth ficou famoso pela precisão a que medida mínima, inédita à época?',
      options: [
        { id: 'a', text: 'Um milímetro' },
        { id: 'b', text: 'Um milionésimo de polegada' },
        { id: 'c', text: 'Um centímetro' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Usou placas planas ópticas para aferir essa exatidão.' },
      ],
      source: 'N. Atkinson, "Sir Joseph Whitworth" (1996)',
    },
    {
      id: 'q-whitworth-3',
      prompt: 'De quem Whitworth foi aprendiz antes de abrir sua ferramentaria em Manchester?',
      options: [
        { id: 'a', text: 'Henry Maudslay' },
        { id: 'b', text: 'James Watt' },
        { id: 'c', text: 'Robert Owen' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Foi o maior mestre inglês de máquinas-ferramenta do período.' },
      ],
      source: 'L. T. C. Rolt, "Tools for the Job: A History of Machine Tools" (1965)',
    },
    {
      id: 'q-whitworth-4',
      prompt: 'Que status formal alcançou a rosca Whitworth na indústria britânica?',
      options: [
        { id: 'a', text: 'Norma nacional britânica' },
        { id: 'b', text: 'Padrão exclusivo da Marinha' },
        { id: 'c', text: 'Marca proibida pelo Parlamento' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Inspirou padrões internacionais posteriores.' },
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
    {
      id: 'q-water-manchester-2',
      prompt: 'Que ato governamental central John Snow tomou após identificar a bomba infectada?',
      options: [
        { id: 'a', text: 'Remoção do braço da bomba' },
        { id: 'b', text: 'Fechamento de toda Manchester' },
        { id: 'c', text: 'Construção de um hospital' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Uma medida simples e imediata, não uma obra grande.' },
      ],
      source: 'S. Johnson, "The Ghost Map" (2006)',
    },
    {
      id: 'q-water-manchester-3',
      prompt: 'Qual teoria dominante sobre doenças Snow contestou com seu estudo da cólera?',
      options: [
        { id: 'a', text: 'Teoria miasmática (ar fétido)' },
        { id: 'b', text: 'Teoria humoral (fluidos corporais)' },
        { id: 'c', text: 'Teoria química (desbalanço de sais)' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Culpava odores pestilentos das cidades.' },
      ],
      source: 'C. Hamlin, "Public Health and Social Justice in the Age of Chadwick" (1998)',
    },
    {
      id: 'q-water-manchester-4',
      prompt: 'Em que ano os reservatórios de Longdendale começaram a abastecer Manchester?',
      options: [
        { id: 'a', text: '1848' },
        { id: 'b', text: '1700' },
        { id: 'c', text: '1900' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Mesma década do mapa do Soho de John Snow.' },
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
    {
      id: 'q-selfactor-2',
      prompt: 'Em que ano Richard Roberts patenteou o selfactor, a mule autoatuante?',
      options: [
        { id: 'a', text: '1764' },
        { id: 'b', text: '1830' },
        { id: 'c', text: '1889' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Foi durante o auge das tensões trabalhistas em Manchester.' },
      ],
      source: 'R. L. Hills, "Power in the Industrial Revolution" (1970)',
    },
    {
      id: 'q-selfactor-3',
      prompt: 'Qual greve de fiandeiros foi gatilho direto para o desenvolvimento do selfactor?',
      options: [
        { id: 'a', text: 'Greve dos fiandeiros de Manchester, 1824' },
        { id: 'b', text: 'Revolta de Peterloo, 1819' },
        { id: 'c', text: 'Greve geral de Londres, 1842' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Os patrões queriam uma máquina que dispensasse o operário habilidoso.' },
      ],
      source: 'W. Lazonick, "Industrial Relations and Technical Change" (1979)',
    },
    {
      id: 'q-selfactor-4',
      prompt: 'Qual perfil de trabalhador o selfactor passou a empregar com frequência?',
      options: [
        { id: 'a', text: 'Mulheres e crianças' },
        { id: 'b', text: 'Mestres veteranos' },
        { id: 'c', text: 'Ex-marinheiros' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Quebrou o poder dos fiandeiros qualificados.' },
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
    {
      id: 'q-koenig-times-2',
      prompt: 'Quantas folhas por hora a prensa Koenig imprimia, contra 250 da prensa manual?',
      options: [
        { id: 'a', text: 'Cerca de 400' },
        { id: 'b', text: 'Cerca de 1.100' },
        { id: 'c', text: 'Cerca de 50.000' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Cerca de quatro vezes o ritmo manual anterior.' },
      ],
      source: 'J. Moran, "Printing Presses: History and Development" (1973)',
    },
    {
      id: 'q-koenig-times-3',
      prompt: 'Como The Times testou a nova prensa sem alertar seus próprios trabalhadores?',
      options: [
        { id: 'a', text: 'Imprimiu em um galpão secreto' },
        { id: 'b', text: 'Alugou a prensa por um dia' },
        { id: 'c', text: 'Enviou operários em férias pagas' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Temiam protestos violentos por conta do desemprego iminente.' },
      ],
      source: 'S. Morison, "The History of The Times" (1935)',
    },
    {
      id: 'q-koenig-times-4',
      prompt: 'Que efeito social a impressão a vapor de Koenig viabilizou?',
      options: [
        { id: 'a', text: 'Jornais e opinião pública de massa' },
        { id: 'b', text: 'Voto eletrônico' },
        { id: 'c', text: 'Telegrafia sem fio' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O preço da folha despencou drasticamente.' },
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
    {
      id: 'q-stanhope-2',
      prompt: 'O que permitia à prensa Stanhope imprimir folhas maiores com menos esforço?',
      options: [
        { id: 'a', text: 'Um sistema de alavancas composto' },
        { id: 'b', text: 'Um motor a vapor interno' },
        { id: 'c', text: 'Um rolo de borracha' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era ainda operada por tração humana.' },
      ],
      source: 'J. Moran, "Printing Presses: History and Development" (1973)',
    },
    {
      id: 'q-stanhope-3',
      prompt: 'Que processo de reprodução de matrizes Charles Stanhope ajudou a popularizar?',
      options: [
        { id: 'a', text: 'Estereotipia' },
        { id: 'b', text: 'Fotogravura' },
        { id: 'c', text: 'Linotipia' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Permitia fazer cópias metálicas fundidas de páginas compostas.' },
      ],
      source: 'M. Twyman, "Printing 1770–1970" (1970)',
    },
    {
      id: 'q-stanhope-4',
      prompt: 'Qual tecnologia de prensa Stanhope substituiu, em uso desde o século XV?',
      options: [
        { id: 'a', text: 'Prensa de parafuso de madeira' },
        { id: 'b', text: 'Prensa hidráulica' },
        { id: 'c', text: 'Prensa rotativa a vapor' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era essencialmente o design da época de Gutenberg.' },
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
    {
      id: 'q-telegrafo-2',
      prompt: 'Quais britânicos patentearam o primeiro telégrafo elétrico comercial, em 1837?',
      options: [
        { id: 'a', text: 'Cooke e Wheatstone' },
        { id: 'b', text: 'Morse e Vail' },
        { id: 'c', text: 'Bell e Watson' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Testaram sua invenção na linha Great Western Railway.' },
      ],
      source: 'G. Hubbard, "Cooke and Wheatstone and the Invention of the Electric Telegraph" (1965)',
    },
    {
      id: 'q-telegrafo-3',
      prompt: 'Que caso criminal de 1845 tornou o telégrafo notícia nacional na Grã-Bretanha?',
      options: [
        { id: 'a', text: 'A prisão do assassino John Tawell' },
        { id: 'b', text: 'O escândalo Hatton Garden' },
        { id: 'c', text: 'O assalto ao Banco de Lincoln' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'A descrição do criminoso chegou antes que ele.' },
      ],
      source: 'T. Standage, "The Victorian Internet" (1998)',
    },
    {
      id: 'q-telegrafo-4',
      prompt: 'Que infraestrutura encolheu o mundo na era vitoriana, em vinte anos?',
      options: [
        { id: 'a', text: 'Os cabos telegráficos transatlânticos' },
        { id: 'b', text: 'As linhas ferroviárias polares' },
        { id: 'c', text: 'Os túneis sob os Alpes' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Primeira tentativa duradoura cruzou o Atlântico em 1866.' },
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
    {
      id: 'q-caslon-2',
      prompt: 'Em qual cidade britânica William Caslon abriu sua fundição de tipos em 1720?',
      options: [
        { id: 'a', text: 'Londres' },
        { id: 'b', text: 'Oxford' },
        { id: 'c', text: 'Edimburgo' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'A capital, então o centro do mundo editorial inglês.' },
      ],
      source: 'J. Mosley, "The Nymph and the Grot" (1999)',
    },
    {
      id: 'q-caslon-3',
      prompt: 'Antes de fundir tipos, William Caslon trabalhava como gravador especializado em quê?',
      options: [
        { id: 'a', text: 'Ornamentos para armas de fogo' },
        { id: 'b', text: 'Joias religiosas' },
        { id: 'c', text: 'Selos postais' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Trabalhou na ornamentação de canos de pistolas.' },
      ],
      source: 'J. Mosley, "The Nymph and the Grot" (1999)',
    },
    {
      id: 'q-caslon-4',
      prompt: 'Em qual rua londrina ficavam as fundições de tipos como a Caslon?',
      options: [
        { id: 'a', text: 'Chiswell Street' },
        { id: 'b', text: 'Fleet Street' },
        { id: 'c', text: 'Downing Street' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Próxima ao bairro de Moorfields, fora da City.' },
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
    {
      id: 'q-lbr-2',
      prompt: 'Que obra notável de Robert Stephenson atravessou colinas arenosas em Northamptonshire?',
      options: [
        { id: 'a', text: 'Túnel de Kilsby' },
        { id: 'b', text: 'Viaduto de Chirk' },
        { id: 'c', text: 'Ponte de Conwy' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Lidou com alagamentos inesperados de areia movediça.' },
      ],
      source: 'L. T. C. Rolt, "George and Robert Stephenson" (1960)',
    },
    {
      id: 'q-lbr-3',
      prompt: 'Qual estação londrina serviu de terminal original da Ferrovia Londres–Birmingham?',
      options: [
        { id: 'a', text: 'Euston' },
        { id: 'b', text: 'King\'s Cross' },
        { id: 'c', text: 'Paddington' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Tinha um icônico arco dórico, hoje demolido.' },
      ],
      source: 'A. A. Jackson, "London\'s Termini" (1969)',
    },
    {
      id: 'q-lbr-4',
      prompt: 'Quantas classes diferentes de passageiros a Londres–Birmingham transportava?',
      options: [
        { id: 'a', text: 'Quatro' },
        { id: 'b', text: 'Duas' },
        { id: 'c', text: 'Sete' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'As ferrovias tornaram a classe visível em aço e veludo.' },
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
    {
      id: 'q-hargreaves-2',
      prompt: 'Em qual década Hargreaves demonstrou pela primeira vez sua spinning jenny?',
      options: [
        { id: 'a', text: 'Década de 1760' },
        { id: 'b', text: 'Década de 1820' },
        { id: 'c', text: 'Década de 1840' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Precedeu o water frame de Arkwright.' },
      ],
      source: 'R. C. Allen, "The British Industrial Revolution in Global Perspective" (2009)',
    },
    {
      id: 'q-hargreaves-3',
      prompt: 'Por que fiandeiras locais invadiram a casa de Hargreaves em Blackburn?',
      options: [
        { id: 'a', text: 'Temiam ficar desempregadas pela máquina' },
        { id: 'b', text: 'Buscavam salários atrasados' },
        { id: 'c', text: 'Reclamavam do barulho' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'A jenny ameaçava o modo tradicional de fiar em casa.' },
      ],
      source: 'W. A. Abram, "Blackburn Characters of a Past Generation" (1894)',
    },
    {
      id: 'q-hargreaves-4',
      prompt: 'Em que cidade fiandeiras destruíram jennies de Hargreaves em 1768?',
      options: [
        { id: 'a', text: 'Blackburn' },
        { id: 'b', text: 'Londres' },
        { id: 'c', text: 'Edimburgo' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Cidade de Lancashire, berço do algodão inglês.' },
      ],
      source: 'W. A. Abram, "Blackburn Characters of a Past Generation" (1894)',
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
    {
      id: 'q-bank-england-2',
      prompt: 'Em que ano o Banco da Inglaterra foi fundado, apoiando guerras reais?',
      options: [
        { id: 'a', text: '1694' },
        { id: 'b', text: '1776' },
        { id: 'c', text: '1844' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Foi criado para financiar a guerra contra Luís XIV.' },
      ],
      source: 'J. Clapham, "The Bank of England: A History" (1944)',
    },
    {
      id: 'q-bank-england-3',
      prompt: 'Qual lei de 1844 de Peel restringiu a emissão de notas do Banco da Inglaterra?',
      options: [
        { id: 'a', text: 'Bank Charter Act' },
        { id: 'b', text: 'Corn Law Repeal' },
        { id: 'c', text: 'Navigation Act' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Ligava a emissão de papel-moeda às reservas de ouro.' },
      ],
      source: 'J. Clapham, "The Bank of England: A History" (1944)',
    },
    {
      id: 'q-bank-england-4',
      prompt: 'Para qual onda de financiamento ferroviário o sistema bancário moderno surgiu?',
      options: [
        { id: 'a', text: 'A Mania das Ferrovias' },
        { id: 'b', text: 'A bolha das tulipas' },
        { id: 'c', text: 'O South Sea Bubble' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'b' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Bancos por ações foram autorizados a partir de 1826.' },
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
    {
      id: 'q-window-tax-2',
      prompt: 'Em qual ano o polêmico Imposto das Janelas britânico foi finalmente abolido?',
      options: [
        { id: 'a', text: '1799' },
        { id: 'b', text: '1851' },
        { id: 'c', text: '1901' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 20, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'O mesmo ano da Grande Exposição de Londres.' },
      ],
      source: 'W. Kennedy, "English Taxation, 1640–1799" (1913)',
    },
    {
      id: 'q-window-tax-3',
      prompt: 'Quem pagava diretamente o Imposto das Janelas, segundo a lei britânica?',
      options: [
        { id: 'a', text: 'O proprietário do imóvel' },
        { id: 'b', text: 'O inquilino ocupante' },
        { id: 'c', text: 'A guilda dos vidreiros' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Na prática, o custo era repassado ao aluguel.' },
      ],
      source: 'W. Kennedy, "English Taxation, 1640–1799" (1913)',
    },
    {
      id: 'q-window-tax-4',
      prompt: 'Que outras taxas fragmentadas a Coroa cobrava no século XVIII?',
      options: [
        { id: 'a', text: 'Lareiras, sabão, velas e sal' },
        { id: 'b', text: 'Cavalos e carruagens' },
        { id: 'c', text: 'Cervejas e vinhos' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Atingiam itens domésticos cotidianos.' },
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
    {
      id: 'q-east-india-2',
      prompt: 'Em qual ano a Grã-Bretanha aboliu o tráfico transatlântico de escravos?',
      options: [
        { id: 'a', text: '1776' },
        { id: 'b', text: '1807' },
        { id: 'c', text: '1861' },
      ],
      correctOptionId: 'b',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'William Wilberforce liderou a campanha parlamentar.' },
      ],
      source: 'A. Hochschild, "Bury the Chains" (2005)',
    },
    {
      id: 'q-east-india-3',
      prompt: 'Que privilégio a Companhia das Índias Orientais manteve na Ásia após 1813?',
      options: [
        { id: 'a', text: 'O monopólio do comércio com a China' },
        { id: 'b', text: 'O direito de cunhar moeda britânica' },
        { id: 'c', text: 'A abolição de tarifas têxteis' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Era centrado principalmente no chá de Cantão.' },
      ],
      source: 'H. V. Bowen, "The Business of Empire" (2006)',
    },
    {
      id: 'q-east-india-4',
      prompt: 'Que estrutura institucional a Companhia das Índias Orientais mantinha além do comércio?',
      options: [
        { id: 'a', text: 'Exército privado e máquina fiscal próprias' },
        { id: 'b', text: 'Apenas escolas e hospitais' },
        { id: 'c', text: 'Somente uma frota mercante' },
      ],
      correctOptionId: 'a',
      hints: [
        { id: 'h1', kind: 'eliminate-option', priceCash: 30, payload: 'c' },
        { id: 'h2', kind: 'clue-text', priceCash: 40, payload: 'Estavam entrelaçadas com a ascensão industrial britânica.' },
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
