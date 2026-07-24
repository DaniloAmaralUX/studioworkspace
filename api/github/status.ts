// GET /api/github/status — como o request está autenticado (sessão OAuth ou PAT),
// a qual login, e se o OAuth está disponível (pro frontend mostrar "Entrar").
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { methodNotAllowed } from '../_lib/http.js'
import { viewer, GithubError } from '../_lib/github.js'
import { authVia, oauthConfigured, resolveGithubToken } from '../_lib/auth.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET')
  const oauthAvailable = oauthConfigured()
  const via = authVia(req)
  const token = resolveGithubToken(req)

  if (!token) {
    res.status(200).json({ authed: false, via: null, oauthAvailable })
    return
  }
  try {
    const { login } = await viewer(token)
    res.status(200).json({ authed: true, via, login, oauthAvailable })
  } catch (err) {
    const message =
      err instanceof GithubError ? err.message : 'Falha ao validar a credencial.'
    res.status(200).json({ authed: false, via, oauthAvailable, error: message })
  }
}
