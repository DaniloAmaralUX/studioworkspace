# FRONTEND.md — Project Studio (Hub)

Interface web local (aberta no navegador) que consome o Workspace Service em `127.0.0.1`. Foco em
**achar/entrar rápido** e **carga cognitiva baixa** (TDAH-aware). Ver telas/fluxos em [`DESIGN.md`](./DESIGN.md).

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix por baixo) — usar **`npm`**, não `pnpm` (bug conhecido de
  shadcn/pnpm neste ambiente Windows).
- **Ícones:** `lucide-react`.
- **Dados/servidor:** `@tanstack/react-query` (fetch, cache, invalidação) sobre um cliente `fetch` fino.
- **Roteamento:** `react-router-dom` (poucas rotas) — ou estado local de tela se preferir ainda mais enxuto.

## Como rodar

```bash
cd frontend
npm install
npm run dev     # Vite → http://127.0.0.1:5177
```

O backend precisa estar rodando em `http://127.0.0.1:5178`. Base da API via
`VITE_API_BASE=http://127.0.0.1:5178/api` (`.env.local`).

## Setup shadcn (uma vez)

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
# Tailwind v4 + shadcn conforme docs oficiais:
npx shadcn@latest init            # base color: zinc; CSS variables: yes
npx shadcn@latest add button card input badge dialog sheet tabs select \
  dropdown-menu tooltip skeleton scroll-area separator label switch sonner
```

## Estrutura de pastas

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # provider React Query + rotas
│   ├── lib/
│   │   ├── api.ts              # cliente REST (base VITE_API_BASE) — funções por endpoint
│   │   ├── types.ts            # Project, Foundation, ... (espelha PRD.md §7 / BACKEND.md)
│   │   └── utils.ts            # cn(), formatação de datas ("há 3 dias")
│   ├── hooks/
│   │   ├── useProjects.ts      # query lista + mutations (patch, delete, add)
│   │   ├── useGithubRepos.ts   # query repos do gh
│   │   └── useLaunchers.ts     # query abridores disponíveis
│   ├── components/
│   │   ├── ui/                 # shadcn (gerado)
│   │   ├── ProjectCard.tsx     # card com próxima ação inline + abridores + badges
│   │   ├── NextActionInput.tsx # edição inline com auto-save (debounce)
│   │   ├── AddProjectDialog.tsx# abas Local / GitHub
│   │   ├── HubToolbar.tsx      # busca + filtros + ordenar + "Adicionar projeto"
│   │   ├── OpenWithMenu.tsx    # dropdown de abridores (só os disponíveis)
│   │   ├── SourceBadge.tsx     # ícone local/GitHub
│   │   ├── StatusBadge.tsx
│   │   └── EmptyState.tsx
│   ├── screens/
│   │   ├── HubScreen.tsx       # Home (grid de cards)
│   │   └── FoundationScreen.tsx# configurador estilo shadcn/create
│   └── index.css               # Tailwind + tokens (ver DESIGN.md)
├── .env.local                  # VITE_API_BASE=...
├── components.json             # shadcn
└── package.json
```

## Cliente de API (`lib/api.ts`)

Uma função por endpoint do [`BACKEND.md`](./BACKEND.md). Assinaturas:

```ts
listProjects(): Promise<Project[]>
addLocalProject(path: string, name?: string): Promise<Project>
addGithubProject(nameWithOwner: string): Promise<Project>
patchProject(id: string, patch: Partial<Pick<Project,'nextAction'|'status'|'tags'|'name'>>): Promise<Project>
deleteProject(id: string): Promise<void>
listGithubRepos(query?: string): Promise<GithubRepo[]>
getLaunchers(): Promise<Launchers>
openProject(id: string, withTool: LauncherKind): Promise<{ ok: true; opened: string }>
getFoundation(id: string): Promise<Foundation | null>
putFoundation(id: string, f: Partial<Foundation>): Promise<Foundation>
applyFoundation(id: string, only?: 'theme'|'font'): Promise<{ command: string; designMdPath: string }>
```

Todas as mutations invalidam a query `['projects']` (React Query) para o hub refletir na hora.

## Telas (resumo — detalhe em DESIGN.md)

### 1. Hub (Home) — `HubScreen`
- **Toolbar:** campo de busca, filtros (tag / stack / fonte local·GitHub), ordenar (última atividade,
  nome, status), botão **Adicionar projeto**.
- **Grid de `ProjectCard`:** nome + `SourceBadge` + `StatusBadge` + tags + stack + "última atividade" +
  **próxima ação editável inline** + `OpenWithMenu`.
- Estados: **empty** (nenhum projeto → CTA adicionar), **loading** (skeletons), **error** (com retry),
  backend offline (aviso "suba o Workspace Service").

### 2. Adicionar projeto — `AddProjectDialog`
- Abas: **Pasta local** (input de caminho — colar/escolher; valida no backend) e **GitHub** (lista
  buscável dos meus repos via `gh`; selecionar um ou mais).

### 3. Configurador de Foundation — `FoundationScreen`
- Layout 3 colunas estilo `shadcn/create`: **decisões** (esq) · **preview real** (centro) · **resumo +
  comando shadcn** (dir). Ver DESIGN.md.

## Padrões de UX (TDAH-aware)

- **Próxima ação sempre visível** e editável direto no card (auto-save com debounce; sem "modo edição").
- **Uma ação principal por tela**; defaults recomendados; no máximo ~6 escolhas por vez.
- Feedback imediato (optimistic update + `sonner` para toasts).
- Nada de dashboard cheio de métrica decorativa. Densidade confortável por padrão.
- Atalho de teclado para busca (`/` ou `Ctrl+K`) para "achar rápido".

## Context Project

- O cabeçalho alterna entre **Conversa geral** e projetos com fonte GitHub.
- Trocar de projeto com conversa iniciada exige confirmação, cancela a requisição ativa e limpa o
  histórico efêmero; `Enter` envia e `Shift+Enter` quebra linha.
- Respostas contextuais mostram projeto, horário da consulta, estado completo/parcial, avisos, fontes
  recolhíveis e uma próxima ação que só é salva por clique explícito.

## Skills

- `/skills` lista 15 skills curadas de interface e design engineering, agrupadas por autor.
- Cada card explica quando usar a skill, aponta para a fonte no GitHub e oferece um comando copiável.
- Cada coleção pode ser instalada de uma vez com `npx skills add`, mantendo os arquivos dentro do projeto.
- A tela funciona igual na cloud e no desktop: ela não escreve no GitHub nem executa comandos sozinha.

## Login do Studio Cloud

- `/login` é uma tela cloud-only com senha única para o workspace pessoal.
- Após autenticar, o servidor grava uma sessão segura de sete dias em cookie `HttpOnly`; o frontend
  nunca recebe nem persiste o segredo de assinatura.
- A sidebar oferece **Sair do Studio**, que expira a sessão e volta para `/login`.
- O parâmetro `next` aceita somente caminhos internos iniciados por `/`, evitando redirecionamento
  para domínios externos.
- A conexão GitHub na sidebar é um indicador passivo. Na cloud não há botão de entrar/sair do GitHub:
  o PAT read-only vive somente em `GITHUB_TOKEN` no servidor.

## Tema

- shadcn com CSS variables; suportar claro/escuro (o app segue o tema do SO por padrão).
- Tokens próprios do app em `index.css` (ver DESIGN.md → "Foundation do próprio Project Studio").

## Auditoria de dependências

A exceção temporária do `npm audit` para o advisory RSC do React Router está
registrada em [`docs/plans/r0-cloud-hardening.md`](./docs/plans/r0-cloud-hardening.md).
Ela só é aceitável enquanto esta aplicação continuar sendo uma SPA Vite sem
RSC, SSR ou Server Actions.
