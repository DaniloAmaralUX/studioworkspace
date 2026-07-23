import { promises as fs } from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { addProject } from './projectIndex'
import { detectStack } from './stackDetect'
import { stampProject } from './stamp'
import { ghClone } from './github'
import type { Project } from '../lib/types'

// "Novo projeto": cria uma pasta NOVA já no padrão do usuário (template opcional
// + carimbo de contexto). Só cria; nunca sobrescreve pasta existente. Sempre
// execFile com args (sem shell) + timeout (regras de ouro #3 e #7).

const pExecFile = promisify(execFile)
const CLONE_TIMEOUT = 120_000

export class ScaffoldError extends Error {
  constructor(
    public code: 'no_parent' | 'exists' | 'clone_failed',
    message: string,
  ) {
    super(message)
  }
}

function slugify(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'projeto'
}

async function pathExists(p: string): Promise<boolean> {
  return !!(await fs.stat(p).catch(() => null))
}

async function gitInit(dir: string): Promise<void> {
  try {
    await pExecFile('git', ['init', dir], { windowsHide: true, timeout: 15_000 })
  } catch {
    /* git ausente — segue sem repo */
  }
}

async function cloneTemplate(url: string, dest: string): Promise<void> {
  const isNwo = /^[\w.-]+\/[\w.-]+$/.test(url)
  try {
    if (isNwo) {
      await ghClone(url, dest)
    } else {
      await pExecFile('git', ['clone', '--depth', '1', url, dest], {
        windowsHide: true,
        timeout: CLONE_TIMEOUT,
      })
    }
  } catch (err) {
    throw new ScaffoldError('clone_failed', (err as Error).message)
  }
  // História fresca: remove o .git clonado e inicia um repo novo.
  await fs.rm(path.join(dest, '.git'), { recursive: true, force: true })
  await gitInit(dest)
}

function blankReadme(name: string): string {
  return `# ${name}

Criado pelo **Project Studio** — já no seu padrão de design.

- Regras de design (qualquer IDE lê): \`AGENTS.md\`, \`CLAUDE.md\`, \`.cursor/rules/\`, \`.github/copilot-instructions.md\`
- shadcn MCP configurado: \`.mcp.json\` (Claude), \`.cursor/mcp.json\`, \`.vscode/mcp.json\`
- Componentes do seu registry: \`npx shadcn add @studio/<componente>\`
`
}

function blankComponentsJson(): string {
  return (
    JSON.stringify(
      {
        $schema: 'https://ui.shadcn.com/schema.json',
        style: 'new-york',
        rsc: false,
        tsx: true,
        tailwind: {
          config: '',
          css: 'src/index.css',
          baseColor: 'zinc',
          cssVariables: true,
        },
        aliases: {
          components: '@/components',
          utils: '@/lib/utils',
          ui: '@/components/ui',
        },
        registries: {
          '@studio': 'https://studio-ds.vercel.app/r/{name}.json',
        },
      },
      null,
      2,
    ) + '\n'
  )
}

async function writeBlankStarter(dest: string, name: string): Promise<void> {
  await fs.writeFile(path.join(dest, 'README.md'), blankReadme(name), 'utf8')
  await fs.writeFile(
    path.join(dest, '.gitignore'),
    'node_modules/\ndist/\n.env\n.env.*\n!.env.example\n*.log\n',
    'utf8',
  )
  await fs.writeFile(
    path.join(dest, 'components.json'),
    blankComponentsJson(),
    'utf8',
  )
  await gitInit(dest)
}

export type ScaffoldInput = {
  name: string
  parentDir: string
  templateRepoUrl?: string
}
export type ScaffoldResult = {
  project: Project
  dir: string
  cloned: boolean
  stamped: string[]
}

export async function scaffoldProject(
  input: ScaffoldInput,
): Promise<ScaffoldResult> {
  const parent = path.resolve(input.parentDir)
  const parentStat = await fs.stat(parent).catch(() => null)
  if (!parentStat || !parentStat.isDirectory()) {
    throw new ScaffoldError('no_parent', 'A pasta-mãe não existe.')
  }

  const dest = path.join(parent, slugify(input.name))
  if (await pathExists(dest)) {
    throw new ScaffoldError('exists', 'Já existe uma pasta com esse nome aqui.')
  }

  const url = input.templateRepoUrl?.trim()
  let cloned = false
  if (url) {
    await cloneTemplate(url, dest)
    cloned = true
  } else {
    await fs.mkdir(dest, { recursive: true })
    await writeBlankStarter(dest, input.name)
  }

  const stamp = await stampProject(dest)
  const stack = await detectStack(dest)
  const project = await addProject({
    name: input.name.trim(),
    source: { kind: 'local', path: dest },
    stack,
    status: 'planning',
    nextAction: 'Abrir no seu IDE — o contexto de design já está no projeto.',
  })

  return {
    project,
    dir: dest,
    cloned,
    stamped: stamp.files
      .filter((f) => f.action !== 'unchanged')
      .map((f) => f.file),
  }
}
