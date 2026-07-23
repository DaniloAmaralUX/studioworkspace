import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getProject } from '../core/projectIndex'
import { detectLaunchers, openTarget } from '../core/launcher'

const openSchema = z.object({
  with: z.enum(['explorer', 'terminal', 'claude', 'code', 'cursor']),
})

export async function openRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/launchers', async () => {
    return await detectLaunchers()
  })

  app.post('/api/projects/:id/open', async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = openSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: 'invalid_body', message: parsed.error.message } })
    }
    const project = await getProject(id)
    if (!project) {
      return reply
        .code(404)
        .send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
    }
    if (project.source.kind !== 'local') {
      return reply.code(400).send({
        error: {
          code: 'not_local',
          message: 'Abrir projeto do GitHub (clone sob demanda) chega na Fatia 3.',
        },
      })
    }
    try {
      await openTarget(project.source.path, parsed.data.with)
      return { ok: true, opened: project.source.path, with: parsed.data.with }
    } catch (err) {
      return reply
        .code(501)
        .send({ error: { code: 'open_failed', message: (err as Error).message } })
    }
  })
}
