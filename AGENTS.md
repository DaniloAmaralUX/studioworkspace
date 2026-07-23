# AGENTS.md — Project Studio

Instruções para agentes de código (Codex e outros). Espelha [`CLAUDE.md`](./CLAUDE.md) — leia-o e o
[`PRD.md`](./PRD.md)/[`ROADMAP.md`](./ROADMAP.md) antes de mudar código.

## Contexto
Hub visual local dos projetos do usuário (pastas locais + repos GitHub), com "próxima ação" sempre
visível e configurador de foundation estilo `shadcn/create`. Single-user, Windows, tudo em `127.0.0.1`.

## Regras de ouro
1. Servir **só em `127.0.0.1`**. Nunca expor porta pública.
2. **Nunca guardar tokens.** GitHub via `gh` CLI já autenticado (`execFile('gh', […])`). Se
   `ANTHROPIC_API_KEY` existir, só avisar — não usar.
3. **Não mover/copiar/apagar** arquivos do usuário. Confirmar clonar/abrir; nada destrutivo sem confirmar.
4. Usar **`npm`** (não `pnpm`).
5. **Sem agente embutido no MVP:** "trabalhar" = abrir no Claude Code Desktop / Terminal / Explorer.
6. Entregar em **fatias verticais** (ROADMAP); não construir itens de "Fora do escopo" (PRD).
7. **Nunca** interpolar string em shell; sempre `execFile(cmd, [args])` com timeout.

## Stack
Frontend Vite+React+TS+Tailwind+shadcn (`:5177`); backend Node+TS+Fastify REST (`:5178`), JSON atômico.
Tipos compartilhados espelham `PRD.md` §7. Endpoints seguem `BACKEND.md`.

## Começar
Fatia 0 do `ROADMAP.md`: hub lista `projects.json`; card com próxima ação editável persistida; abrir no Explorer.
