import type { VercelRequest, VercelResponse } from '@vercel/node'
import { deleteTemplate } from '../_lib/kv.js'
import { internalError, methodNotAllowed, sendError } from '../_lib/http.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'DELETE') return methodNotAllowed(res, 'DELETE')
  const id = req.query.id
  if (typeof id !== 'string' || !id) {
    return sendError(res, 400, 'invalid_id', 'id inválido')
  }
  try {
    const ok = await deleteTemplate(id)
    if (!ok) return sendError(res, 404, 'not_found', 'Template não encontrado')
    res.status(200).json({ ok: true })
  } catch (err) {
    internalError(res, err)
  }
}
