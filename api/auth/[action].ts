// Login próprio do Studio Cloud. As três ações ficam em um único handler para
// respeitar o limite de Functions do plano Hobby:
//   /api/auth/studio-status
//   /api/auth/studio-login
//   /api/auth/studio-logout
import { createHash } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  methodNotAllowed,
  noStore,
  sendError,
} from '../_lib/http.js'
import {
  clearLoginFailures,
  getLoginAttempts,
  recordLoginFailure,
} from '../_lib/kv.js'
import {
  clearStudioSessionCookie,
  hasValidStudioSession,
  studioAuthConfigured,
  studioSessionCookie,
  verifyStudioPassword,
} from '../_lib/studioAuth.js'

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
  if (!studioAuthConfigured()) {
    return sendError(
      res,
      503,
      'studio_auth_not_configured',
      'O acesso do Studio ainda não está disponível.',
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
        'Credenciais inválidas.',
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
  res.setHeader('Set-Cookie', clearStudioSessionCookie())
  res.status(200).json({ ok: true })
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  noStore(res)

  const action = req.query.action
  switch (action) {
    case 'studio-status':
      return studioStatus(req, res)
    case 'studio-login':
      return studioLogin(req, res)
    case 'studio-logout':
      return studioLogout(req, res)
    default:
      return sendError(res, 404, 'not_found', 'Rota de autenticação inexistente.')
  }
}
