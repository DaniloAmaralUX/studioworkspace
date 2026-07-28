import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  getAiSettings,
  saveAiSettings,
  testAiConnection,
} from '../core/aiSettings'

const settingsBody = z.object({
  apiKey: z
    .string()
    .trim()
    .min(20)
    .refine((key) => !key.startsWith('sk-'), {
      message:
        'Use uma API key do Amazon Bedrock, não uma chave da OpenAI Platform.',
    })
    .optional(),
  region: z.string().regex(/^[a-z]{2}-[a-z]+-\d$/),
  projectId: z.string().trim().max(120).optional(),
  model: z.string().trim().min(3).max(160),
})

export const settingsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/api/settings/ai', async () => getAiSettings())

  app.put(
    '/api/settings/ai',
    { schema: { body: settingsBody } },
    async (req) => saveAiSettings(req.body),
  )

  app.post('/api/settings/ai/test', async (req, reply) => {
    if (!getAiSettings().configured) {
      return reply.code(503).send({
        error: {
          code: 'bedrock_not_configured',
          message: 'Salve uma chave do Amazon Bedrock antes de testar.',
        },
      })
    }
    try {
      return await testAiConnection()
    } catch (error) {
      req.log.warn({ err: error }, 'teste de conexão com Bedrock falhou')
      const providerError = error as {
        status?: number
        code?: string
      }
      const invalidKey =
        providerError.status === 401 ||
        providerError.code === 'invalid_api_key'
      return reply.code(502).send({
        error: {
          code: invalidKey ? 'bedrock_invalid_key' : 'bedrock_test_failed',
          message: invalidKey
            ? 'A AWS recusou esta chave. Crie uma API key de longa duração em Amazon Bedrock → API keys e substitua a chave salva.'
            : 'O Bedrock recusou a conexão. Confira região, projeto e acesso ao modelo.',
        },
      })
    }
  })
}
