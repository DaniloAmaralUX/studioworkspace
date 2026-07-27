# UTF-8 com BOM fazia JSON válido ser tratado como corrompido

**Contexto:** na F2 do automode (resiliência do backend), a verificação viva regravou o
`projects.json` isolado via PowerShell 5.1 (`Out-File -Encoding utf8`). O `GET /api/projects`
respondeu `[]` e criou um `.bak-<ts>` — o mecanismo de recuperação de corrupção disparou para um
arquivo **válido**.

**Causa:** `Out-File`/`Set-Content -Encoding utf8` no Windows PowerShell 5.1 gravam **UTF-8 com BOM**
(`EF BB BF`). `JSON.parse` do Node rejeita a string com BOM na frente (`Unexpected token`), e o
`readJson` interpretava qualquer erro de parse como corrupção.

**Solução:** strip do BOM antes do parse em `backend/src/lib/atomicJson.ts`:
`JSON.parse(raw.replace(/^﻿/, ''))`. Caso de teste dedicado em
`backend/test/resilience.test.ts` ("UTF-8 com BOM NÃO é tratado como corrupção").

**Como evitar:**
- Qualquer parser de arquivo editável pelo usuário no Windows deve tolerar BOM.
- Ao escrever arquivos p/ consumo por outras ferramentas em PS 5.1, preferir
  `[System.IO.File]::WriteAllText($path, $text)` (UTF-8 sem BOM) — ou aceitar BOM no leitor.
- Armadilha de escape ao editar via tool: `﻿` digitado em parâmetro JSON vira o CARACTERE
  literal no arquivo (invisível). Conferir com `od -c` (bytes `357 273 277`) quando importa.
