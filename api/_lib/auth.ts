// Sessão OAuth do Studio Cloud. O token de acesso do GitHub vive só num cookie
// httpOnly (nunca em KV, log ou código — regra de ouro nº 2). Se não houver
// sessão, cai no PAT (GITHUB_TOKEN) — assim o site nunca quebra durante a troca.
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const SESSION_COOKIE = 'gh_session'
export const STATE_COOKIE = 'gh_oauth_state'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias
const STATE_MAX_AGE = 60 * 10 // 10 min

export function oauthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET,
  )
}

function parseCookies(req: VercelRequest): Record<string, string> {
  const header = req.headers.cookie
  if (!header) return {}
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    if (k) out[k] = decodeURIComponent(v)
  }
  return out
}

/** Token da sessão OAuth (cookie), se houver. */
export function readSessionToken(req: VercelRequest): string | null {
  return parseCookies(req)[SESSION_COOKIE] ?? null
}

export function readStateCookie(req: VercelRequest): string | null {
  return parseCookies(req)[STATE_COOKIE] ?? null
}

/** Como o request está autenticado: sessão OAuth, PAT de env, ou nada. */
export function authVia(req: VercelRequest): 'oauth' | 'pat' | null {
  if (readSessionToken(req)) return 'oauth'
  if (process.env.GITHUB_TOKEN) return 'pat'
  return null
}

/** Token efetivo a usar nas chamadas ao GitHub: sessão tem prioridade sobre o PAT. */
export function resolveGithubToken(req: VercelRequest): string | null {
  return readSessionToken(req) ?? process.env.GITHUB_TOKEN ?? null
}

/** Base URL da request (adapta a qualquer domínio do projeto na Vercel). */
export function baseUrl(req: VercelRequest): string {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https'
  const host = (req.headers['x-forwarded-host'] as string) ?? req.headers.host
  return `${proto}://${host}`
}

export function callbackUrl(req: VercelRequest): string {
  return `${baseUrl(req)}/api/auth/callback`
}

function serializeCookie(
  name: string,
  value: string,
  maxAge: number,
): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ].join('; ')
}

function appendCookie(res: VercelResponse, cookie: string): void {
  const prev = res.getHeader('Set-Cookie')
  if (!prev) res.setHeader('Set-Cookie', cookie)
  else if (Array.isArray(prev)) res.setHeader('Set-Cookie', [...prev, cookie])
  else res.setHeader('Set-Cookie', [String(prev), cookie])
}

export function setSessionCookie(res: VercelResponse, token: string): void {
  appendCookie(res, serializeCookie(SESSION_COOKIE, token, SESSION_MAX_AGE))
}

export function clearSessionCookie(res: VercelResponse): void {
  appendCookie(res, serializeCookie(SESSION_COOKIE, '', 0))
}

export function setStateCookie(res: VercelResponse, state: string): void {
  appendCookie(res, serializeCookie(STATE_COOKIE, state, STATE_MAX_AGE))
}

export function clearStateCookie(res: VercelResponse): void {
  appendCookie(res, serializeCookie(STATE_COOKIE, '', 0))
}
