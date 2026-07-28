# PLANO 2 — Studio Cloud (executável)

> Derivado do PLANO 1 (2026-07-23). Decisões travadas em 2026-07-24 por delegação do usuário
> ("execute as ações necessárias"), usando as recomendações do PLANO 1 como default.
> Cada decisão pode ser revertida antes da fatia que a consome.

## Decisões travadas

| # | Decisão | Escolha | Por quê |
|---|---------|---------|---------|
| 1 | Direção | **Híbrido** | O app local continua dono de launchers, scaffold e carimbo (impossíveis em serverless). O Studio Cloud vira o cockpit GitHub + IA sempre disponível. Nada do desktop é removido. |
| 2 | Credencial GitHub | **PAT fine-grained read-only, somente no servidor** | Menor atrito para single-user; revogável; escopo mínimo. OAuth e token em cookie não fazem parte da arquitetura. |
| 3 | Primeira feature de IA | **Próxima ação sugerida por repo** | Torna o conceito central do produto (próxima ação sempre visível) inteligente. POC já existe (`core/ai.ts`). |
| 4 | Privacidade | **Login próprio do Studio** | Gate single-user canônico, com hash PBKDF2, sessão assinada e rate limit; independe da sessão da conta Vercel. |
| + | Host do Meu Registry | **Mesmo projeto Vercel** (`/r/*.json`) | Resolve a decisão pendente de [[themes-tweakcn-library]] sem novo host. |

## Emenda de charter (aplicar na Fatia 0)

O deploy contradiz 3 regras de ouro do `CLAUDE.md`/`PRD.md`. A emenda é **escopo por variante**, não revogação:

- **Regra 1 (local-only):** vale para a variante desktop. A variante cloud serve na Vercel atrás do
  **login próprio do Studio** — nunca pública sem gate.
- **Regra 2 (nunca guardar tokens):** vale para o desktop (`gh` CLI). Na cloud, a única credencial
  GitHub é `GITHUB_TOKEN` read-only no ambiente da Vercel — nunca em cookie, código, log, chat ou KV.
- **PRD §10 (IA fora de escopo):** IA via **AI Gateway** entra como diferencial da variante cloud. `ANTHROPIC_API_KEY` continua proibida.

## Preflight (verificado em 2026-07-24)

- ✅ Conta Vercel acessível via MCP: time **Danilo's projects** (`team_52WCkqpHdjlc0elwXFcNdKED`); nome de projeto `studio-cloud` livre.
- ✅ Repo `DaniloAmaralUX/studioworkspace` público, branch `main`, working tree limpa.
- ✅ Frontend já parametrizado: `frontend/src/lib/api.ts` usa `VITE_API_BASE` (prod = `/api`).
- ✅ `backend/src/core/ai.ts` já usa AI Gateway e aceita `VERCEL_OIDC_TOKEN` (zero chave na Vercel).
- ✅ Build de produção do frontend passa (verificado na entrega do hub Linear).
- ✅ PAT fine-grained read-only cadastrado como `GITHUB_TOKEN` no projeto Vercel. Permissões mínimas:
  *Metadata* e *Contents*. Com o R2 entregue (2026-07-28), ampliar para *Issues: Read*,
  *Pull requests: Read* e *Actions: Read* — sem elas o chat responde com contexto **parcial** e um
  aviso pedindo para verificar as permissões, em vez de falhar.
  **Nunca copiar o valor para chat, código, cookie, KV ou log.**

## Arquitetura-alvo

- **1 projeto Vercel** (`studio-cloud`), deploy via Git do repo `studioworkspace`, **Root Directory = raiz do repo**.
  *(Ajuste na execução da Fatia 0: o CLI não configura Root Directory; deployar pela raiz com
  `vercel.json` fazendo `cd frontend` elimina qualquer dependência do dashboard — e `api/` fica
  ao lado de `backend/` e `frontend/`, mais coerente no monorepo.)*
- Funções em **`api/` na raiz** (1 arquivo = 1 função). Mesma origem ⇒ zero CORS.
- `api/_lib/` = types/zod/lógica pura portada do backend (fonte: `backend/src/lib/types.ts`, `core/foundation.ts`). Fastify **não** migra.
- **Persistência: Upstash Redis** (Marketplace). Hashes: `ps:projects` (id→Project), `ps:templates`, `ps:foundation:<id>`.
- `vercel.json`: rewrite `/((?!api/).*)` → `/index.html`; `functions.maxDuration: 60`.
- Env: `VITE_API_BASE=/api` · `GITHUB_TOKEN` (PAT read-only) · `KV_REST_API_*` (auto) ·
  `STUDIO_ACCESS_PASSWORD_HASH` · `STUDIO_SESSION_SECRET` · `PS_AI_MODEL` (opcional) · AI Gateway via
  OIDC (nada a configurar).

### Fica no desktop (não portar)
`routes/open.ts` (launchers), `core/scaffold.ts`, `core/stamp.ts`, `dirtyCount`/working-tree local.
Na cloud, "trabalhar" = links: `github.com` · `github.dev` · `vscode.dev` · **`codespaces.new/{owner}/{repo}`**.

## Fatias (MVP ≈ 3,5 dias)

### Fatia 0 — Shell e autenticação — ✅ FEITA; hardening R0 em 2026-07-28
Produção atual: `https://studioworkspace-mauve.vercel.app` (deploy via Git).
1. `middleware.ts` protege páginas e APIs com a sessão própria do Studio.
2. `/login` usa senha única; a Vercel recebe somente hash PBKDF2 e segredo de assinatura.
3. Respostas `/api/*` são `no-store`; falhas públicas não incluem detalhes internos.
4. GitHub usa somente o PAT read-only do ambiente e a interface não oferece OAuth.
- **Aceite:** sem sessão, páginas redirecionam para `/login` e APIs retornam `401`; nenhum token chega
  ao browser, KV, chat ou log.

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
- **Fatia 6** "abrir PR" da foundation · busca NL (só se filtro client-side não bastar).

## Riscos/limites aceitos
- Working tree local invisível na cloud (híbrido cobre).
- `claude://` não existe na cloud (precisa de path local absoluto) — Codespaces é o substituto.
- Repo público + SPA protegida: o **código** já é público; o login próprio protege os dados pessoais
  (projetos, próximas ações) e o uso de IA/PAT. Deployment Protection pode permanecer como defesa
  adicional em previews, mas não substitui o gate do Studio.
