import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getProject } from '../core/projectIndex'
import {
  designMarkdown,
  readFoundation,
  shadcnCommand,
  writeDesignMd,
  writeFoundation,
} from '../core/foundation'
import { addTemplate, listTemplates, removeTemplate } from '../core/templates'
import { idParams } from '../lib/schemas'

const foundationSchema = z.object({
  framework: z.string().min(1),
  baseColor: z.string().min(1),
  theme: z.string().min(1),
  font: z.string().min(1),
  radius: z.string().min(1),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  iconLibrary: z.string().min(1),
})

const templateSchema = z.object({
  name: z.string().min(1),
  repoUrl: z.string().min(1),
  description: z.string().optional(),
})

export const foundationRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/projects/:id/foundation',
    { schema: { params: idParams } },
    async (req, reply) => {
      const project = await getProject(req.params.id)
      if (!project) {
        return reply
          .code(404)
          .send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
      }
      if (project.source.kind !== 'local') {
        return { foundation: null, shadcnCommand: null }
      }
      const foundation = await readFoundation(project.source.path)
      return {
        foundation,
        shadcnCommand: foundation ? shadcnCommand(foundation) : null,
      }
    },
  )

  app.put(
    '/api/projects/:id/foundation',
    { schema: { params: idParams, body: foundationSchema } },
    async (req, reply) => {
      const project = await getProject(req.params.id)
      if (!project) {
        return reply
          .code(404)
          .send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
      }
      if (project.source.kind !== 'local') {
        return reply.code(400).send({
          error: {
            code: 'not_local',
            message: 'Foundation só para projeto local (clone o repo antes).',
          },
        })
      }
      await writeFoundation(project.source.path, req.body)
      const designPath = await writeDesignMd(
        project.source.path,
        designMarkdown(req.body),
      )
      return {
        foundation: req.body,
        shadcnCommand: shadcnCommand(req.body),
        designPath,
      }
    },
  )

  // Templates — o usuário adiciona manualmente (link do repo); nada é pré-populado.
  app.get('/api/templates', async () => listTemplates())

  app.post(
    '/api/templates',
    { schema: { body: templateSchema } },
    async (req, reply) => {
      return reply.code(201).send(await addTemplate(req.body))
    },
  )

  app.delete(
    '/api/templates/:id',
    { schema: { params: idParams } },
    async (req, reply) => {
      const ok = await removeTemplate(req.params.id)
      if (!ok) {
        return reply
          .code(404)
          .send({ error: { code: 'not_found', message: 'Template não encontrado' } })
      }
      return { ok: true }
    },
  )
}
