import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getProject } from '../core/projectIndex'
import { stampProject } from '../core/stamp'
import { idParams } from '../lib/schemas'

// Resolve a pasta em disco de um projeto (local: path; github: cloneDir).
export function projectDir(project: {
  source:
    | { kind: 'local'; path: string }
    | { kind: 'github'; nameWithOwner: string; cloneDir?: string }
}): string | null {
  return project.source.kind === 'local'
    ? project.source.path
    : project.source.cloneDir ?? null
}

export const stampRoutes: FastifyPluginAsyncZod = async (app) => {
  // Carimba o contexto de design (AGENTS.md, CLAUDE.md, regras Cursor/Copilot,
  // configs MCP) no projeto — para qualquer IDE/agente ler.
  app.post(
    '/api/projects/:id/stamp',
    { schema: { params: idParams } },
    async (req, reply) => {
      const project = await getProject(req.params.id)
      if (!project) {
        return reply
          .code(404)
          .send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
      }
      const dir = projectDir(project)
      if (!dir) {
        return reply.code(409).send({
          error: {
            code: 'needs_clone',
            message:
              'Repositório GitHub ainda não foi clonado. Clone antes de carimbar.',
          },
        })
      }
      try {
        const result = await stampProject(dir)
        return result
      } catch (err) {
        req.log.error(err)
        return reply
          .code(500)
          .send({ error: { code: 'stamp_failed', message: (err as Error).message } })
      }
    },
  )
}
