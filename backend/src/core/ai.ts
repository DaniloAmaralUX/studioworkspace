import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { generateText, gateway, type LanguageModel } from 'ai'
import type { Project } from '../lib/types'
import { bedrockClient, getAiSettings } from './aiSettings'
import { cleanAssistantText } from './aiText'

// Dois provedores possíveis, escolhidos pelo que está no ambiente:
//   1. Amazon Bedrock — se houver AWS_BEARER_TOKEN_BEDROCK (API key do Bedrock).
//      Usa o endpoint Mantle OpenAI-compatible e consome os créditos da AWS.
//   2. Vercel AI Gateway — AI_GATEWAY_API_KEY (local) ou VERCEL_OIDC_TOKEN (Vercel).
// Nunca usamos ANTHROPIC_API_KEY (regra de ouro #2). As chaves ficam só no
// backend/.env, que é ignorado pelo git.
export function aiConfigured(): boolean {
  return Boolean(
    getAiSettings().configured ||
      process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN,
  )
}

function resolveModel(): LanguageModel {
  return gateway(process.env.PS_AI_MODEL ?? 'anthropic/claude-sonnet-4.6')
}

const pExecFile = promisify(execFile)

async function recentCommits(dir: string, n = 12): Promise<string[]> {
  try {
    const { stdout } = await pExecFile(
      'git',
      ['-C', dir, 'log', `-${n}`, '--pretty=%s'],
      { windowsHide: true, timeout: 10_000 },
    )
    return stdout.split('\n').map((s) => s.trim()).filter(Boolean)
  } catch {
    return []
  }
}

async function readReadme(dir: string, max = 2000): Promise<string | null> {
  for (const name of ['README.md', 'readme.md', 'README', 'docs/README.md']) {
    try {
      const txt = await fs.readFile(path.join(dir, name), 'utf8')
      if (txt.trim()) return txt.slice(0, max)
    } catch {
      /* tenta o próximo candidato */
    }
  }
  return null
}

// Best-effort para repositórios GitHub ainda não clonados (usa o `gh` já autenticado).
async function ghRecentCommits(nwo: string, n = 12): Promise<string[]> {
  try {
    const { stdout } = await pExecFile(
      'gh',
      [
        'api',
        `repos/${nwo}/commits?per_page=${n}`,
        '--jq',
        '[.[].commit.message | split("\n")[0]] | join("\n")',
      ],
      { windowsHide: true, timeout: 15_000, maxBuffer: 4 * 1024 * 1024 },
    )
    return stdout.split('\n').map((s) => s.trim()).filter(Boolean)
  } catch {
    return []
  }
}

async function ghReadme(nwo: string, max = 2000): Promise<string | null> {
  try {
    const { stdout } = await pExecFile(
      'gh',
      ['api', `repos/${nwo}/readme`, '-H', 'Accept: application/vnd.github.raw'],
      { windowsHide: true, timeout: 15_000, maxBuffer: 4 * 1024 * 1024 },
    )
    return stdout.trim() ? stdout.slice(0, max) : null
  } catch {
    return null
  }
}

type Context = { commits: string[]; readme: string | null }

async function gatherContext(project: Project): Promise<Context> {
  const dir =
    project.source.kind === 'local'
      ? project.source.path
      : project.source.kind === 'github'
        ? project.source.cloneDir
        : undefined

  if (dir) {
    const [commits, readme] = await Promise.all([
      recentCommits(dir),
      readReadme(dir),
    ])
    return { commits, readme }
  }
  if (project.source.kind === 'github') {
    const [commits, readme] = await Promise.all([
      ghRecentCommits(project.source.nameWithOwner),
      ghReadme(project.source.nameWithOwner),
    ])
    return { commits, readme }
  }
  return { commits: [], readme: null }
}

const STATUS_PT: Record<Project['status'], string> = {
  planning: 'planejando',
  building: 'construindo',
  review: 'em revisão',
  blocked: 'bloqueado',
  done: 'concluído',
}

function buildPrompt(project: Project, ctx: Context): string {
  const lines: string[] = []
  lines.push(`Projeto: ${project.name}`)
  lines.push(`Status atual: ${STATUS_PT[project.status]}`)
  if (project.stack.length) lines.push(`Stack: ${project.stack.join(', ')}`)
  if (project.tags.length) lines.push(`Tags: ${project.tags.join(', ')}`)
  if (project.nextAction) {
    lines.push(`Próxima ação atual (pode estar desatualizada): ${project.nextAction}`)
  }
  if (ctx.commits.length) {
    lines.push('', 'Commits recentes (mais novo primeiro):')
    ctx.commits.slice(0, 12).forEach((c) => lines.push(`- ${c}`))
  }
  if (ctx.readme) {
    lines.push('', 'Trecho do README:', ctx.readme)
  }
  if (!ctx.commits.length && !ctx.readme) {
    lines.push(
      '',
      '(Sem commits ou README acessíveis — sugira um próximo passo razoável a partir do nome, stack e status.)',
    )
  }
  return lines.join('\n')
}

const SYSTEM = [
  'Você ajuda um desenvolvedor solo (com TDAH) a retomar projetos rápido.',
  'A partir do estado do projeto, responda com UMA única próxima ação: concreta, específica e acionável.',
  'Regras: uma só frase imperativa curta, em português do Brasil. Sem listas, sem numeração, sem preâmbulo, sem aspas.',
  'Prefira o menor passo que destrava o projeto agora.',
].join(' ')

export async function suggestNextAction(project: Project): Promise<string> {
  const ctx = await gatherContext(project)
  const prompt = buildPrompt(project, ctx)
  const text = getAiSettings().configured
    ? (
        await bedrockClient().chat.completions.create({
          model: getAiSettings().model,
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: prompt },
          ],
          max_tokens: 120,
        })
      ).choices[0]?.message.content ?? ''
    : (
        await generateText({
          model: resolveModel(),
          system: SYSTEM,
          prompt,
          maxOutputTokens: 120,
        })
      ).text
  const firstLine =
    cleanAssistantText(text)
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? text.trim()
  return firstLine.replace(/^["'`]+|["'`]+$/g, '').trim()
}
