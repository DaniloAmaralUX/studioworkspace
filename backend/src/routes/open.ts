import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getProject, setCloneDir } from '../core/projectIndex'
import { detectLaunchers, openTarget } from '../core/launcher'
import { ghClone } from '../core/github'
import { stampProject } from '../core/stamp'
import { WORK_DIR } from '../config'

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
    const targetPath =
      project.source.kind === 'local' ? project.source.path : project.source.cloneDir
    if (!targetPath) {
      return reply.code(409).send({
        error: {
          code: 'needs_clone',
          message: 'Repositório GitHub ainda não foi clonado. Clone antes de abrir.',
        },
      })
    }
    // Carimba o contexto de design antes de abrir num IDE/agente (claude/code/
    // cursor). Para explorer/terminal não escreve nada — ali você só navega.
    // Best-effort: uma falha aqui nunca deve impedir a abertura do projeto.
    let stamped: string[] = []
    const STAMP_ON = new Set(['claude', 'code', 'cursor'])
    if (STAMP_ON.has(parsed.data.with)) {
      try {
        const result = await stampProject(targetPath)
        stamped = result.files
          .filter((f) => f.action !== 'unchanged')
          .map((f) => f.file)
      } catch (err) {
        req.log.warn({ err }, 'stamp antes de abrir falhou (seguindo mesmo assim)')
      }
    }
    try {
      await openTarget(targetPath, parsed.data.with)
      return { ok: true, opened: targetPath, with: parsed.data.with, stamped }
    } catch (err) {
      return reply
        .code(501)
        .send({ error: { code: 'open_failed', message: (err as Error).message } })
    }
  })

  app.post('/api/projects/:id/clone', async (req, reply) => {
    const { id } = req.params as { id: string }
    const project = await getProject(id)
    if (!project) {
      return reply
        .code(404)
        .send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
    }
    if (project.source.kind !== 'github') {
      return reply.code(400).send({
        error: { code: 'not_github', message: 'Só projetos do GitHub podem ser clonados.' },
      })
    }
    if (project.source.cloneDir) {
      return project
    }
    const [owner, repo] = project.source.nameWithOwner.split('/')
    const dest = path.join(WORK_DIR, owner!, repo!)
    try {
      await ghClone(project.source.nameWithOwner, dest)
    } catch (err) {
      return reply
        .code(502)
        .send({ error: { code: 'clone_failed', message: (err as Error).message } })
    }
    const updated = await setCloneDir(id, dest)
    reply.code(201)
    return updated
  })
}
