// GET /api/github/repos — lista os repos do dono do token (espelha o contrato
// do desktop, que usa `gh repo list`). Alimenta a aba GitHub do "+ Projeto".
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { internalError, methodNotAllowed, sendError } from '../_lib/http.js'
import { repoList, GithubError } from '../_lib/github.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET')
  try {
    res.status(200).json(await repoList())
  } catch (err) {
    if (err instanceof GithubError) {
      return sendError(res, err.status === 503 ? 503 : 502, 'github_error', err.message)
    }
    internalError(res, err)
  }
}
