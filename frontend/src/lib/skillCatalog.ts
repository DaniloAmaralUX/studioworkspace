export type SkillCatalogItem = {
  id: string
  title: string
  description: string
  useWhen: string
  command: string
  sourceUrl: string
  collectionId: string
}

export type SkillCollection = {
  id: string
  title: string
  description: string
  repository: string
  sourceUrl: string
  installCommand: string
}

function collection(
  id: string,
  title: string,
  description: string,
  repository: string,
): SkillCollection {
  return {
    id,
    title,
    description,
    repository,
    sourceUrl: `https://github.com/${repository}`,
    installCommand: `npx skills add ${repository} --skill '*' --copy -y`,
  }
}

export const skillCollections: SkillCollection[] = [
  collection(
    'jakubkrehel',
    'Interface Essentials',
    'Fundamentos de acessibilidade, layout, tipografia, cores, escrita e acabamento visual.',
    'jakubkrehel/skills',
  ),
  collection(
    'emilkowalski',
    'Motion & Design Engineering',
    'Critérios de design engineering, animação, movimento e escolha de componentes.',
    'emilkowalski/skills',
  ),
]

function skill(
  collectionId: string,
  id: string,
  title: string,
  description: string,
  useWhen: string,
): SkillCatalogItem {
  const source = skillCollections.find((item) => item.id === collectionId)

  if (!source) {
    throw new Error(`Coleção de skill desconhecida: ${collectionId}`)
  }

  return {
    id,
    title,
    description,
    useWhen,
    collectionId,
    command: `npx skills add ${source.repository} --skill ${id} --copy -y`,
    sourceUrl: `${source.sourceUrl}/tree/main/skills/${id}`,
  }
}

export const skillCatalog: SkillCatalogItem[] = [
  skill(
    'jakubkrehel',
    'better-accessibility',
    'Acessibilidade',
    'Orienta foco, teclado, semântica, formulários, leitores de tela e redução de movimento.',
    'Componentes, diálogos, menus, formulários e revisões WCAG.',
  ),
  skill(
    'jakubkrehel',
    'better-colors',
    'Cores',
    'Trabalha com OKLCH, contraste, gamut, tokens semânticos e temas claros ou escuros.',
    'Paletas, contraste, design tokens e Tailwind.',
  ),
  skill(
    'jakubkrehel',
    'better-interface',
    'Revisão completa',
    'Coordena uma revisão de interface entre acessibilidade, layout, escrita, tipografia, cores e UI.',
    'Auditorias holísticas de uma tela, fluxo ou produto.',
  ),
  skill(
    'jakubkrehel',
    'better-layout',
    'Layout',
    'Melhora agrupamento, alinhamento, hierarquia, espaçamento, adaptação e ordem de leitura.',
    'Páginas responsivas, grids, painéis e progressive disclosure.',
  ),
  skill(
    'jakubkrehel',
    'better-typography',
    'Tipografia',
    'Cuida de fontes, escala, pesos, espaçamento, wrapping, truncamento e números técnicos.',
    'Hierarquia de texto, legibilidade e comportamento responsivo.',
  ),
  skill(
    'jakubkrehel',
    'better-ui',
    'Polimento de UI',
    'Refina superfícies, ícones, estados, microinterações e movimento com atenção aos detalhes.',
    'Componentes, hover, active, elevação e feedback visual.',
  ),
  skill(
    'jakubkrehel',
    'better-writing',
    'UX Writing',
    'Aprimora labels, botões, erros, estados vazios e instruções com linguagem clara e consistente.',
    'Textos de interface, mensagens e fluxos de produto.',
  ),
  skill(
    'emilkowalski',
    'emil-design-eng',
    'Design Engineering',
    'Reúne critérios de acabamento, componentes e animação baseados na prática de Emil Kowalski.',
    'Construir interfaces com decisões de movimento e detalhe mais consistentes.',
  ),
  skill(
    'emilkowalski',
    'review-animations',
    'Revisar animações',
    'Avalia animações existentes com uma régua exigente de timing, easing e comportamento.',
    'Revisões de motion antes de publicar uma interface.',
  ),
  skill(
    'emilkowalski',
    'improve-animations',
    'Melhorar animações',
    'Audita o movimento do produto e gera planos priorizados e executáveis de melhoria.',
    'Transformar problemas de animação em tarefas claras para o agente.',
  ),
  skill(
    'emilkowalski',
    'find-animation-opportunities',
    'Oportunidades de movimento',
    'Encontra pontos em que animação ajuda de verdade e também indica o que deve permanecer estático.',
    'Planejar motion com propósito, sem animar a interface inteira.',
  ),
  skill(
    'emilkowalski',
    'animation-vocabulary',
    'Vocabulário de animação',
    'Traduz descrições vagas de movimento para os termos corretos de animação e interação.',
    'Explicar com precisão ao agente qual efeito ou comportamento você espera.',
  ),
  skill(
    'emilkowalski',
    'apple-design',
    'Apple Design',
    'Leva princípios de interface e movimento das sessões de design da Apple para produtos web.',
    'Revisar fluidez, hierarquia, resposta e continuidade das interações.',
  ),
  skill(
    'emilkowalski',
    'pick-ui-library',
    'Escolher biblioteca de UI',
    'Ajuda a selecionar bibliotecas confiáveis antes de criar componentes complexos do zero.',
    'Decidir entre componentes prontos para toast, diálogo, drag, motion e outras necessidades.',
  ),
  skill(
    'emilkowalski',
    'prototype',
    'Prototipar variações',
    'Cria múltiplas versões de uma peça de UI e permite compará-las por meio de um seletor.',
    'Explorar alternativas antes de fechar uma decisão visual.',
  ),
]
