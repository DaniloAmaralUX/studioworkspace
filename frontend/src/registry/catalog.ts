// Catálogo dos componentes de interface do Studio.
// O shape espelha o `registry-item.json` do shadcn nos campos que o registry
// consome (name, title, description, dependencies, registryDependencies) e
// isola os campos que são só de tela (category, docOnly, publish). Assim o
// build do registry mapeia cada entrada 1:1, sem renomear nada.
// `files[]` não fica aqui de propósito: é derivado no build a partir do `name`.

export type DsCategory =
  | 'forms'
  | 'overlays'
  | 'navigation'
  | 'feedback'
  | 'data-display'
  | 'layout'

export type CatalogEntry = {
  /** Igual ao arquivo em components/ui/<name>.tsx e ao item do registry. */
  name: string
  title: string
  description: string
  category: DsCategory
  /** Dependências npm do componente (vão para o item do registry). */
  dependencies?: string[]
  /** Outros itens do registry exigidos (ex.: '@studio/button'). */
  registryDependencies?: string[]
  /** Sem demo na galeria — o próprio app é a demonstração. */
  docOnly?: boolean
  /** Fora do registry publicado (default: publica). */
  publish?: boolean
}

export const categories: { id: DsCategory; label: string }[] = [
  { id: 'forms', label: 'Formulários' },
  { id: 'overlays', label: 'Sobreposições' },
  { id: 'navigation', label: 'Navegação' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'data-display', label: 'Exibição' },
  { id: 'layout', label: 'Layout' },
]

/** Comando de instalação a partir do nome — derivado, nunca escrito à mão. */
export function installCommand(name: string): string {
  return `npx shadcn@latest add ${name}`
}

export const catalog: CatalogEntry[] = [
  // ── Formulários ──
  {
    name: 'button',
    title: 'Button',
    description:
      'Ação primária da interface, com variantes de ênfase e tamanhos. Base de vários outros componentes.',
    category: 'forms',
  },
  {
    name: 'input',
    title: 'Input',
    description:
      'Campo de texto de uma linha, com estados de foco, erro e desabilitado alinhados aos tokens.',
    category: 'forms',
  },
  {
    name: 'label',
    title: 'Label',
    description:
      'Rótulo associado a um campo, garantindo a ligação acessível entre texto e controle.',
    category: 'forms',
  },
  {
    name: 'select',
    title: 'Select',
    description:
      'Seleção de uma opção em lista, com navegação por teclado e leitura por leitores de tela.',
    category: 'forms',
  },
  {
    name: 'textarea',
    title: 'Textarea',
    description:
      'Campo de texto de múltiplas linhas para conteúdo livre, como a próxima ação de um projeto.',
    category: 'forms',
  },

  // ── Sobreposições ──
  {
    name: 'dialog',
    title: 'Dialog',
    description:
      'Janela modal para fluxos que exigem foco total, como adicionar um projeto.',
    category: 'overlays',
  },
  {
    name: 'alert-dialog',
    title: 'Alert Dialog',
    description:
      'Confirmação de ação destrutiva. É o único caminho aceito para confirmar — nunca `confirm()` do browser.',
    category: 'overlays',
    registryDependencies: ['button'],
  },
  {
    name: 'dropdown-menu',
    title: 'Dropdown Menu',
    description:
      'Menu de ações ancorado a um gatilho, com suporte a atalhos e separadores.',
    category: 'overlays',
  },
  {
    name: 'sheet',
    title: 'Sheet',
    description:
      'Painel deslizante lateral para conteúdo secundário sem tirar o contexto da tela.',
    category: 'overlays',
  },
  {
    name: 'tooltip',
    title: 'Tooltip',
    description:
      'Dica curta no hover ou foco, para explicar ícones e ações sem rótulo visível.',
    category: 'overlays',
  },

  // ── Navegação ──
  {
    name: 'tabs',
    title: 'Tabs',
    description:
      'Alterna entre painéis irmãos. O conteúdo inativo é desmontado, o que permite carregamento tardio.',
    category: 'navigation',
  },
  {
    name: 'sidebar',
    title: 'Sidebar',
    description:
      'Navegação lateral recolhível com estado persistido. O próprio Studio é a demonstração viva dela.',
    category: 'navigation',
    docOnly: true,
    publish: false,
  },

  // ── Feedback ──
  {
    name: 'alert',
    title: 'Alert',
    description:
      'Mensagem persistente de aviso ou erro dentro do fluxo, com variante destrutiva.',
    category: 'feedback',
  },
  {
    name: 'skeleton',
    title: 'Skeleton',
    description:
      'Placeholder de carregamento que preserva o layout. Substitui texto solto de "carregando".',
    category: 'feedback',
  },
  {
    name: 'sonner',
    title: 'Sonner',
    description:
      'Notificações temporárias empilháveis. Aqui está acoplado ao tema do Studio, então não é publicado no registry.',
    category: 'feedback',
    dependencies: ['sonner', 'next-themes'],
    publish: false,
  },

  // ── Exibição ──
  {
    name: 'badge',
    title: 'Badge',
    description:
      'Rótulo compacto para status, contagem ou categoria, com variantes semânticas.',
    category: 'data-display',
  },
  {
    name: 'card',
    title: 'Card',
    description:
      'Contêiner de conteúdo com header, corpo e rodapé — a unidade visual das listas do Studio.',
    category: 'data-display',
  },

  // ── Layout ──
  {
    name: 'separator',
    title: 'Separator',
    description:
      'Divisor horizontal ou vertical que agrupa conteúdo sem adicionar peso visual.',
    category: 'layout',
  },
  {
    name: 'collapsible',
    title: 'Collapsible',
    description:
      'Área que expande e recolhe. É o que esconde as fontes consultadas no Context Project.',
    category: 'layout',
  },
]
