// GET /api/auth/login — inicia o OAuth web flow do GitHub.
// Gera um `state` anti-CSRF (guardado em cookie httpOnly curto) e redireciona
// para a tela de autorização do GitHub.
import { randomUUID } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { methodNotAllowed, sendError } from '../_lib/http.js'
import { callbackUrl, oauthConfigured, setStateCookie } from '../_lib/auth.js'

// OAuth Apps clássicos não têm escopo read-only de repo; `repo` cobre repos
// privados (o app só faz leitura). Quem quiser menos privilégio segue no PAT.
const SCOPE = 'read:user repo'

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET')
  if (!oauthConfigured()) {
    return sendError(
      res,
      503,
      'oauth_not_configured',
      'OAuth não configurado: defina GITHUB_OAUTH_CLIENT_ID e _SECRET na Vercel.',
    )
  }
  const state = randomUUID()
  setStateCookie(res, state)

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_OAUTH_CLIENT_ID as string,
    redirect_uri: callbackUrl(req),
    scope: SCOPE,
    state,
    allow_signup: 'false',
  })
  res.setHeader('Location', `https://github.com/login/oauth/authorize?${params}`)
  res.status(302).end()
}
