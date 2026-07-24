// POST /api/projects/github — adiciona um repo GitHub ao hub (mesmo contrato do
// desktop). Metadados via API do GitHub (Fatia 2): última atividade e linguagem
// principal. Se o GitHub falhar, o projeto entra mesmo assim com o essencial.
import { randomUUID } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { findBySource, putProject } from '../_lib/kv.js'
import { internalError, methodNotAllowed, sendError } from '../_lib/http.js'
import { repoView } from '../_lib/github.js'
import type { Project } from '../_lib/types.js'

const addSchema = z.object({
  nameWithOwner: z
    .string()
    .min(1)
    .regex(/^[^/\s]+\/[^/\s]+$/, 'Formato esperado: owner/repo'),
})

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST')
  const parsed = addSchema.safeParse(req.body)
  if (!parsed.success) {
    return sendError(res, 400, 'invalid_body', parsed.error.message)
  }
  const { nameWithOwner } = parsed.data
  const source = { kind: 'github', nameWithOwner } as const
  try {
    if (await findBySource(source)) {
      return sendError(res, 409, 'duplicate', 'Esse repo já está no hub.')
    }
    // Metadados best-effort — indisponibilidade do GitHub não bloqueia o add.
    let lastActivityAt: string | undefined
    let stack: string[] = []
    try {
      const meta = await repoView(nameWithOwner)
      lastActivityAt = meta.pushedAt ?? undefined
      if (meta.primaryLanguage) stack = [meta.primaryLanguage.toLowerCase()]
    } catch {
      /* segue sem metadados */
    }
    const now = new Date().toISOString()
    const project: Project = {
      id: randomUUID(),
      name: nameWithOwner.split('/')[1] ?? nameWithOwner,
      source,
      status: 'planning',
      tags: [],
      stack,
      lastActivityAt,
      createdAt: now,
      updatedAt: now,
    }
    await putProject(project)
    res.status(201).json(project)
  } catch (err) {
    internalError(res, err)
  }
}
