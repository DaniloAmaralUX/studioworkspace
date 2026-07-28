# ADR-001: Paper como ferramenta de canvas visual

Data: 2026-07-28

## Contexto

O Studio chegou a experimentar um canvas próprio baseado em React Flow, além de receber uma proposta
de evolução com canvas infinito, editor visual de telas e integração com Figma. Essas frentes têm alto
custo e desviam o produto do seu objetivo principal: manter contexto, decisões, saúde e próxima ação
dos projetos.

O usuário já utiliza o Paper para exploração visual livre, fluxos e composição espacial.

## Decisão

- O Paper será a ferramenta externa para canvas, diagramas e exploração visual.
- O Studio não terá canvas infinito, editor visual de telas ou integração com Figma.
- A opção e a rota de Canvas serão removidas da aplicação.
- O código experimental não será apagado nesta mudança; permanece apenas como histórico, sem entrada
  de navegação e sem backlog ativo.
- A evolução do Studio prioriza memória por projeto, ADRs, documentos de contexto e auditorias de
  qualidade fundamentadas no repositório.

## Consequências

- Redução de escopo, dependências visuais e carga cognitiva.
- O Studio mantém foco em “qual é o estado do projeto e o que faço agora?”.
- Trabalho visual continua possível no Paper, sem duplicação de produto.
- Reintroduzir um canvas exige uma nova decisão explícita e a substituição deste ADR.
