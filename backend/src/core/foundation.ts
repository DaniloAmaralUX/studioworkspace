import { promises as fs } from 'node:fs'
import path from 'node:path'
import { readJson, writeJsonAtomic } from '../lib/atomicJson'
import type { Foundation } from '../lib/types'

// Persistência da foundation dentro do projeto: `.workspace/foundation.json` e
// `.workspace/DESIGN.md`. Fica em `.workspace/` de propósito, pra NUNCA sobrescrever
// um DESIGN.md que o projeto já tenha na raiz.
function workspaceDir(projectDir: string): string {
  return path.join(projectDir, '.workspace')
}

export async function readFoundation(
  projectDir: string,
): Promise<Foundation | null> {
  return readJson<Foundation | null>(
    path.join(workspaceDir(projectDir), 'foundation.json'),
    null,
  )
}

export async function writeFoundation(
  projectDir: string,
  foundation: Foundation,
): Promise<void> {
  await writeJsonAtomic(
    path.join(workspaceDir(projectDir), 'foundation.json'),
    foundation,
  )
}

export function shadcnCommand(f: Foundation): string {
  return `npx shadcn@latest init -b ${f.baseColor}`
}

export function designMarkdown(f: Foundation): string {
  return `# DESIGN.md

Foundation gerada pelo Project Studio.

- **Framework:** ${f.framework}
- **Base color:** ${f.baseColor}
- **Tema:** ${f.theme}
- **Fonte:** ${f.font}
- **Radius:** ${f.radius}
- **Densidade:** ${f.density}
- **Ícones:** ${f.iconLibrary}

## Setup

\`\`\`bash
${shadcnCommand(f)}
\`\`\`

> Ajuste os tokens de cor em \`src/index.css\` conforme o tema "${f.theme}".
`
}

export async function writeDesignMd(
  projectDir: string,
  content: string,
): Promise<string> {
  const dir = workspaceDir(projectDir)
  await fs.mkdir(dir, { recursive: true })
  const p = path.join(dir, 'DESIGN.md')
  await fs.writeFile(p, content, 'utf8')
  return p
}
