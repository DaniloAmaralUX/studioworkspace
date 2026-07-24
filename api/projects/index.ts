import type { VercelRequest, VercelResponse } from '@vercel/node'
import { listProjects } from '../_lib/kv.js'
import { internalError, methodNotAllowed } from '../_lib/http.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET')
  try {
    res.status(200).json(await listProjects())
  } catch (err) {
    internalError(res, err)
  }
}
