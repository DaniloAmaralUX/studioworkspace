import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { loadProjects, patchProject, removeProject } from '../core/projectIndex'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  status: z
    .enum(['planning', 'building', 'review', 'blocked', 'done'])
    .optional(),
  nextAction: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/projects', async () => {
    return await loadProjects()
  })

  app.patch('/api/projects/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = patchSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: 'invalid_body', message: parsed.error.message } })
    }
    const updated = await patchProject(id, parsed.data)
    if (!updated) {
      return reply
        .code(404)
        .send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
    }
    return updated
  })

  app.delete('/api/projects/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const ok = await removeProject(id)
    if (!ok) {
      return reply
        .code(404)
        .send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
    }
    return { ok: true }
  })
}
