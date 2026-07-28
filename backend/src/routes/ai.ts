import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getProject } from '../core/projectIndex'
import { aiConfigured, suggestNextAction } from '../core/ai'
import { idParams } from '../lib/schemas'

export const aiRoutes: FastifyPluginAsyncZod = async (app) => {
  // Sugere UMA próxima ação para o projeto, via AI Gateway (README/commits/stack).
  app.post(
    '/api/projects/:id/ai-next-action',
    { schema: { params: idParams } },
    async (req, reply) => {
      const project = await getProject(req.params.id)
      if (!project) {
        return reply
          .code(404)
          .send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
      }
      if (!aiConfigured()) {
        return reply.code(503).send({
          error: {
            code: 'ai_not_configured',
            message:
              'IA não configurada. Abra IA e APIs para conectar o Amazon Bedrock.',
          },
        })
      }
      try {
        const suggestion = await suggestNextAction(project)
        if (!suggestion) {
          return reply.code(502).send({
            error: { code: 'ai_empty', message: 'A IA não retornou uma sugestão.' },
          })
        }
        return { suggestion }
      } catch (err) {
        req.log.error(err)
        return reply.code(502).send({
          error: { code: 'ai_failed', message: 'Falha ao gerar sugestão de IA.' },
        })
      }
    },
  )
}
