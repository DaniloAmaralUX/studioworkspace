# CLAUDE.md — Project Studio

Instruções persistentes para o Claude Code neste repositório. **Leia antes de codar.** Os detalhes
estão em [`PRD.md`](./PRD.md), [`DESIGN.md`](./DESIGN.md), [`BACKEND.md`](./BACKEND.md),
[`FRONTEND.md`](./FRONTEND.md) e [`ROADMAP.md`](./ROADMAP.md).

## O que é

Um **hub visual local** dos meus projetos (pastas locais **e** repositórios do GitHub) para achar,
organizar e entrar neles rápido, com uma **"próxima ação" sempre visível** e um **configurador de
foundation estilo `shadcn/create`**. Uso pessoal, single-user. Existe em **duas variantes** (ver
[`PLANO2.md`](./PLANO2.md)): a **desktop** (Windows, tudo local — launchers, scaffold, carimbo) e a
**Studio Cloud** (Vercel, cockpit GitHub + IA, protegida pelo login próprio do Studio).

## Regras de ouro (não violar)

1. **Local-only (variante desktop):** servir **apenas em `127.0.0.1`**. Nunca expor em `0.0.0.0` nem
   porta pública. *Emenda (2026-07-28, PLANO2.md):* a variante **Studio Cloud** roda na Vercel, sempre
   protegida pelo **login próprio do Studio** — nunca pública sem gate.
2. **Nunca guardar tokens.** Na desktop, GitHub é via **`gh` CLI já autenticado** (`execFile('gh', …)`).
   Não ler, copiar, logar ou persistir credenciais. *Emenda (PLANO2.md):* na cloud, a credencial é um
   **PAT fine-grained read-only** que vive **só como env var na Vercel** — nunca em código, log, chat
   ou KV. Na cloud, a IA usa **Amazon Bedrock Mantle/Kimi** em produção e pode usar **AI Gateway**
   no preview; todas as credenciais vivem somente em variáveis de ambiente da Vercel.
   *Emenda (2026-07-27, Bedrock):* na desktop, a IA pode usar **Amazon Bedrock** — a credencial
   (`AWS_BEARER_TOKEN_BEDROCK` ou par IAM) vive **só em `backend/.env`**, que o `.gitignore` cobre.
   Nunca em código, log, chat ou `settings.json`. `ANTHROPIC_API_KEY` segue proibida.
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

<!-- STUDIO:BEGIN (gerado pelo Project Studio — edite fora deste bloco) -->
# Regras de Design — workspace Design Engineer

Este projeto segue um design system pessoal. Ao **gerar, revisar ou ajustar** qualquer UI, aplique estas regras automaticamente.

## Base
- **100% shadcn/ui** sobre Radix + Tailwind. Nunca use `<button>`/`<input>`/`<select>` nativos quando há primitivo shadcn.
- **Dark mode default.** Tokens semânticos (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`). Nunca cor hex hardcoded.
- Estilo `new-york`. **Um único accent** via `--color-primary`. Radius base `0.625rem`.
- Cada valor editável mostra o token correspondente (ex.: `spacing.4` = `16px`).

## Tipografia (obsessiva com detalhe)
- **Mono** para código/valores/tokens/timestamps, com **ligatures** (JetBrains Mono / SF Mono).
- **Sans** humanista para UI (Inter/Geist), com `optical sizing` quando a fonte suportar.
- **Números técnicos** (hex, px, rem, versões, commits): `font-variant-numeric: tabular-nums` **obrigatório**.
- Type scale em grid de **4px**. Smart punctuation. `line-clamp` para truncar (nunca overflow escondido sem estratégia).
- `font-feature-settings` configurado quando a fonte suportar.

## Interação (Apple-style)
- **Easing físico (spring)**, nunca `ease-in-out` genérico. Animar **só `transform` e `opacity`**.
- Transições **interrompíveis**. Feedback visual distinto em hover · active · focus · disabled.
- Materiais translúcidos (`backdrop-blur` + borda `1px` de baixa opacidade) em painéis flutuantes.
- Respeitar `prefers-reduced-motion`. Momentum em scroll/swipe/drag.
- Inputs numéricos com scrubber (click+drag, estilo Figma).

## Estados & anti-patterns
- Loading/empty/error **sempre** com componente shadcn (Skeleton/Empty/Alert), nunca texto solto.
- Estados vazios úteis: atalhos de teclado, templates — nunca ilustração genérica.
- **AlertDialog** para destrutivo. **Nunca** `Dialog` para confirmar, **nunca** `confirm()`/`alert()`/`prompt()` do browser.
- Acessibilidade: foco visível, navegação por teclado, leitores de tela.

## Componentes
- O **shadcn MCP** está configurado neste repo — use-o para descobrir e instalar componentes do registry em vez de escrever primitivos na mão.
<!-- STUDIO:END -->
