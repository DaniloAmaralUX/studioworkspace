import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { addProject, findBySource } from '../core/projectIndex'
import { ghAuthOk, ghRepoList, ghRepoView } from '../core/github'

const addSchema = z.object({ nameWithOwner: z.string().min(1) })

export const githubRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/api/github/status', async () => {
    return { authed: await ghAuthOk() }
  })

  app.get('/api/github/repos', async (_req, reply) => {
    try {
      return await ghRepoList(100)
    } catch {
      return reply.code(503).send({
        error: {
          code: 'gh_failed',
          message: 'Não consegui listar repos via gh. Confira `gh auth status`.',
        },
      })
    }
  })

  // Adiciona um repo do GitHub ao hub (metadados via gh; sem clone — clone é sob demanda ao abrir).
  app.post(
    '/api/projects/github',
    { schema: { body: addSchema } },
    async (req, reply) => {
      const { nameWithOwner } = req.body
      const source = { kind: 'github', nameWithOwner } as const
      if (await findBySource(source)) {
        return reply
          .code(409)
          .send({ error: { code: 'duplicate', message: 'Esse repo já está no hub.' } })
      }
      try {
        const repo = await ghRepoView(nameWithOwner)
        const project = await addProject({
          name: nameWithOwner.split('/')[1] ?? nameWithOwner,
          source,
          stack: repo.primaryLanguage ? [repo.primaryLanguage.toLowerCase()] : [],
          lastActivityAt: repo.pushedAt ?? undefined,
        })
        return reply.code(201).send(project)
      } catch {
        return reply.code(503).send({
          error: { code: 'gh_failed', message: 'Não consegui buscar o repo via gh.' },
        })
      }
    },
  )
}
