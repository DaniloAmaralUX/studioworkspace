# `$Args` como nome de parametro quebra splat no PowerShell 5.1

**Contexto:** `verify.ps1` tinha uma funcao `Step` com `param(..., [string[]]$Args)` e chamava
`& $Exe @Args` (splat). O comando nativo (`npm run typecheck`) rodava SEM argumentos — `npm` imprimia
o help e retornava exit 1, derrubando o portao.

**Causa:** `$Args` e uma **variavel automatica reservada** do PowerShell (contem os argumentos nao
ligados de uma funcao/script). Declara-la como parametro nao a popula de forma confiavel; no splat
`@Args` ela vinha vazia, entao o executavel rodava pelado.

**Solucao:** renomear o parametro (usei `$CmdArgs`) e o splat (`@CmdArgs`). Nunca usar `$Args`,
`$Input`, `$PSItem`, `$_`, `$Error`, `$Host` etc. como nome de parametro.

**Como evitar:** ao escrever funcoes PS, evitar a lista de variaveis automaticas
(https://learn.microsoft.com/powershell/module/microsoft.powershell.core/about/about_automatic_variables).
Prefixar params de "argumentos" com um qualificador (`CmdArgs`, `ExtraArgs`).
