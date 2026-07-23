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

## Fatia 1 — Fontes (local + GitHub)
Adicionar projeto de pasta local (seletor + detecção de stack) **ou** do GitHub (`gh repo list` →
escolher; metadados via `gh`, sem clonar).

**Pronto quando:**
- [ ] `POST /api/projects/local` valida, impede duplicata, detecta stack, não move arquivos.
- [ ] `GET /api/github/repos` lista meus repos via `gh`.
- [ ] `POST /api/projects/github` adiciona com descrição/linguagem/`pushedAt`/issues.
- [ ] Dialog "Adicionar projeto" com abas Local / GitHub.
- [ ] Cards distinguem fonte (local vs GitHub) e mostram stack/última atividade.

## Fatia 2 — Achar rápido
Busca + filtro (tag/stack/fonte) + ordenar por última atividade; editar tags e status.

**Pronto quando:**
- [ ] Busca textual (`Ctrl+K` foca) filtra em tempo real.
- [ ] Filtros por tag/stack/fonte e ordenação funcionam.
- [ ] Editar tags/status por projeto (persiste).

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

## Depois do MVP (não fazer agora)
Agente embutido (`AgentAdapter`: `detect/run/resume/cancel` + streaming) quando/se o CLI ficar acessível;
detalhe de projeto; múltiplas contas GitHub; empacotamento desktop (Tauri/Electron); presets de foundation
compartilháveis.
