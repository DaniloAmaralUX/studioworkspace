# PLANO 2 — Studio Cloud (executável)

> Derivado do PLANO 1 (2026-07-23). Decisões travadas em 2026-07-24 por delegação do usuário
> ("execute as ações necessárias"), usando as recomendações do PLANO 1 como default.
> Cada decisão pode ser revertida antes da fatia que a consome.

## Decisões travadas

| # | Decisão | Escolha | Por quê |
|---|---------|---------|---------|
| 1 | Direção | **Híbrido** | O app local continua dono de launchers, scaffold e carimbo (impossíveis em serverless). O Studio Cloud vira o cockpit GitHub + IA sempre disponível. Nada do desktop é removido. |
| 2 | Credencial GitHub | **PAT fine-grained read-only (MVP)** → OAuth App depois | Menor atrito para single-user; revogável; escopo mínimo. Seguro porque o app fica atrás de Vercel Authentication. |
| 3 | Primeira feature de IA | **Próxima ação sugerida por repo** | Torna o conceito central do produto (próxima ação sempre visível) inteligente. POC já existe (`core/ai.ts`). |
| 4 | Privacidade | **Vercel Authentication (SSO do time)** | Grátis, resolve single-user sem código. Password Protection exigiria plano pago. |
| + | Host do Meu Registry | **Mesmo projeto Vercel** (`/r/*.json`) | Resolve a decisão pendente de [[themes-tweakcn-library]] sem novo host. |

## Emenda de charter (aplicar na Fatia 0)

O deploy contradiz 3 regras de ouro do `CLAUDE.md`/`PRD.md`. A emenda é **escopo por variante**, não revogação:

- **Regra 1 (local-only):** vale para a variante desktop. A variante cloud serve na Vercel **atrás de Vercel Authentication** — nunca pública sem gate.
- **Regra 2 (nunca guardar tokens):** vale para o desktop (`gh` CLI). Na cloud, credencial = env var na Vercel (PAT read-only) — nunca em código, log ou KV… exceto `ps:gh:token` **não**: PAT fica só em env var, fora do KV.
- **PRD §10 (IA fora de escopo):** IA via **AI Gateway** entra como diferencial da variante cloud. `ANTHROPIC_API_KEY` continua proibida.

## Preflight (verificado em 2026-07-24)

- ✅ Conta Vercel acessível via MCP: time **Danilo's projects** (`team_52WCkqpHdjlc0elwXFcNdKED`); nome de projeto `studio-cloud` livre.
- ✅ Repo `DaniloAmaralUX/studioworkspace` público, branch `main`, working tree limpa.
- ✅ Frontend já parametrizado: `frontend/src/lib/api.ts` usa `VITE_API_BASE` (prod = `/api`).
- ✅ `backend/src/core/ai.ts` já usa AI Gateway e aceita `VERCEL_OIDC_TOKEN` (zero chave na Vercel).
- ✅ Build de produção do frontend passa (verificado na entrega do hub Linear).
- ⏳ **Ação do usuário (bloqueia Fatia 2):** criar PAT fine-grained em github.com/settings/personal-access-tokens — repos: todos (ou selecionados), permissões read-only: *Metadata, Contents, Issues, Pull requests* — e cadastrar como `GITHUB_TOKEN` no projeto Vercel. **Nunca colar o token no chat/código.**

## Arquitetura-alvo

- **1 projeto Vercel** (`studio-cloud`), deploy via Git do repo `studioworkspace`, **Root Directory = `frontend/`**, preset Vite, output `dist`.
- Funções em `frontend/api/` (1 arquivo = 1 função). Mesma origem ⇒ zero CORS.
- `frontend/api/_lib/` = types/zod/lógica pura portada do backend (fonte: `backend/src/lib/types.ts`, `core/foundation.ts`). Fastify **não** migra.
- **Persistência: Upstash Redis** (Marketplace). Hashes: `ps:projects` (id→Project), `ps:templates`, `ps:foundation:<id>`.
- `vercel.json`: rewrite `/((?!api/).*)` → `/index.html`; `functions.maxDuration: 60`.
- Env: `VITE_API_BASE=/api` · `GITHUB_TOKEN` (PAT) · `KV_REST_API_*` (auto) · `PS_AI_MODEL` (opcional) · AI Gateway via OIDC (nada a configurar).

### Fica no desktop (não portar)
`routes/open.ts` (launchers), `core/scaffold.ts`, `core/stamp.ts`, `dirtyCount`/working-tree local.
Na cloud, "trabalhar" = links: `github.com` · `github.dev` · `vscode.dev` · **`codespaces.new/{owner}/{repo}`**.

## Fatias (MVP ≈ 3,5 dias)

### Fatia 0 — Shell no ar (~0,5d)
1. Emenda de charter em `CLAUDE.md` + `PRD.md` (texto acima).
2. `frontend/vercel.json` (rewrite SPA + maxDuration).
3. `frontend/api/health.ts` — primeira função (`{ ok: true, variant: 'cloud' }`).
4. Criar projeto Vercel `studio-cloud` conectado ao repo (root `frontend/`).
5. Ativar **Vercel Authentication** (Deployment Protection) antes do primeiro deploy público.
6. `VITE_API_BASE=/api` (Production/Preview).
- **Aceite:** URL de produção pede login Vercel; SPA renderiza (Temas funciona, é client-side); `/api/health` responde.

### Fatia 1 — KV + CRUD (~1d)
1. Instalar Upstash Redis via Marketplace no projeto.
2. `_lib/store.ts` (HSET/HGETALL por entidade) substituindo `atomicJson.ts`.
3. Funções: `GET/POST /api/projects`, `PATCH/DELETE /api/projects/[id]` (validação zod portada).
4. Import one-time: script local que lê `%APPDATA%\project-studio\projects.json`, filtra `source.kind === 'github'` e faz POST em lote.
- **Aceite:** hub cloud lista projetos GitHub; próxima ação editável persiste entre reloads/regiões.

### Fatia 2 — GitHub read via PAT (~1d) — *depende do PAT (preflight)*
1. Octokit em `_lib/github.ts`: lista de repos (GraphQL `viewer.repositories`, mesmo shape do `normalize()` atual), `repos.get` para detalhe.
2. "Repo insights": branch default, último commit, issues/PRs abertos, ahead/behind (`compare`). `dirtyCount` não existe na cloud (aceito, é do desktop).
3. `GET /api/github/repos` + import para o hub.
- **Aceite:** importar repo do GitHub pelo hub cloud e ver insights.

### Fatia 3 — IA próxima ação (~1d)
1. Portar `core/ai.ts` → `_lib/ai.ts`: contexto via Octokit (commits + README pela API) no lugar de `execFile git/gh`.
2. `POST /api/projects/[id]/ai-next-action` (mesmo contrato do desktop).
- **Aceite:** "Sugerir com IA" funciona na URL de produção sem nenhuma chave manual (OIDC).

### Pós-MVP (ordem sugerida)
- **Fatia 4** Foundation na cloud (KV + copy/download `DESIGN.md`) + IA foundation (`generateObject` com `foundationSchema`).
- **Fatia R** Meu Registry: `shadcn build` no CI → servir `registry.json`/itens em `/r/` (desbloqueia `shadcn apply @studio/<tema>` de qualquer lugar).
- **Fatia 5** deep links Codespaces/github.dev/vscode.dev no `OpenWithButtons` (variante cloud).
- **Fatia 6** OAuth App no lugar do PAT · "abrir PR" da foundation · busca NL (só se filtro client-side não bastar).

## Riscos/limites aceitos
- Working tree local invisível na cloud (híbrido cobre).
- `claude://` não existe na cloud (precisa de path local absoluto) — Codespaces é o substituto.
- Repo público + SPA protegida: o **código** já é público; o que o gate protege são seus **dados** (projetos, próximas ações) e o uso de IA/PAT.
