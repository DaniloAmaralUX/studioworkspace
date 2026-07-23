import { promises as fs } from 'node:fs'
import path from 'node:path'

// "Carimbo" portátil: escreve no projeto-alvo os arquivos de contexto que
// QUALQUER IDE/agente lê, para que a memória de design siga o projeto sem
// depender de conta de fornecedor. Idempotente: só toca o bloco marcado do
// Studio (markdown) ou a chave `shadcn` (configs MCP). Nunca apaga conteúdo
// do usuário. Segue a regra de ouro #3 (nada destrutivo).

const BEGIN = '<!-- STUDIO:BEGIN (gerado pelo Project Studio — edite fora deste bloco) -->'
const END = '<!-- STUDIO:END -->'

// Servidor MCP do shadcn — mesmo comando em todos os IDEs.
const SHADCN_MCP = { command: 'npx', args: ['shadcn@latest', 'mcp'] } as const

export type StampAction = 'created' | 'updated' | 'unchanged'
export type StampFile = { file: string; action: StampAction }
export type StampResult = { dir: string; files: StampFile[] }

// Regras canônicas de design (espelho das memórias design-direction-visual,
// design-direction-interaction e workspace-design-engineer-context). É o
// "cérebro" que viaja com o projeto. Na Fatia 2 isto passa a vir do registry.
function designRulesMarkdown(): string {
  return `# Regras de Design — workspace Design Engineer

Este projeto segue um design system pessoal. Ao **gerar, revisar ou ajustar** qualquer UI, aplique estas regras automaticamente.

## Base
- **100% shadcn/ui** sobre Radix + Tailwind. Nunca use \`<button>\`/\`<input>\`/\`<select>\` nativos quando há primitivo shadcn.
- **Dark mode default.** Tokens semânticos (\`bg-background\`, \`bg-card\`, \`text-foreground\`, \`text-muted-foreground\`, \`border-border\`). Nunca cor hex hardcoded.
- Estilo \`new-york\`. **Um único accent** via \`--color-primary\`. Radius base \`0.625rem\`.
- Cada valor editável mostra o token correspondente (ex.: \`spacing.4\` = \`16px\`).

## Tipografia (obsessiva com detalhe)
- **Mono** para código/valores/tokens/timestamps, com **ligatures** (JetBrains Mono / SF Mono).
- **Sans** humanista para UI (Inter/Geist), com \`optical sizing\` quando a fonte suportar.
- **Números técnicos** (hex, px, rem, versões, commits): \`font-variant-numeric: tabular-nums\` **obrigatório**.
- Type scale em grid de **4px**. Smart punctuation. \`line-clamp\` para truncar (nunca overflow escondido sem estratégia).
- \`font-feature-settings\` configurado quando a fonte suportar.

## Interação (Apple-style)
- **Easing físico (spring)**, nunca \`ease-in-out\` genérico. Animar **só \`transform\` e \`opacity\`**.
- Transições **interrompíveis**. Feedback visual distinto em hover · active · focus · disabled.
- Materiais translúcidos (\`backdrop-blur\` + borda \`1px\` de baixa opacidade) em painéis flutuantes.
- Respeitar \`prefers-reduced-motion\`. Momentum em scroll/swipe/drag.
- Inputs numéricos com scrubber (click+drag, estilo Figma).

## Estados & anti-patterns
- Loading/empty/error **sempre** com componente shadcn (Skeleton/Empty/Alert), nunca texto solto.
- Estados vazios úteis: atalhos de teclado, templates — nunca ilustração genérica.
- **AlertDialog** para destrutivo. **Nunca** \`Dialog\` para confirmar, **nunca** \`confirm()\`/\`alert()\`/\`prompt()\` do browser.
- Acessibilidade: foco visível, navegação por teclado, leitores de tela.

## Componentes
- O **shadcn MCP** está configurado neste repo — use-o para descobrir e instalar componentes do registry em vez de escrever primitivos na mão.`
}

function escapeForBlock(body: string): string {
  return `${BEGIN}\n${body}\n${END}`
}

function markdownFileHeader(title: string): string {
  return `# ${title}\n\n> Contexto de design mantido pelo Project Studio. O bloco abaixo é regenerável; edite livremente FORA dele.\n\n`
}

async function upsertMarkedBlock(
  filePath: string,
  title: string,
  body: string,
): Promise<StampAction> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  let existing: string | null = null
  try {
    existing = await fs.readFile(filePath, 'utf8')
  } catch {
    existing = null
  }

  const block = escapeForBlock(body)
  let next: string

  if (existing && existing.includes(BEGIN) && existing.includes(END)) {
    const i = existing.indexOf(BEGIN)
    const j = existing.indexOf(END) + END.length
    next = existing.slice(0, i) + block + existing.slice(j)
  } else if (existing && existing.trim()) {
    // Arquivo do usuário já existe sem nosso bloco — anexa sem tocar no resto.
    next = `${existing.trimEnd()}\n\n${block}\n`
  } else {
    // Arquivo novo — cabeçalho amigável + bloco.
    next = markdownFileHeader(title) + block + '\n'
  }

  if (existing !== null && next === existing) return 'unchanged'
  await fs.writeFile(filePath, next, 'utf8')
  return existing === null ? 'created' : 'updated'
}

// Arquivo 100% do Studio (Cursor rule dedicada) — pode ser reescrito inteiro.
async function writeCursorRule(filePath: string, body: string): Promise<StampAction> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const content = `---
description: Regras de design do workspace (Project Studio)
globs: ["**/*.tsx", "**/*.ts", "**/*.css"]
alwaysApply: true
---

${body}
`
  let existing: string | null = null
  try {
    existing = await fs.readFile(filePath, 'utf8')
  } catch {
    existing = null
  }
  if (existing !== null && existing === content) return 'unchanged'
  await fs.writeFile(filePath, content, 'utf8')
  return existing === null ? 'created' : 'updated'
}

// Merge da config MCP: preserva outros servidores e outras chaves do arquivo,
// só garante a entrada `shadcn`. `rootKey` é 'mcpServers' (Claude/Cursor) ou
// 'servers' (VS Code).
async function mergeMcpConfig(
  filePath: string,
  rootKey: 'mcpServers' | 'servers',
): Promise<StampAction> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })

  let existingRaw: string | null = null
  try {
    existingRaw = await fs.readFile(filePath, 'utf8')
  } catch {
    existingRaw = null
  }

  let obj: Record<string, unknown> = {}
  if (existingRaw && existingRaw.trim()) {
    try {
      const parsed = JSON.parse(existingRaw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>
      }
    } catch {
      // JSON inválido/comentado — não arrisca sobrescrever; reporta unchanged.
      return 'unchanged'
    }
  }

  const current = obj[rootKey]
  const servers: Record<string, unknown> =
    current && typeof current === 'object' && !Array.isArray(current)
      ? (current as Record<string, unknown>)
      : {}

  const before = JSON.stringify(servers.shadcn ?? null)
  servers.shadcn = { ...SHADCN_MCP }
  obj[rootKey] = servers
  const after = JSON.stringify(servers.shadcn)

  const content = JSON.stringify(obj, null, 2) + '\n'
  if (existingRaw !== null && before === after && content === existingRaw) {
    return 'unchanged'
  }
  await fs.writeFile(filePath, content, 'utf8')
  return existingRaw === null ? 'created' : 'updated'
}

export async function stampProject(projectDir: string): Promise<StampResult> {
  // Garante que o alvo existe e é uma pasta (nunca cria a raiz do projeto).
  const stat = await fs.stat(projectDir)
  if (!stat.isDirectory()) {
    throw new Error(`Alvo do carimbo não é uma pasta: ${projectDir}`)
  }

  const rules = designRulesMarkdown()
  const files: StampFile[] = []

  // Regras — em todos os formatos que os IDEs/agentes leem nativamente.
  files.push({
    file: 'AGENTS.md',
    action: await upsertMarkedBlock(
      path.join(projectDir, 'AGENTS.md'),
      'AGENTS — instruções para agentes',
      rules,
    ),
  })
  files.push({
    file: 'CLAUDE.md',
    action: await upsertMarkedBlock(
      path.join(projectDir, 'CLAUDE.md'),
      'CLAUDE — instruções para o Claude Code',
      rules,
    ),
  })
  files.push({
    file: '.github/copilot-instructions.md',
    action: await upsertMarkedBlock(
      path.join(projectDir, '.github', 'copilot-instructions.md'),
      'Copilot — instruções do projeto',
      rules,
    ),
  })
  files.push({
    file: '.cursor/rules/studio-design.mdc',
    action: await writeCursorRule(
      path.join(projectDir, '.cursor', 'rules', 'studio-design.mdc'),
      rules,
    ),
  })

  // Config MCP — mesmo servidor, arquivo/chave por IDE.
  files.push({
    file: '.mcp.json',
    action: await mergeMcpConfig(path.join(projectDir, '.mcp.json'), 'mcpServers'),
  })
  files.push({
    file: '.cursor/mcp.json',
    action: await mergeMcpConfig(
      path.join(projectDir, '.cursor', 'mcp.json'),
      'mcpServers',
    ),
  })
  files.push({
    file: '.vscode/mcp.json',
    action: await mergeMcpConfig(
      path.join(projectDir, '.vscode', 'mcp.json'),
      'servers',
    ),
  })

  return { dir: projectDir, files }
}
