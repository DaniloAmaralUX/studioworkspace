# ADR-002: Amazon Bedrock como motor de IA do produto

Data: 2026-07-28

## Contexto

O Studio precisa gerar respostas contextuais, memórias, ADRs, resumos e auditorias. Fazer cada uma
dessas tarefas em uma conversa externa aumenta custo operacional, quebra o fluxo do produto e exige
reconstruir contexto.

A produção já possui conexão server-side com o Kimi via Amazon Bedrock Mantle e créditos disponíveis
na conta AWS.

## Decisão

- Funcionalidades de IA executadas dentro do Studio usarão o Kimi via Amazon Bedrock.
- A chave permanece exclusivamente nas variáveis protegidas da Vercel e nunca chega ao navegador,
  ao GitHub, ao prompt exibido ou aos dados persistidos.
- R3 e R4 reaproveitarão o cliente e os limites já existentes, em vez de criar uma segunda integração.
- Conteúdo gerado que altere memória, ADR, próxima ação, código ou GitHub exige confirmação explícita.
- O AI Gateway da Vercel não é requisito; o caminho principal é a conexão direta com o Bedrock.

## Consequências

- O uso cotidiano dessas funções consome créditos da AWS, não tokens desta conversa.
- O Codex continua sendo usado para desenvolver, revisar e manter o próprio Studio.
- Falhas, limites e custos do Bedrock precisam permanecer observáveis e apresentar estados de erro úteis.
- Novos provedores exigem uma decisão arquitetural separada; não haverá seleção arbitrária por tela.
