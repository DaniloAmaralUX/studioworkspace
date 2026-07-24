// POST /api/projects/:id/ai-next-action — sugere UMA próxima ação (mesmo
// contrato do desktop; o botão "Sugerir com IA" funciona sem mudança).
// IA via Vercel AI Gateway: na Vercel a credencial é OIDC automático
// (VERCEL_OIDC_TOKEN) — nunca ANTHROPIC_API_KEY (regra de ouro).
// Contexto do repo vem da API do GitHub (README + commits), não de git local.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateText, gateway } from 'ai'
import { getProject } from '../../_lib/kv.js'
import { methodNotAllowed, sendError } from '../../_lib/http.js'
import { repoCommits, repoReadme } from '../../_lib/github.js'
import type { Project } from '../../_lib/types.js'

const AI_MODEL = process.env.PS_AI_MODEL ?? 'anthropic/claude-sonnet-4.6'

function aiConfigured(): boolean {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN,
  )
}

const STATUS_PT: Record<Project['status'], string> = {
  planning: 'planejando',
  building: 'construindo',
  review: 'em revisão',
  blocked: 'bloqueado',
  done: 'concluído',
}

const SYSTEM = [
  'Você ajuda um desenvolvedor solo (com TDAH) a retomar projetos rápido.',
  'A partir do estado do projeto, responda com UMA única próxima ação: concreta, específica e acionável.',
  'Regras: uma só frase imperativa curta, em português do Brasil. Sem listas, sem numeração, sem preâmbulo, sem aspas.',
  'Prefira o menor passo que destrava o projeto agora.',
].join(' ')

function buildPrompt(
  project: Project,
  commits: string[],
  readme: string | null,
): string {
  const lines: string[] = []
  lines.push(`Projeto: ${project.name}`)
  lines.push(`Status atual: ${STATUS_PT[project.status]}`)
  if (project.stack.length) lines.push(`Stack: ${project.stack.join(', ')}`)
  if (project.tags.length) lines.push(`Tags: ${project.tags.join(', ')}`)
  if (project.nextAction) {
    lines.push(
      `Próxima ação atual (pode estar desatualizada): ${project.nextAction}`,
    )
  }
  if (commits.length) {
    lines.push('', 'Commits recentes (mais novo primeiro):')
    commits.slice(0, 12).forEach((c) => lines.push(`- ${c}`))
  }
  if (readme) lines.push('', 'Trecho do README:', readme)
  if (!commits.length && !readme) {
    lines.push(
      '',
      '(Sem commits ou README acessíveis — sugira um próximo passo razoável a partir do nome, stack e status.)',
    )
  }
  return lines.join('\n')
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST')
  const id = req.query.id
  if (typeof id !== 'string' || !id) {
    return sendError(res, 400, 'invalid_id', 'Id do projeto ausente.')
  }
  try {
    const project = await getProject(id)
    if (!project) {
      return sendError(res, 404, 'not_found', 'Projeto não encontrado')
    }
    if (!aiConfigured()) {
      return sendError(
        res,
        503,
        'ai_not_configured',
        'IA não configurada: habilite o AI Gateway/OIDC no projeto Vercel.',
      )
    }

    let commits: string[] = []
    let readme: string | null = null
    if (project.source.kind === 'github') {
      const nwo = project.source.nameWithOwner
      ;[commits, readme] = await Promise.all([
        repoCommits(nwo),
        repoReadme(nwo),
      ])
    }

    const { text } = await generateText({
      model: gateway(AI_MODEL),
      system: SYSTEM,
      prompt: buildPrompt(project, commits, readme),
      maxOutputTokens: 120,
    })
    const suggestion =
      text
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.length > 0)
        ?.replace(/^["'`]+|["'`]+$/g, '')
        .trim() ?? ''

    if (!suggestion) {
      return sendError(res, 502, 'ai_empty', 'A IA não retornou uma sugestão.')
    }
    res.status(200).json({ suggestion })
  } catch (err) {
    sendError(
      res,
      502,
      'ai_failed',
      err instanceof Error ? err.message : 'Falha ao gerar sugestão de IA.',
    )
  }
}
