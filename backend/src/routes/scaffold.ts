import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { scaffoldProject, ScaffoldError } from '../core/scaffold'

const schema = z.object({
  name: z.string().min(1),
  parentDir: z.string().min(1),
  templateRepoUrl: z.string().optional(),
})

export async function scaffoldRoutes(app: FastifyInstance): Promise<void> {
  // Cria um projeto novo já no padrão do usuário (template + carimbo).
  app.post('/api/projects/scaffold', async (req, reply) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: 'invalid_body', message: parsed.error.message } })
    }
    try {
      const result = await scaffoldProject(parsed.data)
      return reply.code(201).send(result)
    } catch (err) {
      if (err instanceof ScaffoldError) {
        const status = err.code === 'clone_failed' ? 502 : 400
        return reply.code(status).send({ error: { code: err.code, message: err.message } })
      }
      req.log.error(err)
      return reply
        .code(500)
        .send({ error: { code: 'scaffold_failed', message: (err as Error).message } })
    }
  })
}
