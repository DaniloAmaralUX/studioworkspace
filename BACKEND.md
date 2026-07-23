# BACKEND.md — Project Studio (Workspace Service)

Backend local, single-user, servindo **apenas em `127.0.0.1`**. É basicamente uma **API REST** que
mantém o índice de projetos, lê metadados (locais via filesystem/git, GitHub via `gh`), e dispara
"abridores" e clones. **Sem streaming/agente embutido no MVP.**

## Stack

- **Runtime:** Node 24 + TypeScript.
- **Framework:** Fastify.
- **Execução de subprocessos:** `node:child_process` (`execFile`, nunca `exec` com string concatenada)
  para `gh`, `git`, `explorer`, `wt`, e o protocolo `claude://`.
- **Persistência:** arquivos JSON (sem banco no MVP). Escrita atômica (escrever em `.tmp` + `rename`).
- **Sem dependências pesadas.** Validação de entrada com `zod`.

> Alternativa aceitável: FastAPI (Python) — o usuário conhece. Se trocar, manter **os mesmos endpoints
> e contratos** abaixo. Recomendado ficar em TS para ter um só toolchain com o frontend.

## Como rodar

```bash
cd backend
npm install
npm run dev     # tsx watch src/server.ts  → http://127.0.0.1:5178
```

Porta padrão: **5178** (configurável por `PORT`). **Host fixo `127.0.0.1`** (não expor em `0.0.0.0`).

## Estrutura de pastas

```
backend/
├── src/
│   ├── server.ts              # cria Fastify, host 127.0.0.1, registra rotas, CORS p/ o frontend local
│   ├── config.ts              # PORT, WORK_DIR (dir de clones), caminho do projects.json
│   ├── routes/
│   │   ├── health.ts
│   │   ├── projects.ts        # CRUD de projetos + próxima ação/tags/status
│   │   ├── github.ts          # listar repos, adicionar do GitHub
│   │   ├── open.ts            # abrir/clonar
│   │   └── foundation.ts      # get/put/apply foundation
│   ├── core/
│   │   ├── projectIndex.ts    # ler/gravar projects.json (atômico), CRUD
│   │   ├── localSource.ts     # validar pasta, detectar stack, ler/gravar .workspace
│   │   ├── githubSource.ts    # wrappers do gh (list, view, clone)
│   │   ├── launcher.ts        # detectar e acionar abridores
│   │   ├── stackDetect.ts     # detecção de stack por arquivos-chave
│   │   └── foundation.ts      # gerar comando shadcn + DESIGN.md
│   ├── lib/
│   │   ├── exec.ts            # execFile com timeout + tratamento de erro
│   │   ├── atomicJson.ts      # readJson / writeJsonAtomic
│   │   └── types.ts           # Project, Foundation, etc. (espelha PRD.md §7)
│   └── ...
├── package.json
└── tsconfig.json
```

## Persistência

- **Índice global:** `%APPDATA%\project-studio\projects.json` (ou `WORK_DIR/projects.json`). Array de
  `Project`. É a fonte de verdade da lista.
- **Por projeto local:** `<path>/.workspace/project.json` guarda `nextAction`, `status`, `tags`, `stack`,
  `foundationId`, `lastActivityAt`. Ao ler o hub, o índice é a fonte primária; `.workspace` permite que o
  contexto "viaje junto" com a pasta.
- **Foundation:** `<path>/.workspace/foundation.json` + `<path>/DESIGN.md` gerados pelo configurador.
- **Dir de clones (`WORK_DIR`):** ex. `C:\Users\dar\Desktop\project-studio\work\` — destino de
  `gh repo clone` para projetos GitHub que forem abertos para trabalhar.

Toda escrita usa `writeJsonAtomic` (tmp + rename) para não corromper em caso de crash.

## Endpoints (REST, base `/api`)

Todas as respostas são JSON. Erros retornam `{ error: { code, message } }` com status adequado.

### Saúde e ambiente
- `GET /api/health` → `{ ok: true }`
- `GET /api/launchers` → quais abridores existem:
  ```json
  { "explorer": true, "terminal": true, "claude": true, "code": false, "cursor": false }
  ```
  Detecção: `explorer`/`wt` (verificar no PATH); `claude` (checar protocolo `claude://` no registro
  `HKCU\Software\Classes\claude`); `code`/`cursor` (verificar no PATH).

### Projetos
- `GET /api/projects` → `Project[]` (ordenável no frontend).
- `POST /api/projects/local` — body `{ path: string, name?: string }`
  - valida existência; impede duplicata (mesmo `path`); detecta stack; lê `.workspace` se houver;
    `lastActivityAt` = mtime/git. **Não move nem copia arquivos.** → `Project`.
- `POST /api/projects/github` — body `{ nameWithOwner: string }`
  - puxa metadados via `gh repo view` (sem clonar). → `Project`.
- `PATCH /api/projects/:id` — body parcial `{ nextAction?, status?, tags?, name? }` → `Project`.
  - grava no índice **e** no `.workspace/project.json` (se for local).
- `DELETE /api/projects/:id` → `{ ok: true }` — remove do índice; **não** apaga a pasta/repo nem o clone.

### GitHub
- `GET /api/github/status` → `{ authenticated: true, login: "DaniloAmaralUX" }` (via `gh auth status`).
- `GET /api/github/repos?query=&limit=100` → lista dos meus repos:
  ```
  gh repo list --json nameWithOwner,description,primaryLanguage,pushedAt,url,isPrivate,repositoryTopics --limit 100
  ```
  → `{ nameWithOwner, description, language, pushedAt, url, isPrivate, topics }[]`.

### Abrir / clonar
- `POST /api/projects/:id/open` — body `{ with: 'explorer'|'terminal'|'claude'|'code'|'cursor' }`
  1. Resolve o caminho local:
     - `local` → usa `source.path`.
     - `github` sem `cloneDir` → `gh repo clone <nameWithOwner> <WORK_DIR>/<repo>` (confirmação no
       frontend antes); salva `cloneDir` no projeto.
  2. Aciona o abridor:
     - `explorer` → `explorer "<path>"`
     - `terminal` → `wt -d "<path>"`
     - `claude`   → abrir `claude://...` (ver **Spike claude://** abaixo); fallback: iniciar `Claude.exe`.
     - `code`/`cursor` → `code "<path>"` / `cursor "<path>"` (só se disponíveis).
  - → `{ ok: true, opened: '<path>', with }`.

### Foundation
- `GET /api/projects/:id/foundation` → `Foundation | null`.
- `PUT /api/projects/:id/foundation` — body `Foundation` (parcial) → salva `foundation.json`. → `Foundation`.
- `POST /api/projects/:id/foundation/apply` — body `{ only?: 'theme'|'font' }`
  - gera o **comando `shadcn`** correspondente (retorna a string; **não** executa por padrão) e
    (re)gera `DESIGN.md` no projeto. → `{ command: string, designMdPath: string }`.

## Detecção de stack (`stackDetect.ts`)

Ler apenas o topo da pasta (sem varredura profunda) e mapear arquivos-chave → tags:

| Arquivo | Tag |
|---|---|
| `package.json` (campo deps) | `next`, `vite`, `react`, `vue`, ... |
| `pnpm-lock.yaml` / `package-lock.json` / `yarn.lock` / `bun.lock` | package manager |
| `next.config.*` | `next` |
| `vite.config.*` | `vite` |
| `tsconfig.json` | `ts` |
| `components.json` | `shadcn` |
| `tailwind.config.*` / `@import "tailwindcss"` | `tailwind` |
| `pyproject.toml` / `requirements.txt` | `python` |
| `.git` | `git` |

Para projetos **GitHub**: `stack` = `primaryLanguage` + `repositoryTopics` (via `gh`).

## Integração com `gh` (nunca guardar token)

- Pré-requisito: `gh auth status` OK. Se não estiver logado, o frontend mostra instrução para
  `gh auth login` (o app **não** faz login nem guarda token).
- Comandos usados: `gh auth status`, `gh repo list --json ...`, `gh repo view <nwo> --json ...`,
  `gh repo clone <nwo> <dir>`.
- Sempre via `execFile('gh', [args...])` — **nunca** interpolar string de shell.

## Abridores (`launcher.ts`) e o Spike `claude://`

- **Explorer:** `execFile('explorer', [path])`.
- **Windows Terminal:** `execFile('wt', ['-d', path])`.
- **Claude Code Desktop:** o handler registrado é `Claude.exe "%1"` para o protocolo `claude://`.
  **Spike (Fatia 3):** descobrir o deep-link que abre uma **pasta/projeto** no Claude Desktop
  (testar formatos; se não houver, fallback = abrir o app e o usuário escolhe a pasta). Documentar o
  formato que funcionar aqui.
- **VS Code/Cursor:** `execFile('code'|'cursor', [path])` só se `GET /api/launchers` indicar disponível.

## Segurança (inegociável)

- Bind **apenas** `127.0.0.1`; CORS liberado só para a origem do frontend local (ex. `http://127.0.0.1:5177`).
- Validar/normalizar todo `path` recebido; rejeitar caminhos fora do esperado; nunca `exec` com string.
- Confirmação (no frontend) antes de **clonar** e antes de **abrir**; nada destrutivo sem confirmação.
- Nunca ler, copiar ou logar tokens. Se `ANTHROPIC_API_KEY` existir no ambiente, apenas **avisar** na UI
  (não usar).

## Erros e resiliência

- Timeout em todo subprocesso (ex. 15s; clone maior). Traduzir stderr do `gh`/`git` em mensagem amigável.
- `projects.json` corrompido → backup `.bak` + índice vazio recuperável.
- Projeto cujo `path` sumiu → marcar `status: 'blocked'` e sinalizar no card (não quebrar o hub).
