# THIRD_PARTY_NOTICES.md

Regra: **consultar padrões, não clonar/copiar repositórios inteiros.** Sempre que um padrão, tipo,
parser ou trecho for reaproveitado de um projeto open source, registrar aqui.

## Projetos de referência (consulta)

| Projeto | Repositório | Licença | Uso |
|---|---|---|---|
| OpenWork | `different-ai/openwork` | MIT (exceto `/ee`, Fair Source) | Padrão pasta-como-projeto, separação UI/servidor, permissões, sessão. |
| Open CoDesign | `OpenCoworkAI/open-codesign` | MIT | Sessão↔pasta, preview, `DESIGN.md` como memória de design. |
| opencode | `anomalyco/opencode` | MIT | Referência de adapter/permissões; candidato a agente futuro. |
| shadcn/ui | `shadcn-ui/ui` | MIT | UX do configurador (`shadcn/create`) e componentes de UI. |

> Não copiar: módulos `/ee`, infraestrutura de nuvem, marketplace, ou UI inteira desses projetos.

## Registro de reaproveitamentos

Ao usar algo, adicionar uma entrada:

```
### <nome do padrão/trecho>
- Origem: <projeto> — <URL do arquivo> @ <commit>
- Licença: <MIT/Apache-2.0/...>
- O que foi usado: <conceito | tipo | função>
- Alterações: <o que mudou ao adaptar>
```

(Nenhum reaproveitamento de código registrado ainda — só referência de padrões.)
