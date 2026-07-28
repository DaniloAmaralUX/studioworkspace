import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { aiConfigured } from '../core/ai'
import { bedrockClient, getAiSettings } from '../core/aiSettings'
import { cleanAssistantText } from '../core/aiText'

const chatMessage = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(4_000),
})

const chatBody = z.object({
  messages: z.array(chatMessage).min(1).max(24),
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
    'Se perguntarem pelo estado atual de um projeto, diga de forma direta que a leitura do repositório será conectada na próxima versão e não invente informações.',
    'Para notícias, resultados e outros fatos recentes que não estejam presentes na conversa, diga que não possui uma fonte atualizada em vez de inventar ou afirmar que ainda não aconteceram.',
    'Mostre somente a resposta final; nunca exponha raciocínio interno.',
  ].join(' ')
}

export const chatRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/chat',
    { schema: { body: chatBody } },
    async (req, reply) => {
      if (!aiConfigured() || !getAiSettings().configured) {
        return reply.code(503).send({
          error: {
            code: 'ai_not_configured',
            message:
              'Conecte o Amazon Bedrock em IA e APIs antes de conversar.',
          },
        })
      }

      try {
        const settings = getAiSettings()
        const completion = await bedrockClient().chat.completions.create({
          model: settings.model,
          messages: [
            { role: 'system', content: buildChatSystem() },
            ...req.body.messages,
          ],
          max_tokens: 800,
        })
        const content = cleanAssistantText(
          completion.choices[0]?.message.content ?? '',
        )
        if (!content) {
          return reply.code(502).send({
            error: {
              code: 'chat_empty',
              message: 'O Kimi respondeu sem conteúdo.',
            },
          })
        }
        return {
          message: { role: 'assistant' as const, content },
          model: settings.model,
        }
      } catch (error) {
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
