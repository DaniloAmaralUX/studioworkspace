# HANDOFF — Automode 2026-07-24 (otimização do core)

> Execução autônoma F0→F6 na branch `canvas`. Zero push. Dados reais intocados (hash conferido).
> Detalhe completo por fatia: [`docs/plans/automode-2026-07-24.md`](docs/plans/automode-2026-07-24.md).

## ⚠️ Não entregue / decisões suas (LEIA PRIMEIRO)

1. **DECISÃO — `manualChunks` grosso no vite.config.** O plano proibia manualChunks *fino*; para o gate
   de 500 kB passar usei **1 entrada grossa** `react-vendor: ['react','react-dom','react-dom/client']`
   (index 663→321 kB + vendor 193 kB, warning do Vite eliminado). O verificador adversarial provou que
   **sem o split o gate falharia por ~2 KiB**. Opções: **(a)** aceitar (canônico, recomendado) —
   registrar a exceção no plano-fonte; **(b)** reverter (3 linhas) e cortar ~2 KiB extras via lazy.
2. **Não entregue (backlog, fluxo novo):** projeto GitHub com `cloneDir` sumido deveria oferecer
   "Clonar de novo" (hoje mostra bloqueado como local). `docs/plans/backlog.md`.
3. **Nenhuma fatia BLOQUEADA.** Zero stashes. Nenhum circuit breaker disparou.

## O que foi entregue (fatia → commit)

| Fatia | Commit | Resumo |
|---|---|---|
| F0 harness | `841c5c7` | verify.ps1 (portão fail-fast), frozen-paths, permissions.deny, push desabilitado, plano vivo |
| F1 decidir | `c063fcf` | sonner + AlertDialog; status editável (dropdown→PATCH); "Remover do hub"; fim de confirm()/alert() |
| F2 resiliência | `7bc50fa` | JSON corrompido→`.bak` sem re-seed (+BOM, +shape, +race); pasta sumida→blocked+aviso; timeouts launcher |
| F3 testes | `5dce05d` | vitest no frontend (11), filterProjects puro, openClone mockado no backend; 40 testes |
| F4 bundle | `de46f5f` | telas secundárias lazy; gate 500 kB no verify; vendor split efetivo |
| F5 a11y | `fa9e7f2` | atalho "/", aria-live, contraste AA, alvos 42px, eslint jsx-a11y escopado no verify |
| F6 handoff | (este commit) | HANDOFF, smoke E2E, canário desktop, checks de integridade |

## Como rodar

```powershell
./start-workspace.ps1        # sobe backend (5178) + frontend (5177)
./verify.ps1                 # portão completo (typechecks + lint + 41 testes + build)
./verify.ps1 -Quick          # ciclo rápido (só typechecks + lint)
./verify.ps1 -BundleBudget 500   # completo + orçamento de bundle
```

## Medidas antes → depois

| Métrica | Antes (69449ca) | Depois (HEAD) |
|---|---|---|
| Chunk inicial JS | 620 kB (1 chunk, warning Vite) | **321 kB + 193 kB vendor** (sem warning) |
| Testes | 18 (só backend) | **41** (29 backend + 12 frontend) |
| Lint | nenhum | jsx-a11y escopado no core, no portão |
| confirm()/alert() nativos | 3 | **0** |
| JSON corrompido | hub caía (500) | 200 + `.bak` preservado, sem re-seed |
| Pasta sumida | invisível | blocked + aviso com path e ação |
| Status do projeto | decorativo | editável (dropdown, persiste) |
| Remover do hub | inexistente | AlertDialog + DELETE ("nada é apagado") |
| Home DCL (dev) | — | 694 ms (medido) |

## Checks de integridade (colados do terminal)

- **Dados reais intocados:** `projects.json` sha256
  `da15ad686fa01f36130627e768dc1fbae1e5252e314673d8e8dc268276b213a5` — **idêntico** antes/depois.
  (Toda verificação viva usou `PS_DATA_DIR` isolado no scratchpad.)
- **Push continua desabilitado:** `origin  DISABLED_no_push (push)`. Para reativar quando VOCÊ quiser:
  ```
  git remote set-url --push origin https://github.com/DaniloAmaralUX/studioworkspace.git
  ```
- **Branch:** `canvas`, 11 commits à frente de `origin/main` (5 pré-automode + 6 do automode). Zero push.
- **Canário desktop:** `node desktop/build-backend.mjs` → **PASSOU** (`desktop/dist/backend.cjs` 3.0 MB).
- **Deps novas:** backend **nenhuma** (zero impacto no bundle desktop). Frontend: `sonner` (runtime) +
  devDeps de teste/lint (vitest, jsdom, @testing-library/react, eslint, jsx-a11y, @typescript-eslint/parser).
- **Smoke E2E no HEAD final (dados isolados):** achar ("/"+busca 5→1) → decidir (status Em revisão→
  Construindo, persistiu no backend) → abrir (launchers detectados renderizados; abertura real coberta
  por teste mockado — regra: smoke nunca abre apps).

## Dívidas (P2/P3) — priorizadas

1. Error boundary nos chunks lazy (chunk 404 pós-rebuild = fallback eterno) — F4/P3.
2. "Clonar de novo" p/ GitHub com clone sumido — F5/P3 (fluxo novo, backlog).
3. STATUS_LABEL duplicado (ProjectDetail × StatusBadge) + literais de status em 3 lugares →
   proposta: `PROJECT_STATUSES as const` em shared/types.ts.
4. vitest.config duplica alias do vite.config (drift) → mergeConfig quando houver próximo plugin.
5. tmp do writeJsonAtomic usa só pid (colisão teórica de persists concorrentes).
6. Debounce do NextActionInput: teste de teclas espaçadas cobre; caso "blur+retype na janela de 1.2s"
   coberto pelo savedTimer novo.

## Propostas de regra para CLAUDE.md (decisão sua)

- "manualChunks grosso (1 entrada de vendor) é permitido; fino segue proibido" — se aceitar a decisão ⚠️1.
- "Parser de arquivo editável pelo usuário tolera BOM UTF-8" (lição da F2, `docs/solutions/utf8-bom-json-corruption.md`).
- "package.json declarado numa fatia implica package-lock.json" (convenção de scope-check).

## Docs vs entregue

- `ROADMAP.md`: sincronizado na F0 (Fatia 1 ✅, Fatia 2 parcial). O item "Code-split do bundle" da
  tabela de modernizações foi **entregue** na F4 — pode riscar.
- `BACKEND.md`: falta documentar `pathMissing` (campo computado no GET /api/projects) e o
  comportamento `.bak` do índice. 15 min de edição quando quiser.
- `FRONTEND.md`: falta mencionar sonner/AlertDialog como padrão de confirmação/feedback.

## Protocolo de validação — 2 semanas de uso diário

Checklist diário (anotar em `docs/plans/backlog.md § Novas ideias`, ou me chamar):

- [ ] Vi o estado de tudo em **<10s**?
- [ ] Achei o projeto que eu queria em **<5s**?
- [ ] Abri onde eu queria em **≤2 cliques**?
- Toda fricção → anotar. **Nada vira código antes das 2 semanas.** Depois disso, o que engajou
  decide as próximas fatias (Foundation/Fatia 4 está congelada esperando essa validação).
