// Rotas de auth num só handler (login | callback | logout) para caber no limite
// de 12 Serverless Functions do plano Hobby. As URLs são as mesmas:
//   /api/auth/login · /api/auth/callback · /api/auth/logout
import { createHash, randomUUID } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { methodNotAllowed, sendError } from '../_lib/http.js'
import {
  clearLoginFailures,
  getLoginAttempts,
  recordLoginFailure,
} from '../_lib/kv.js'
import {
  baseUrl,
  callbackUrl,
  clearSessionCookie,
  clearStateCookie,
  oauthConfigured,
  readStateCookie,
  setSessionCookie,
  setStateCookie,
} from '../_lib/auth.js'
import {
  clearStudioSessionCookie,
  hasValidStudioSession,
  studioAuthConfigured,
  studioSessionCookie,
  verifyStudioPassword,
} from '../_lib/studioAuth.js'

// OAuth Apps clássicos não têm escopo read-only de repo; `repo` cobre repos
// privados (o app só faz leitura). Quem quiser menos privilégio segue no PAT.
const SCOPE = 'read:user repo'
const LOGIN_ATTEMPT_LIMIT = 5
const LOGIN_ATTEMPT_TTL_SECONDS = 15 * 60

function studioFingerprint(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim() ?? 'unknown'
  return createHash('sha256').update(ip).digest('base64url').slice(0, 32)
}

function studioStatus(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET')
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    configured: studioAuthConfigured(),
    authenticated: hasValidStudioSession(req.headers.cookie),
  })
}

async function studioLogin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST')
  res.setHeader('Cache-Control', 'no-store')
  if (!studioAuthConfigured()) {
    return sendError(
      res,
      503,
      'studio_auth_not_configured',
      'O acesso do Studio ainda não foi configurado.',
    )
  }

  const body = req.body as { password?: unknown } | null
  const password =
    typeof body?.password === 'string' ? body.password : ''
  if (!password || password.length > 256) {
    return sendError(
      res,
      400,
      'invalid_body',
      'Informe uma senha válida.',
    )
  }

  const fingerprint = studioFingerprint(req)
  try {
    const attempts = await getLoginAttempts(fingerprint)
    if (attempts >= LOGIN_ATTEMPT_LIMIT) {
      res.setHeader('Retry-After', String(LOGIN_ATTEMPT_TTL_SECONDS))
      return sendError(
        res,
        429,
        'too_many_attempts',
        'Muitas tentativas. Aguarde 15 minutos e tente novamente.',
      )
    }

    if (!verifyStudioPassword(password)) {
      await recordLoginFailure(fingerprint, LOGIN_ATTEMPT_TTL_SECONDS)
      return sendError(
        res,
        401,
        'invalid_credentials',
        'Senha incorreta.',
      )
    }

    await clearLoginFailures(fingerprint)
    res.setHeader('Set-Cookie', studioSessionCookie())
    res.status(200).json({ ok: true })
  } catch {
    sendError(
      res,
      503,
      'studio_auth_unavailable',
      'Não foi possível validar o acesso agora. Tente novamente.',
    )
  }
}

function studioLogout(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Set-Cookie', clearStudioSessionCookie())
  res.status(200).json({ ok: true })
}

// GET /api/auth/login — inicia o web flow (state anti-CSRF + redirect ao GitHub).
function login(req: VercelRequest, res: VercelResponse): void {
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

// GET /api/auth/callback — valida state, troca code por token, grava a sessão.
async function callback(req: VercelRequest, res: VercelResponse): Promise<void> {
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

// POST /api/auth/logout — limpa a sessão (JSON); GET redireciona pra Home.
function logout(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return methodNotAllowed(res, 'POST, GET')
  }
  clearSessionCookie(res)
  if (req.method === 'GET') {
    res.setHeader('Location', `${baseUrl(req)}/`)
    res.status(302).end()
    return
  }
  res.status(200).json({ ok: true })
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const action = req.query.action
  switch (action) {
    case 'studio-status':
      return studioStatus(req, res)
    case 'studio-login':
      return studioLogin(req, res)
    case 'studio-logout':
      return studioLogout(req, res)
    case 'login':
      return login(req, res)
    case 'callback':
      return callback(req, res)
    case 'logout':
      return logout(req, res)
    default:
      return sendError(res, 404, 'not_found', 'Rota de auth desconhecida.')
  }
}
