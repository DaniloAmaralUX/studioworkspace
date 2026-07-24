# CLAUDE.md — Project Studio

Instruções persistentes para o Claude Code neste repositório. **Leia antes de codar.** Os detalhes
estão em [`PRD.md`](./PRD.md), [`DESIGN.md`](./DESIGN.md), [`BACKEND.md`](./BACKEND.md),
[`FRONTEND.md`](./FRONTEND.md) e [`ROADMAP.md`](./ROADMAP.md).

## O que é

Um **hub visual local** dos meus projetos (pastas locais **e** repositórios do GitHub) para achar,
organizar e entrar neles rápido, com uma **"próxima ação" sempre visível** e um **configurador de
foundation estilo `shadcn/create`**. Uso pessoal, single-user. Existe em **duas variantes** (ver
[`PLANO2.md`](./PLANO2.md)): a **desktop** (Windows, tudo local — launchers, scaffold, carimbo) e a
**Studio Cloud** (Vercel, cockpit GitHub + IA, atrás de Vercel Authentication).

## Regras de ouro (não violar)

1. **Local-only (variante desktop):** servir **apenas em `127.0.0.1`**. Nunca expor em `0.0.0.0` nem
   porta pública. *Emenda (2026-07-24, PLANO2.md):* a variante **Studio Cloud** roda na Vercel, sempre
   **atrás de Vercel Authentication** — nunca pública sem gate.
2. **Nunca guardar tokens.** Na desktop, GitHub é via **`gh` CLI já autenticado** (`execFile('gh', …)`).
   Não ler, copiar, logar ou persistir credenciais. *Emenda (PLANO2.md):* na cloud, a credencial é um
   **PAT fine-grained read-only** que vive **só como env var na Vercel** — nunca em código, log, chat
   ou KV. `ANTHROPIC_API_KEY` continua proibida (IA só via **AI Gateway**/OIDC).
3. **Não mover/copiar/apagar os arquivos do usuário.** Associar pasta ≠ copiar. Remover do hub ≠ apagar.
   Confirmar antes de **clonar** ou **abrir**; nada destrutivo sem confirmação.
4. **`npm`, não `pnpm`** (bug conhecido de shadcn/pnpm neste ambiente Windows).
5. **Sem agente embutido no MVP.** "Trabalhar" = **abrir o projeto** no Claude Code Desktop / Terminal /
   Explorer (o `claude`/`codex` CLI **não** está no PATH aqui). Ver `BACKEND.md` → Launcher / Spike `claude://`.
6. **Disciplina de escopo.** Entregar em **fatias verticais** (ver ROADMAP). Não construir o que está em
   "Fora do escopo" do PRD. Parar e validar cada fatia antes da próxima. (O usuário tem TDAH — evitar
   inchar o produto é requisito.)
7. **Nunca interpolar string em shell.** Sempre `execFile(cmd, [args])` com timeout.

## Stack

- Frontend: Vite + React + TypeScript + Tailwind + **shadcn/ui** (`http://127.0.0.1:5177`).
- Backend: Node + TypeScript + Fastify, REST, host `127.0.0.1` (`:5178`). Sem banco (JSON atômico).
- Um só toolchain (TS). Estrutura em `frontend/` e `backend/`.

## Por onde começar

**Fatia 0** (ver ROADMAP): subir backend + frontend por um comando; Home listando `projects.json`; card
com **próxima ação editável** persistida; botão "abrir no Explorer". Depois Fatia 1 (fontes local+GitHub),
Fatia 2 (busca/filtro), Fatia 3 (abridores + clone sob demanda), Fatia 4 (configurador de foundation).

## Como rodar

```bash
# backend
cd backend && npm install && npm run dev      # http://127.0.0.1:5178
# frontend (outro terminal)
cd frontend && npm install && npm run dev      # http://127.0.0.1:5177
# ou tudo de uma vez:
./start-workspace.ps1
```

## Convenções

- Tipos compartilhados espelham `PRD.md` §7 (`Project`, `Foundation`, `ProjectSource`). **Fonte única:
  `shared/types.ts` na raiz** — `frontend/src/lib/types.ts`, `backend/src/lib/types.ts` e
  `api/_lib/types.ts` são só re-exports type-only dele. Editar sempre no `shared/`; nunca duplicar.
- Nomes de endpoints e contratos: seguir `BACKEND.md` (o `FRONTEND.md` consome exatamente esses).
- Toda tela nova deve ser coerente com `DESIGN.md` (princípios, tokens, componentes shadcn).
- Commits pequenos por fatia. Não fazer push nem criar repositório sem eu pedir.

## Ambiente (checado)

`gh` ✅ (logado: `DaniloAmaralUX`) · `git` ✅ · `node 24` ✅ · `npm 11` ✅ · `wt` ✅ · `explorer` ✅ ·
Claude Code Desktop ✅ (protocolo `claude://`) · `claude`/`codex`/`code`/`cursor` ❌ no PATH.
