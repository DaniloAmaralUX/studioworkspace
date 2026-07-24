import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { getFoundation, getProject, putFoundation } from '../../_lib/kv.js'
import { internalError, methodNotAllowed, sendError } from '../../_lib/http.js'
import type { Foundation } from '../../_lib/types.js'

// Mesmo contrato do desktop (routes/foundation.ts); sem working tree na nuvem,
// a foundation vive no KV e designPath é sempre null.
const foundationSchema = z.object({
  framework: z.string().min(1),
  baseColor: z.string().min(1),
  theme: z.string().min(1),
  font: z.string().min(1),
  radius: z.string().min(1),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  iconLibrary: z.string().min(1),
})

function shadcnCommand(f: Foundation): string {
  return `npx shadcn@latest init -b ${f.baseColor}`
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const id = req.query.id
  if (typeof id !== 'string' || !id) {
    return sendError(res, 400, 'invalid_id', 'id inválido')
  }
  try {
    const project = await getProject(id)
    if (!project) {
      return sendError(res, 404, 'not_found', 'Projeto não encontrado')
    }
    if (req.method === 'GET') {
      const foundation = await getFoundation(id)
      res.status(200).json({
        foundation,
        shadcnCommand: foundation ? shadcnCommand(foundation) : null,
      })
      return
    }
    if (req.method === 'PUT') {
      const parsed = foundationSchema.safeParse(req.body)
      if (!parsed.success) {
        return sendError(res, 400, 'invalid_body', parsed.error.message)
      }
      await putFoundation(id, parsed.data)
      res.status(200).json({
        foundation: parsed.data,
        shadcnCommand: shadcnCommand(parsed.data),
        designPath: null,
      })
      return
    }
    methodNotAllowed(res, 'GET, PUT')
  } catch (err) {
    internalError(res, err)
  }
}
