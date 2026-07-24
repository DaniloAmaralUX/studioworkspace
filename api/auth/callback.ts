// GET /api/auth/callback — recebe o `code` do GitHub, valida o `state`, troca o
// code por access token e grava a sessão num cookie httpOnly. Redireciona pra Home.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { methodNotAllowed, sendError } from '../_lib/http.js'
import {
  baseUrl,
  callbackUrl,
  clearStateCookie,
  oauthConfigured,
  readStateCookie,
  setSessionCookie,
} from '../_lib/auth.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET')
  if (!oauthConfigured()) {
    return sendError(res, 503, 'oauth_not_configured', 'OAuth não configurado.')
  }

  const code = typeof req.query.code === 'string' ? req.query.code : ''
  const state = typeof req.query.state === 'string' ? req.query.state : ''
  const expected = readStateCookie(req)
  clearStateCookie(res)

  if (req.query.error) {
    return sendError(
      res,
      400,
      'oauth_denied',
      String(req.query.error_description ?? req.query.error),
    )
  }
  if (!code || !state || !expected || state !== expected) {
    return sendError(
      res,
      400,
      'oauth_state_mismatch',
      'Falha na verificação do login (state inválido). Tente entrar de novo.',
    )
  }

  try {
    const tokenRes = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'project-studio-cloud',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
          client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
          code,
          redirect_uri: callbackUrl(req),
        }),
      },
    )
    const data = (await tokenRes.json().catch(() => null)) as {
      access_token?: string
      error?: string
      error_description?: string
    } | null

    if (!data?.access_token) {
      return sendError(
        res,
        502,
        'oauth_exchange_failed',
        data?.error_description ?? 'GitHub não devolveu um token de acesso.',
      )
    }

    setSessionCookie(res, data.access_token)
    res.setHeader('Location', `${baseUrl(req)}/?connected=github`)
    res.status(302).end()
  } catch (err) {
    sendError(
      res,
      502,
      'oauth_exchange_failed',
      err instanceof Error ? err.message : 'Falha ao trocar o code por token.',
    )
  }
}
