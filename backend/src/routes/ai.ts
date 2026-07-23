import type { FastifyInstance } from 'fastify'
import { getProject } from '../core/projectIndex'
import { aiConfigured, suggestNextAction } from '../core/ai'

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  // Sugere UMA próxima ação para o projeto, via AI Gateway (README/commits/stack).
  app.post('/api/projects/:id/ai-next-action', async (req, reply) => {
    const { id } = req.params as { id: string }
    const project = await getProject(id)
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
            'IA não configurada. Defina AI_GATEWAY_API_KEY em backend/.env para usar.',
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
  })
}
