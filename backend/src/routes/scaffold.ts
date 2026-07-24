import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { scaffoldProject, ScaffoldError } from '../core/scaffold'

const schema = z.object({
  name: z.string().min(1),
  parentDir: z.string().min(1),
  templateRepoUrl: z.string().optional(),
})

export const scaffoldRoutes: FastifyPluginAsyncZod = async (app) => {
  // Cria um projeto novo já no padrão do usuário (template + carimbo).
  app.post(
    '/api/projects/scaffold',
    { schema: { body: schema } },
    async (req, reply) => {
      try {
        const result = await scaffoldProject(req.body)
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
    },
  )
}
