import path from 'node:path'
import { promises as fs } from 'node:fs'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  addProject,
  findBySource,
  getProject,
  loadProjects,
  patchProject,
  removeProject,
} from '../core/projectIndex'
import { detectStack } from '../core/stackDetect'
import { gitInfo } from '../core/git'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  status: z
    .enum(['planning', 'building', 'review', 'blocked', 'done'])
    .optional(),
  nextAction: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

const localSchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1).optional(),
})

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/projects', async () => {
    return await loadProjects()
  })

  // Associa uma pasta local (não copia/move nada).
  app.post('/api/projects/local', async (req, reply) => {
    const parsed = localSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: 'invalid_body', message: parsed.error.message } })
    }
    const abs = path.resolve(parsed.data.path)
    const stat = await fs.stat(abs).catch(() => null)
    if (!stat || !stat.isDirectory()) {
      return reply.code(400).send({
        error: { code: 'not_a_dir', message: 'Caminho não é uma pasta existente.' },
      })
    }
    const source = { kind: 'local', path: abs } as const
    if (await findBySource(source)) {
      return reply
        .code(409)
        .send({ error: { code: 'duplicate', message: 'Essa pasta já está no hub.' } })
    }
    const stack = await detectStack(abs)
    const name = parsed.data.name?.trim() || path.basename(abs)
    const project = await addProject({ name, source, stack })
    return reply.code(201).send(project)
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

  // Lente "Engineering": status git da pasta local.
  app.get('/api/projects/:id/git', async (req, reply) => {
    const { id } = req.params as { id: string }
    const project = await getProject(id)
    if (!project) {
      return reply
        .code(404)
        .send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
    }
    const target =
      project.source.kind === 'local' ? project.source.path : project.source.cloneDir
    if (!target) {
      return { isRepo: false, reason: 'github-not-cloned' }
    }
    return await gitInfo(target)
  })
}
