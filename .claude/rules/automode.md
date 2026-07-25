# automode.md — invariantes do automode (sobrevivem a sumarizacao de contexto)

> Sessao de execucao autonoma do core do Project Studio (achar -> decidir -> abrir).
> Plano vivo / contrato de retomada: `docs/plans/automode-2026-07-24.md`. **Reler antes de agir.**

## Invariantes duras (nunca violar)

1. **Branch `canvas`.** Nunca tocar/checar out `main`. Confirmar com `git rev-parse --abbrev-ref HEAD`.
2. **NUNCA push.** Push na main = deploy Vercel em producao. Push esta desabilitado por
   `git remote set-url --push origin DISABLED_no_push`. Nunca reverter isso na sessao.
3. **Nunca `git add -A` / `git add .`.** Ha untracked perigosos. Sempre adds explicitos por arquivo.
4. **Paths congelados** (fonte: `scripts/frozen-paths.txt`): nem "consertar de passagem". Leitura ok.
5. **Dados reais intocaveis.** Verificacao viva SEMPRE com `PS_DATA_DIR`/`PS_WORK_DIR` isolados no
   scratchpad, semeados de uma COPIA do `%APPDATA%\project-studio\projects.json`. Hash conferido no handoff.
6. **Fila e estado** vivem no plano vivo. Cada fatia = 1 commit `feat(core): <titulo> [automode F<n>]`
   incluindo o plano vivo atualizado no mesmo commit.
7. **`npm`, nunca `pnpm`.** `execFile(cmd,[args])`, nunca interpolar shell.
8. **Smoke NUNCA aciona** `POST /api/projects/:id/open` (abre apps/janelas reais). Max 1 abertura real
   por launcher alterado, so se a fatia mexer em `launcher.ts`.

## Loop por fatia (resumo — detalhe no plano vivo)

Sincronizar -> Planejar (arquivos declarados; ∩ frozen = redesenhar 1x ou BLOQUEADA) ->
Executar (`verify.ps1 -Quick`) -> Portao (`verify.ps1` completo; max 3 tentativas) ->
Verificacao viva (dados isolados; max 2 tentativas) -> Revisao Workflow (3 revisores +
verificador adversarial; P1 CONFIRMED bloqueia) -> Compor (`docs/solutions/`) -> Scope-check + commit.

## Circuit breakers

- 2 fatias BLOQUEADAS consecutivas -> parar, handoff parcial com diagnostico.
- Fatia bloqueada que e dependencia das restantes -> parar.
- Baseline `verify.ps1` completo quebrado -> nao iniciar.
- Flake `canvas.test.ts` (congelado, roda em todo `npm test`): retry 1x; 2 falhas iguais = regressao
  em codigo compartilhado -> corrigir no codigo NAO congelado ou reverter. Editar o teste e proibido.
