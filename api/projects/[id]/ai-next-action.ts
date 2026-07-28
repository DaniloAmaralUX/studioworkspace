// POST /api/projects/:id/ai-next-action — sugere UMA próxima ação (mesmo
// contrato do desktop; o botão "Sugerir com IA" funciona sem mudança).
// IA via Vercel AI Gateway: na Vercel a credencial é OIDC automático
// (VERCEL_OIDC_TOKEN) — nunca ANTHROPIC_API_KEY (regra de ouro).
// Contexto do repo vem da API do GitHub (README + commits), não de git local.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { getProject } from '../../_lib/kv.js'
import { methodNotAllowed, sendError } from '../../_lib/http.js'
import { repoCommits, repoReadme } from '../../_lib/github.js'
import { resolveGithubToken } from '../../_lib/auth.js'
import type { Project } from '../../_lib/types.js'
import {
  aiConfigured,
  generateAiChat,
  generateAiText,
} from '../../_lib/ai.js'

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

const APP_TIME_ZONE = 'America/Fortaleza'

function buildChatSystem(now = new Date()): string {
  const currentDateTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TIME_ZONE,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(now)

  return [
    'Você é o Context Project, copiloto de projetos do Studio.',
    'Responda em português do Brasil, com clareza e concisão.',
    `A data e hora atuais, fornecidas pelo sistema, são ${currentDateTime} (${APP_TIME_ZONE}). Considere essa informação autoritativa e nunca a substitua por uma data inferida do seu treinamento.`,
    'Nesta primeira versão você conversa e esclarece dúvidas gerais.',
    'Você ainda não recebeu dados do GitHub ou do projeto selecionado.',
    'Se perguntarem pelo estado atual de um projeto, diga que a leitura do repositório será conectada na próxima versão e não invente informações.',
    'Para notícias, resultados e outros fatos recentes que não estejam presentes na conversa, diga que não possui uma fonte atualizada em vez de inventar ou afirmar que ainda não aconteceram.',
    'Mostre somente a resposta final; nunca exponha raciocínio interno.',
  ].join(' ')
}

const chatBody = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(4_000),
      }),
    )
    .min(1)
    .max(24),
})

async function handleChat(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!aiConfigured()) {
    return sendError(
      res,
      503,
      'ai_not_configured',
      'IA não configurada no projeto Vercel.',
    )
  }
  const parsed = chatBody.safeParse(req.body)
  if (!parsed.success) {
    return sendError(
      res,
      400,
      'invalid_body',
      'Envie de 1 a 24 mensagens válidas.',
    )
  }
  try {
    const result = await generateAiChat({
      system: buildChatSystem(),
      messages: parsed.data.messages,
      maxTokens: 800,
    })
    if (!result.text) {
      return sendError(res, 502, 'chat_empty', 'A IA respondeu sem conteúdo.')
    }
    res.status(200).json({
      message: { role: 'assistant', content: result.text },
      model: result.model,
    })
  } catch {
    sendError(
      res,
      502,
      'chat_failed',
      'Não foi possível responder agora. Tente novamente.',
    )
  }
}

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
  if (id === 'context-project') {
    return handleChat(req, res)
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
    const token = resolveGithubToken(req)
    if (project.source.kind === 'github' && token) {
      const nwo = project.source.nameWithOwner
      ;[commits, readme] = await Promise.all([
        repoCommits(token, nwo),
        repoReadme(token, nwo),
      ])
    }

    const { text } = await generateAiText({
      system: SYSTEM,
      prompt: buildPrompt(project, commits, readme),
      maxTokens: 120,
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
