# R0 — Hardening do Studio Cloud

## Objetivo

Tornar o login próprio do Studio a única autenticação do workspace cloud e
garantir que a integração GitHub use exclusivamente o `GITHUB_TOKEN` mantido no
servidor, sem OAuth, cookies de token ou respostas cacheáveis.

## Arquivos afetados

- `api/_lib/auth.ts`, `api/_lib/http.ts`, `api/auth/[action].ts` e
  `api/github/[resource].ts`
- `middleware.ts` e `frontend/src/components/GithubConnect.tsx`
- `PRD.md`, `ROADMAP.md`, `PLANO2.md`, `BACKEND.md` e `FRONTEND.md`
- testes novos em `test/cloud/`

## Passos

1. Remover o fluxo OAuth e resolver GitHub somente por `GITHUB_TOKEN`.
2. Aplicar `no-store` a toda API no middleware e nos helpers de erro.
3. Manter apenas status/login/logout do Studio e mensagens públicas genéricas.
4. Transformar a conexão GitHub da sidebar em indicador passivo.
5. Atualizar os documentos para refletir a arquitetura efetiva.
6. Cobrir autenticação, headers, logout e ausência de segredos com testes.

## Critério de pronto

- Nenhuma rota, cookie ou UI de OAuth GitHub permanece ativa.
- O PAT não é lido do request, devolvido ao cliente, persistido ou logado.
- Todas as respostas `/api/*` recebem `Cache-Control: no-store`.
- Login próprio protege páginas e APIs; logout expira a sessão.
- Typecheck, lint, testes cloud e build passam.

## Exceção temporária da auditoria de dependências

- `npm audit` do frontend ainda aponta o advisory alto
  `GHSA-qwww-vcr4-c8h2` em `react-router`/`react-router-dom`.
- A superfície descrita pelo advisory é de React Server Components/Server
  Actions. O Studio é uma SPA Vite executada no cliente e não usa RSC,
  `react-server-dom-*`, SSR do React Router ou Server Actions.
- A exceção não é um aceite permanente nem autoriza `npm audit fix --force`.
  Ela deve ser removida assim que houver uma versão corrigida compatível,
  depois de typecheck, lint, testes e build.
- Se o produto passar a usar SSR, RSC ou Server Actions antes da atualização,
  esse alerta volta a ser bloqueante imediatamente.
