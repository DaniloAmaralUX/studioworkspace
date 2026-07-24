import path from 'node:path'
import { promises as fs } from 'node:fs'
import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
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
import { idParams } from '../lib/schemas'

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

export const projectRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/api/projects', async () => {
    return await loadProjects()
  })

  // Associa uma pasta local (não copia/move nada).
  app.post(
    '/api/projects/local',
    { schema: { body: localSchema } },
    async (req, reply) => {
      const abs = path.resolve(req.body.path)
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
      const name = req.body.name?.trim() || path.basename(abs)
      const project = await addProject({ name, source, stack })
      return reply.code(201).send(project)
    },
  )

  app.patch(
    '/api/projects/:id',
    { schema: { params: idParams, body: patchSchema } },
    async (req, reply) => {
      const updated = await patchProject(req.params.id, req.body)
      if (!updated) {
        return reply
          .code(404)
          .send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
      }
      return updated
    },
  )

  app.delete(
    '/api/projects/:id',
    { schema: { params: idParams } },
    async (req, reply) => {
      const ok = await removeProject(req.params.id)
      if (!ok) {
        return reply
          .code(404)
          .send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
      }
      return { ok: true }
    },
  )

  // Lente "Engineering": status git da pasta local.
  app.get(
    '/api/projects/:id/git',
    { schema: { params: idParams } },
    async (req, reply) => {
      const project = await getProject(req.params.id)
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
    },
  )
}
