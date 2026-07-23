import type { FastifyInstance } from 'fastify'
import { getProject } from '../core/projectIndex'
import { stampProject } from '../core/stamp'

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

export async function stampRoutes(app: FastifyInstance): Promise<void> {
  // Carimba o contexto de design (AGENTS.md, CLAUDE.md, regras Cursor/Copilot,
  // configs MCP) no projeto — para qualquer IDE/agente ler.
  app.post('/api/projects/:id/stamp', async (req, reply) => {
    const { id } = req.params as { id: string }
    const project = await getProject(id)
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
  })
}
