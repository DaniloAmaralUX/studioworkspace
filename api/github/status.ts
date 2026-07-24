// GET /api/github/status — mesmo contrato do desktop ({ authed }), com extras
// de diagnóstico: se o token está presente e a qual login pertence.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { methodNotAllowed } from '../_lib/http.js'
import { tokenPresent, viewer, GithubError } from '../_lib/github.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET')
  if (!tokenPresent()) {
    res.status(200).json({ authed: false, tokenPresent: false })
    return
  }
  try {
    const { login } = await viewer()
    res.status(200).json({ authed: true, tokenPresent: true, login })
  } catch (err) {
    const message =
      err instanceof GithubError ? err.message : 'Falha ao validar o token.'
    res.status(200).json({ authed: false, tokenPresent: true, error: message })
  }
}
