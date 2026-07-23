# Project Studio

Hub visual **local** dos meus projetos (pastas locais **e** repositórios do GitHub) para achar,
organizar e entrar neles rápido — com uma **"próxima ação" sempre visível** e um **configurador de
foundation estilo `shadcn/create`**. Uso pessoal, single-user, Windows, tudo em `127.0.0.1`.

## Documentos

| Arquivo | O que é |
|---|---|
| [`PRD.md`](./PRD.md) | Requisitos do produto, escopo, modelo de dados, métrica. |
| [`DESIGN.md`](./DESIGN.md) | Telas, fluxos e design-system (estilo `shadcn/create`). |
| [`BACKEND.md`](./BACKEND.md) | Arquitetura e endpoints do Workspace Service (Fastify). |
| [`FRONTEND.md`](./FRONTEND.md) | App React/Vite + shadcn e como consome a API. |
| [`ROADMAP.md`](./ROADMAP.md) | Fatias verticais (começar pela Fatia 0). |
| [`CLAUDE.md`](./CLAUDE.md) | Regras de ouro para o Claude Code neste repo. |
| [`AGENTS.md`](./AGENTS.md) | Mesmas regras, para Codex/outros agentes. |

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind + shadcn/ui (`http://127.0.0.1:5177`)
- **Backend:** Node + TypeScript + Fastify, REST (`http://127.0.0.1:5178`), JSON local
- **Integrações via CLI já autenticado:** `gh` (GitHub). **Sem guardar tokens.**

## Começar

Pré-requisitos: Node 20+, `gh` autenticado (`gh auth status`), Windows.

```bash
# opção 1 — um comando
./start-workspace.ps1

# opção 2 — manual (dois terminais)
cd backend  && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Abra `http://127.0.0.1:5177`. Comece pela **Fatia 0** do ROADMAP.

## Princípios inegociáveis

- Roda só em `127.0.0.1`. Nunca guarda tokens (usa `gh`). Não move/apaga arquivos do usuário.
- "Trabalhar" = abrir o projeto no Claude Code Desktop / Terminal / Explorer (sem agente embutido no MVP).
- Entregar em fatias; não inchar o escopo.

## Licença de terceiros

Padrões consultados de projetos open source são registrados em [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
