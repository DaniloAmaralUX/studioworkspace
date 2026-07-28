import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { ChatResponse } from '../lib/types'
import {
  aiConfigured,
  buildContextChatSystem,
  buildProjectContextPrompt,
  ContextCollectionError,
  gatherProjectContext,
  parseContextualResponse,
} from '../core/ai'
import { bedrockClient, getAiSettings } from '../core/aiSettings'
import { cleanAssistantText } from '../core/aiText'
import { getProject } from '../core/projectIndex'

const MAX_HISTORY_CHARACTERS = 24_000
const AI_TIMEOUT_MS = 30_000

const chatMessage = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(4_000),
})

const chatBody = z
  .object({
    projectId: z.string().trim().min(1).max(200).optional(),
    messages: z.array(chatMessage).min(1).max(24),
  })
  .superRefine((body, ctx) => {
    const total = body.messages.reduce(
      (sum, message) => sum + message.content.length,
      0,
    )
    if (total > MAX_HISTORY_CHARACTERS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['messages'],
        message: `O histórico excede ${MAX_HISTORY_CHARACTERS} caracteres.`,
      })
    }
  })

const APP_TIME_ZONE = 'America/Fortaleza'

export function buildChatSystem(now = new Date()): string {
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
    'Você ainda não recebeu dados do GitHub ou do projeto local.',
    'Se perguntarem pelo estado atual de um projeto, diga de forma direta que é preciso selecionar um projeto para consultar o repositório e não invente informações.',
    'Para notícias, resultados e outros fatos recentes que não estejam presentes na conversa, diga que não possui uma fonte atualizada em vez de inventar ou afirmar que ainda não aconteceram.',
    'Mostre somente a resposta final; nunca exponha raciocínio interno.',
  ].join(' ')
}

function contextFailureStatus(error: ContextCollectionError): number {
  if (error.code === 'context_source_unsupported') return 400
  if (error.code === 'github_rate_limited') return 429
  if (error.code === 'github_auth_failed') return 503
  return 502
}

export const chatRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/chat',
    { schema: { body: chatBody } },
    async (req, reply) => {
      reply.header('Cache-Control', 'no-store')

      const project = req.body.projectId
        ? await getProject(req.body.projectId)
        : undefined
      if (req.body.projectId && !project) {
        return reply.code(404).send({
          error: {
            code: 'project_not_found',
            message: 'Projeto não encontrado.',
          },
        })
      }

      if (!aiConfigured() || !getAiSettings().configured) {
        return reply.code(503).send({
          error: {
            code: 'ai_not_configured',
            message: 'Conecte o Amazon Bedrock em IA e APIs antes de conversar.',
          },
        })
      }

      try {
        const settings = getAiSettings()
        const contextData = project
          ? await gatherProjectContext(project)
          : null
        const completion = await bedrockClient().chat.completions.create(
          {
            model: settings.model,
            messages: contextData
              ? [
                  { role: 'system', content: buildContextChatSystem() },
                  {
                    role: 'user',
                    content: buildProjectContextPrompt(project!, contextData),
                  },
                  ...req.body.messages,
                ]
              : [
                  { role: 'system', content: buildChatSystem() },
                  ...req.body.messages,
                ],
            max_tokens: contextData ? 1_000 : 800,
          },
          { timeout: AI_TIMEOUT_MS },
        )
        const raw = completion.choices[0]?.message.content ?? ''

        let answer: string
        let suggestedNextAction: string | null
        if (contextData) {
          const parsed = parseContextualResponse(raw)
          if (!parsed) {
            return reply.code(502).send({
              error: {
                code: 'chat_failed',
                message: 'O Kimi respondeu sem conteúdo.',
              },
            })
          }
          answer = parsed.answer
          suggestedNextAction = parsed.suggestedNextAction
        } else {
          answer = cleanAssistantText(raw)
          suggestedNextAction = null
          if (!answer) {
            return reply.code(502).send({
              error: {
                code: 'chat_failed',
                message: 'O Kimi respondeu sem conteúdo.',
              },
            })
          }
        }

        const response: ChatResponse = {
          message: { role: 'assistant', content: answer },
          model: settings.model,
          context: contextData?.context ?? null,
          suggestedNextAction,
        }
        return response
      } catch (error) {
        if (error instanceof ContextCollectionError) {
          req.log.warn(
            { code: error.code },
            'falha ao montar contexto do projeto',
          )
          return reply.code(contextFailureStatus(error)).send({
            error: {
              code: error.code,
              message: error.message,
            },
          })
        }
        req.log.warn({ err: error }, 'falha no chat Context Project')
        return reply.code(502).send({
          error: {
            code: 'chat_failed',
            message:
              'Não foi possível responder agora. Teste a conexão em IA e APIs.',
          },
        })
      }
    },
  )
}
