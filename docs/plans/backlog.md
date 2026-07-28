# Backlog (fora do core do MVP)

Ideias boas que surgiram durante fatias e foram anotadas em vez de implementadas.
Só saem daqui quando o core estiver validado pelo uso diário.

## Encerradas (decisão de produto — não retomar sem novo ADR)
- Modo Maestri / canvas de agentes — encerrado em 2026-07-28 por
  [ADR-001](../decisions/ADR-001-paper-for-visual-canvas.md). O Paper cobre canvas, fluxos e
  exploração visual; canvas infinito, editor visual e Figma saíram do escopo. O código continua no
  repositório como histórico, sem rota e sem backlog ativo.

## Em andamento
- **Aba Design System (DS-1..DS-7)** — descongelada em 2026-07-28 por decisão explícita do usuário.
  Metade A: galeria dos componentes instalados (DS-1 rota + catálogo, DS-2 preview vivo, DS-3 demos
  interativos, DS-4 categorias + busca). Metade B: registry `@studio` de componentes (DS-5 registry
  público + host único, DS-6 `registry:ui` com `files[]`), fechando a promessa do scaffold. DS-7
  (Shiki) é polish opcional. Plano: `~/.claude/plans/fa-a-isso-por-mim-logical-lecun.md`.

## Congeladas (já existentes, aguardando validação do core)
- Instalador NSIS do app Electron
- Expansões do Studio Cloud
- Novos temas no registry

## Aprovado, aguardando fim da validação de 2 semanas
- **Templates vivos (TV-1..TV-5)** — galeria em cards → preview REAL navegável do template rodando
  local (clone+install+dev server, cache, single-slot) → sidebar de tema estilo shadcn/create
  "tema completo" (36 presets + radius + shuffle + Get Code) → "Começar projeto" com tema aplicado.
  Plano completo aprovado em 2026-07-27: `~/.claude/plans/eu-quero-abrir-templates-adaptive-orbit.md`.
  Absorve parte do plano DS antigo; corrige host do registry no scaffold.

## Novas ideias
<!-- adicionar aqui: - [data] ideia — por quê pareceu boa -->
- [2026-07-27] Starter `react-on-rails-starter-tanstack` avaliado como possível BASE do Studio —
  DESCARTADO (2 toolchains Ruby+TS, pnpm-first, mataria Electron e a variante Vercel). Aproveitar
  como: template `needsConfig` na galeria (TV-1 deve aceitar `localPath` como fonte) + projeto no
  hub + inspirações: docs numerados 01–13, AGENTS.md rico por superfície, smoke Playwright por
  modo de renderização.
