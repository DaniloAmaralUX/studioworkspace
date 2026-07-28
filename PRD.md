# PRD — Project Studio

> **Hub visual local dos meus projetos** para achar, organizar e entrar neles rápido — com uma
> "próxima ação" sempre visível e um configurador de _foundation_ estilo `shadcn/create`.

- **Status:** Draft para MVP
- **Plataforma:** Windows, uso pessoal, local (single-user)
- **Autor/usuário:** Danilo (UX Designer → UX Engineer). Tem TDAH — reduzir carga cognitiva é requisito, não enfeite.
- **Repositório:** projeto novo, separado do Ouvidoria Pitang.

---

## 1. Resumo executivo

Hoje o trabalho fica espalhado entre várias pastas, repositórios no GitHub, Claude Code, Codex e
PowerShell. Falta um lugar único para **ver todos os projetos, achar o certo em segundos e entrar nele**
sabendo onde parei e qual é a próxima ação.

O Project Studio é um **hub local** onde cada projeto — seja uma **pasta local** ou um **repositório do
GitHub** — vira um card visual com status, stack, última atividade e uma **próxima ação editável e
sempre visível**. De cada card dá para **abrir o projeto** na ferramenta certa (Claude Code Desktop,
Windows Terminal, Explorer). Além disso, um **configurador de _foundation_** (inspirado no
`shadcn/create`, https://ui.shadcn.com/create) permite definir tema/cor/fonte/stack de um projeto com
**preview real** e salvar essa decisão no próprio projeto.

O produto **não** substitui IDE, terminal, Figma, Claude Code ou Codex. Ele **organiza e conduz** o
trabalho entre essas ferramentas.

## 2. Problema

- Projetos espalhados em pastas locais **e** em repositórios do GitHub, sem visão única.
- Retomar um projeto exige lembrar onde parei e reconstruir contexto.
- Alto custo de "achar de novo" o projeto certo e a próxima coisa a fazer.
- Começar um projeto novo trava em decisões de fundação (stack, tema, fonte) tomadas de forma dispersa.

Para quem tem TDAH, cada um desses atritos multiplica a chance de perder o fio e procrastinar.

## 3. Visão

> Transformar minha lista bagunçada de projetos (locais + GitHub) num painel visual onde eu acho,
> entendo o estado e entro em qualquer projeto em segundos — com a próxima ação sempre na cara.

## 4. Usuário

Designer virando design engineer, que trabalha com múltiplos projetos, usa IA para design e código
(Claude Code, Codex), quer controle sobre os arquivos locais e **não** precisa de colaboração em equipe
na primeira versão.

## 5. Princípios de produto

1. **Local-first no desktop.** A variante desktop roda apenas em `127.0.0.1`. A variante cloud é um
   cockpit pessoal separado, protegido pelo login próprio do Studio.
2. **Nunca guardar tokens em dados do produto.** No desktop, GitHub usa o `gh` já autenticado. Na
   cloud, o único token aceito é um PAT fine-grained read-only em `GITHUB_TOKEN`, mantido somente como
   variável de ambiente da Vercel — nunca em cookie, KV, resposta, prompt ou log.
3. **Não mover os arquivos do usuário.** Associar uma pasta ≠ copiar/mover. Remover associação ≠ apagar.
4. **Próxima ação sempre visível.** Cada projeto mantém uma próxima ação concreta e editável.
5. **Uma decisão por vez.** Poucas escolhas, defaults recomendados, linguagem clara (foco anti-TDAH).
6. **Reaproveitar padrão, não forkar produto.** OpenWork / Open CoDesign / shadcn são referência.
7. **Clareza antes de automação.** Mostrar o que vai acontecer (abrir, clonar) e confirmar o destrutivo.
8. **Usar a ferramenta certa.** Trabalho visual livre, diagramas e exploração espacial vivem no Paper.
   O Studio organiza contexto, decisões e saúde do projeto; não replica canvas infinito nem Figma.
9. **IA operacional pelo Bedrock.** Memórias, ADRs, resumos, auditorias e sugestões produzidos dentro do
   Studio usam o Kimi via Amazon Bedrock no servidor. O produto não depende desta conversa para operar.

## 6. Ambiente verificado (nesta máquina)

- ✅ `gh` 2.96 autenticado como `DaniloAmaralUX` · `git` · `node 24` · `npm 11`
- ✅ Windows Terminal (`wt`) e `explorer` disponíveis
- ✅ **Claude Code Desktop** instalado e registra o protocolo **`claude://`** (`Claude.exe "%1"`)
- ⚠️ **`claude`/`codex` CLI ausentes do PATH** (app é MSIX/sandbox) → **sem agente embutido no MVP**
- ⚠️ `code`/`cursor` ausentes do PATH → só oferecer esses abridores se detectados

## 7. Modelo de dados

```ts
type ProjectSource =
  | { kind: 'local';  path: string }
  | { kind: 'github'; nameWithOwner: string; cloneDir?: string } // cloneDir só ao abrir p/ trabalhar

type ProjectStatus = 'planning' | 'building' | 'review' | 'blocked' | 'done'

type Project = {
  id: string
  name: string
  source: ProjectSource
  status: ProjectStatus
  nextAction?: string          // sempre visível no card
  tags: string[]               // organização / achar rápido
  stack: string[]              // detectada (ex.: ['next', 'ts', 'tailwind'])
  lastActivityAt?: string      // ISO. local: git/mtime · github: pushedAt
  foundationId?: string
  createdAt: string
  updatedAt: string
}

type Foundation = {
  id: string
  projectId: string
  framework: string            // ex.: 'next' | 'vite'
  language: string             // 'ts'
  packageManager: string       // 'npm'
  componentLibrary: string     // 'shadcn'
  baseColor: string            // 'zinc' | 'slate' | ...
  theme: string                // nome do preset
  font: string                 // fonte base
  fontHeading?: string
  radius: string               // ex.: '0.5rem'
  density: 'compact' | 'comfortable' | 'spacious'
  iconLibrary: string          // 'lucide'
}
```

Persistência: índice global `projects.json`; dentro de cada projeto **local**, `.workspace/project.json`
(+ `foundation.json` e `DESIGN.md` quando o configurador for usado). Gravação atômica.

## 8. Requisitos funcionais

- **RF-01 — Listar projetos:** hub mostra todos os projetos (locais + GitHub) como cards.
- **RF-02 — Adicionar projeto local:** escolher pasta, validar, impedir duplicata, detectar stack, criar
  associação **sem** copiar/mover arquivos.
- **RF-03 — Adicionar projeto do GitHub:** listar meus repos via `gh repo list`, escolher um; puxar
  metadados (descrição, linguagem, `pushedAt`, nº de issues/PRs, URL) via `gh` — **sem clonar**.
- **RF-04 — Próxima ação:** editar inline no card, persistir, mostrar sempre e registrar `updatedAt`.
- **RF-05 — Achar rápido:** busca por texto + filtro por tag/stack/fonte + ordenar por última atividade.
- **RF-06 — Tags/status:** editar tags e status por projeto.
- **RF-07 — Abrir projeto:** abrir na ferramenta escolhida (Explorer / Windows Terminal / Claude Code
  Desktop; VS Code/Cursor se detectados). Se for GitHub **sem** clone, clonar sob demanda (`gh repo
  clone`) para um diretório de trabalho e então abrir.
- **RF-08 — Remover associação:** tirar do hub sem apagar a pasta/repo.
- **RF-09 — Configurador de foundation:** escolher framework/tema/cor/fonte/radius/densidade/ícones com
  **preview real**; salvar `foundation.json`; gerar `DESIGN.md`; gerar comando `shadcn`; aplicar
  theme-only / fonts-only; mostrar o comando antes de aplicar.
- **RF-10 — Context Project cloud:** selecionar um projeto GitHub, consultar metadados, README e até
  12 commits no momento da pergunta, responder com fontes e permitir salvar explicitamente a próxima
  ação sugerida.

## 9. Requisitos não funcionais

- **Segurança:** desktop somente em `127.0.0.1`; cloud protegida pelo login próprio do Studio; nunca
  guardar tokens; APIs privadas sem cache; confirmar clonar/abrir; nada destrutivo sem confirmação.
- **Desempenho:** hub abre em ≤ 2s com até ~50 projetos; leitura de pasta sem varredura profunda; cache
  de metadados do GitHub.
- **Confiabilidade:** estado sobrevive a reiniciar; escrita atômica de `projects.json`/`.workspace`.
- **Acessibilidade cognitiva:** no máximo uma ação principal por tela; próxima ação sempre visível;
  defaults recomendados; poucas opções por vez; estados de erro com ação sugerida.

## 10. Fora do escopo (MVP)

Agente embutido/streaming, agentes em paralelo, colaboração/multiusuário, sync em nuvem, billing,
marketplace, canvas infinito, editor visual de telas, integração Figma, empacotamento desktop, importar
automaticamente **todos** os repos (o usuário escolhe quais entram), dezenas de templates.

> **Decisão de produto (2026-07-28):** o Paper é a ferramenta externa escolhida para canvas,
> fluxos e exploração visual. O Studio não terá rota, botão ou backlog de canvas próprio.

> **Emenda (atualizada em 2026-07-28, [`PLANO2.md`](./PLANO2.md)):** para a variante **Studio Cloud**,
> persistência em KV, IA e o Context Project fundamentado em GitHub foram autorizados como uma linha
> isolada. O restante desta lista permanece fora de escopo nas duas variantes.

## 11. Métrica principal

> Consigo achar/abrir um projeto e começar a trabalhar **sem** abrir PowerShell, procurar conversa
> antiga ou reconstruir contexto?

Metas: entender o estado de um projeto em < 10s; achar o projeto certo em < 5s; abrir em ≤ 2 cliques.

## 12. Roadmap

Entrega em fatias verticais (cada uma usável). Detalhe em [`ROADMAP.md`](./ROADMAP.md).
Arquitetura e contratos em [`BACKEND.md`](./BACKEND.md) e [`FRONTEND.md`](./FRONTEND.md).
Telas e fluxos em [`DESIGN.md`](./DESIGN.md).
