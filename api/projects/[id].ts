import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import {
  deleteFoundation,
  deleteProject,
  getProject,
  putProject,
} from '../_lib/kv.js'
import { internalError, methodNotAllowed, sendError } from '../_lib/http.js'
import type { Project } from '../_lib/types.js'

// Mesmo patchSchema do backend desktop (routes/projects.ts).
const patchSchema = z.object({
  name: z.string().min(1).optional(),
  status: z
    .enum(['planning', 'building', 'review', 'blocked', 'done'])
    .optional(),
  nextAction: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const id = req.query.id
  if (typeof id !== 'string' || !id) {
    return sendError(res, 400, 'invalid_id', 'id inválido')
  }
  try {
    if (req.method === 'PATCH') {
      const parsed = patchSchema.safeParse(req.body)
      if (!parsed.success) {
        return sendError(res, 400, 'invalid_body', parsed.error.message)
      }
      const current = await getProject(id)
      if (!current) {
        return sendError(res, 404, 'not_found', 'Projeto não encontrado')
      }
      const updated: Project = {
        ...current,
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      }
      await putProject(updated)
      res.status(200).json(updated)
      return
    }
    if (req.method === 'DELETE') {
      const ok = await deleteProject(id)
      if (!ok) {
        return sendError(res, 404, 'not_found', 'Projeto não encontrado')
      }
      // Remover do hub também descarta a foundation associada (best-effort).
      await deleteFoundation(id).catch(() => {})
      res.status(200).json({ ok: true })
      return
    }
    methodNotAllowed(res, 'PATCH, DELETE')
  } catch (err) {
    internalError(res, err)
  }
}
