import { randomUUID } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { listTemplates, putTemplate } from '../_lib/kv.js'
import { internalError, methodNotAllowed, sendError } from '../_lib/http.js'
import type { Template } from '../_lib/types.js'

const addSchema = z.object({
  name: z.string().min(1),
  repoUrl: z.string().min(1),
  description: z.string().optional(),
})

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    if (req.method === 'GET') {
      res.status(200).json(await listTemplates())
      return
    }
    if (req.method === 'POST') {
      const parsed = addSchema.safeParse(req.body)
      if (!parsed.success) {
        return sendError(res, 400, 'invalid_body', parsed.error.message)
      }
      const template: Template = {
        id: randomUUID(),
        ...parsed.data,
        createdAt: new Date().toISOString(),
      }
      await putTemplate(template)
      res.status(201).json(template)
      return
    }
    methodNotAllowed(res, 'GET, POST')
  } catch (err) {
    internalError(res, err)
  }
}
