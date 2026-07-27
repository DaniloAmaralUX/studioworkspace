# Compound Engineering — regras do loop

> Fonte: guia da Every (every.to/guides/compound-engineering) + plugin `everyinc/compound-engineering-plugin`.
> Princípio central: **cada unidade de trabalho deve tornar a próxima mais fácil — nunca mais difícil.**

## O loop (toda fatia de trabalho passa por ele)

1. **Planejar** (~40% do esforço)
   - Entender o requisito e o porquê. Pesquisar padrões já existentes no repo antes de inventar.
   - Consultar Context7 para qualquer decisão que envolva biblioteca/framework (ver `context7.md`).
   - Plano curto e verificável: arquivos afetados, passos, critério de pronto. Plano é o artefato primário, não o código.
2. **Executar** (~20%)
   - Seguir o plano passo a passo. Commits pequenos por fatia. Rodar typecheck/build continuamente.
   - Primeira versão não precisa ser polida — precisa ser verificável.
3. **Revisar** (~40%, junto com planejar)
   - Auto-revisão antes de entregar: correção, simplicidade, segurança (regras de ouro do CLAUDE.md), UX.
   - Classificar achados: P1 (obrigatório corrigir), P2 (deveria), P3 (bom ter). P1 nunca passa.
4. **Compor** (o passo que ninguém pula)
   - Problema não trivial resolvido → registrar em `docs/solutions/<slug>.md` (contexto, causa, solução, como evitar).
   - Padrão novo confirmado → atualizar `CLAUDE.md` ou criar regra em `.claude/rules/`.
   - Lição de produto (o que engajou / o que travou o uso diário) → registrar também.

## Regras de postura

- Pesquisar antes de propor; apresentar opções com trade-offs quando a decisão for relevante.
- Sinalizar baixa confiança explicitamente em vez de fingir certeza.
- Validar suposições contra o código existente antes de escrever código novo.
- Medir sucesso por **problema resolvido e uso diário real**, não por volume de código.
- 50/50: metade do tempo em features, metade em melhorar o sistema (docs, regras, fricção zero).

## Artefatos

| Artefato | Papel |
|---|---|
| `CLAUDE.md` | Memória institucional — preferências e padrões confirmados |
| `docs/plans/` | Planos de fatia (um md por fatia, curto) |
| `docs/solutions/` | Problemas resolvidos, buscáveis por sessões futuras |
| `.claude/rules/` | Regras carregadas em toda sessão |
