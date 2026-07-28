# ROADMAP.md — Project Studio

Entrega em **fatias verticais**: cada fatia é usável de ponta a ponta e deve ser validada antes da
próxima. Regra anti-escopo: se uma fatia anterior já resolve o essencial, o resto pode esperar.

---

## Fatia 0 — Hub esqueleto ✅ (concluída e verificada)
Subir backend + frontend; Home lista projetos do `projects.json`; card mostra nome + **próxima ação
editável** (persiste) + botão "abrir no Explorer".

**Pronto quando:**
- [x] `npm run dev` sobe backend (`127.0.0.1:5178`) e frontend (`127.0.0.1:5177`).
- [x] `GET /api/projects` e `PATCH /api/projects/:id` funcionando.
- [x] Hub renderiza cards a partir de um `projects.json` semeado (via `seed.ts`).
- [x] Editar próxima ação num card → recarregar → persiste (testado ponta a ponta).
- [x] Botão "abrir no Explorer" abre a pasta (projeto local). Também detecta Terminal e `claude://`.

> Extra já incluído: busca com `Ctrl+K` (filtro client-side), badges de status/fonte/stack, auto-save
> com debounce e indicador "salvo", estados de loading/erro/vazio.

## Fatia 1 — Fontes (local + GitHub) ✅ (concluída)
Adicionar projeto de pasta local (seletor + detecção de stack) **ou** do GitHub (`gh repo list` →
escolher; metadados via `gh`, sem clonar).

**Pronto quando:**
- [x] `POST /api/projects/local` valida, impede duplicata, detecta stack, não move arquivos.
- [x] `GET /api/github/repos` lista meus repos via `gh`.
- [x] `POST /api/projects/github` adiciona com descrição/linguagem/`pushedAt`/issues.
- [x] Dialog "Adicionar projeto" com abas Local / GitHub (`AddProjectDialog.tsx`).
- [x] Cards distinguem fonte (local vs GitHub) e mostram stack/última atividade.

## Fatia 2 — Achar rápido (~ parcial: busca ✅; filtros/tags → backlog)
Busca + filtro (tag/stack/fonte) + ordenar por última atividade; editar tags e status.

**Pronto quando:**
- [x] Busca textual (`Ctrl+K` foca) filtra em tempo real.
- [ ] Filtros por tag/stack/fonte e ordenação → `docs/plans/backlog.md` (busca cobre "achar <5s" em escala pessoal).
- [~] Editar status por projeto → alvo da fatia automode **F1**; editar tags → backlog.

## Fatia 3 — Abrir / trabalhar ✅ (concluída, ver R6)
Abridores conforme disponibilidade; GitHub sem clone → `gh repo clone` sob demanda antes de abrir.

**Pronto quando:**
- [x] `GET /api/launchers` reporta abridores disponíveis; a UI só mostra os presentes.
- [x] Abrir no Explorer e no Windows Terminal (`wt -d`) na pasta certa.
- [x] **Spike `claude://`** resolvido: `claude://code/new?folder=<pasta>` via exe lido do registro
      (`HKCU\Software\Classes\claude\shell\open\command`); testado abrindo o Claude Desktop de verdade.
- [x] Projeto GitHub sem clone dispara `gh repo clone` (com confirmação) e depois abre; reabrir não reclona.
- [ ] `code`/`cursor` aparecem só se detectados — backend já detecta (`detectLaunchers`), mas o
      `OpenWithButtons` do frontend ainda só lista explorer/terminal/claude. Gap pequeno, não atacado nesta
      rodada (fora do pedido "claude:// + clone").

## Fatia 4 — Configurador de Foundation (diferencial)
Painel estilo `shadcn/create` com preview real; salva `foundation.json`, gera `DESIGN.md` e o comando `shadcn`.

**Pronto quando:**
- [ ] Decisões (framework/base color/tema/fonte/radius/densidade/ícones) atualizam o **preview ao vivo**.
- [ ] Salvar grava `.workspace/foundation.json`.
- [ ] Gera `DESIGN.md` no projeto-alvo e o comando `shadcn` (copiável); mostra o comando antes de aplicar.
- [ ] Opções aplicar tudo / só tema / só fontes.

---

## Linha cloud — Context Project

Linha isolada da variante desktop, autorizada em 2026-07-28. O objetivo da primeira entrega é
responder “qual é o estado deste projeto e o que faço agora?” usando evidências atuais do GitHub.

### R0 — Base segura e reproduzível

- [x] Login próprio do Studio é o único gate da aplicação.
- [x] GitHub usa somente `GITHUB_TOKEN` read-only no servidor; OAuth e cookies de token foram removidos.
- [x] APIs privadas usam `Cache-Control: no-store` e erros internos não vazam detalhes.
- [x] Sidebar mostra a conexão GitHub como estado passivo, sem entrar/sair.
- [ ] Gates integrados da branch cloud aprovados.

### R1 — Projeto selecionado + contexto fundamentado

- [~] Selecionar conversa geral ou um projeto GitHub no cabeçalho do chat.
- [~] Consultar metadados, README e até 12 commits a cada mensagem, sem persistir o conteúdo.
- [~] Mostrar atualização, estado completo/parcial, avisos e links das fontes.
- [~] Gerar resposta e próxima ação na mesma chamada; salvar somente por confirmação.

R2 (issues, PRs e checks), memória e automações ficam congelados até R1 ser validado no uso diário.

---

## Depois do MVP (não fazer agora)
Agente embutido (`AgentAdapter`: `detect/run/resume/cancel` + streaming) quando/se o CLI ficar acessível;
detalhe de projeto; múltiplas contas GitHub; empacotamento desktop (Tauri/Electron); presets de foundation
compartilháveis.

---

## Modo Maestri — canvas de orquestração (branch `canvas`, desktop-only)

Paridade funcional com o Maestri (themaestri.app), reimplementado em web/Windows. Canvas React Flow +
terminais PTY reais (Claude Code CLI) + notas markdown vivas + conexões agente↔agente + Ombro (IA) +
rotinas + floors (git worktrees). Vive só na branch `canvas`, gated `!IS_CLOUD` (PTY não roda em serverless).

- [x] **M0** — Branch + rota `/projects/:id/canvas` (React Flow vazio) + spikes de PTY (`@lydell/node-pty`) e WebSocket (`@fastify/websocket`).
- [ ] **M1** — Layout persistido por projeto (`.workspace/canvas/`) + notas markdown vivas (`fs.watch`).
- [ ] **M2** — Terminais PTY reais (xterm.js + node-pty via WS, ring buffer + reattach).
- [ ] **M3** — Claude Code CLI global + papéis de agente.
- [ ] **M4** — Conexões terminal↔terminal (encaminhar output→stdin) e terminal↔nota.
- [ ] **M5** — Grupos, Tidy, minimapa, atalhos, File Tree.
- [ ] **M6** — Ombro (resumo + próxima ação via AI Gateway).
- [ ] **M7** — Rotinas (prompts agendados).
- [ ] **M8** — Floors (um canvas por git worktree).
- [ ] **M9** — Desenho à mão livre + polish.

### App desktop (Electron) — empacotar como aplicativo instalável
- [x] **A0** — Shell Electron: `desktop/` sobe o Fastify (servindo o frontend na mesma origem via `@fastify/static`) e abre a janela. Backend empacotado com esbuild.
- [~] **A1** — Instalável no Windows: app roda instalado em `%LOCALAPPDATA%\Programs\Studio` + atalho no Menu Iniciar (aparece na busca). Instalador NSIS (`electron-builder`) pendente — bloqueado por lock de AV/sandbox na extração do 7zip.

---

## Modernizações adiadas (auditoria de fundação, 2026-07-24)

Auditoria com Context7 confirmou a fundação em versão de ponta (defasagens reais corrigidas:
tailwind-merge v3, lucide 1.x, @types/node 24, Inter removida). O que ficou de fora, de propósito —
fazer só quando o gatilho chegar:

| Item | Benefício | Custo | Gatilho |
|---|---|---|---|
| Vite 6→8 + `@vitejs/plugin-react` 6 | build mais rápido; linha 6 perde suporte quando Vite 9 sair | ~1 h (2 migration guides) | próxima fatia grande de frontend, ou lançamento do Vite 9 |
| Import `react-router` (em vez de `react-router-dom`) | pacote canônico da v7; o shim morre na v8 | ~15 min (trocar imports) | junto com qualquer mexida nas rotas |
| zod 3→4 (backend + api) | API nova de erros, perf | 2–4 h (todos os schemas) | peer do `ai` hoje aceita `^3.25.76 \|\| ^4.1.8`; migrar se exigir v4 ou num schema novo grande |
| `@fastify/cors` 10→11 | acompanhar a linha ativa (v10 e v11 suportam Fastify 5) | 15 min | junto com o próximo bump do backend |
| `fastify-type-provider-zod` + `setErrorHandler` global | validação tipada ponta a ponta; erros centralizados | 1–2 h | próxima rota nova no backend |
| APIs React 19 (`useOptimistic`, Actions) | forms mais simples (hoje: TanStack `onMutate`) | oportunista | ao tocar nos forms existentes |
| Handlers Web-standard nas Functions (`Request`/`Response`) | formato moderno da Vercel (o clássico segue suportado) | ~1 h | se alguma função nova precisar de streaming |
| `engines: { node: "24.x" }` nos package.json | trava o runtime formalmente | 10 min | se outra máquina entrar no fluxo |
| Code-split do bundle (chunk 604 kB > 500 kB no build) | aviso do Vite some; carga inicial menor | ~30 min (`manualChunks`) | quando o hub ganhar mais telas |
