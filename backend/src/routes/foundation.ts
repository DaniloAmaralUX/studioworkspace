import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getProject } from '../core/projectIndex'
import {
  designMarkdown,
  readFoundation,
  shadcnCommand,
  writeDesignMd,
  writeFoundation,
} from '../core/foundation'
import { addTemplate, listTemplates, removeTemplate } from '../core/templates'

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

export async function foundationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/projects/:id/foundation', async (req, reply) => {
    const { id } = req.params as { id: string }
    const project = await getProject(id)
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
  })

  app.put('/api/projects/:id/foundation', async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = foundationSchema.safeParse(req.body)
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
          message: 'Foundation só para projeto local (clone o repo antes).',
        },
      })
    }
    await writeFoundation(project.source.path, parsed.data)
    const designPath = await writeDesignMd(
      project.source.path,
      designMarkdown(parsed.data),
    )
    return {
      foundation: parsed.data,
      shadcnCommand: shadcnCommand(parsed.data),
      designPath,
    }
  })

  // Templates — o usuário adiciona manualmente (link do repo); nada é pré-populado.
  app.get('/api/templates', async () => listTemplates())

  app.post('/api/templates', async (req, reply) => {
    const parsed = templateSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: 'invalid_body', message: parsed.error.message } })
    }
    return reply.code(201).send(await addTemplate(parsed.data))
  })

  app.delete('/api/templates/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const ok = await removeTemplate(id)
    if (!ok) {
      return reply
        .code(404)
        .send({ error: { code: 'not_found', message: 'Template não encontrado' } })
    }
    return { ok: true }
  })
}
