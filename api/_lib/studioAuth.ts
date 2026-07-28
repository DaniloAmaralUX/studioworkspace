import {
  createHmac,
  pbkdf2Sync,
  timingSafeEqual,
} from 'node:crypto'

export const STUDIO_SESSION_COOKIE = '__Host-studio_session'
export const STUDIO_SESSION_MAX_AGE = 60 * 60 * 24 * 7

const PASSWORD_SCHEME = 'pbkdf2-sha256'

export function studioAuthConfigured(): boolean {
  return Boolean(
    process.env.STUDIO_ACCESS_PASSWORD_HASH &&
      process.env.STUDIO_SESSION_SECRET,
  )
}

function parseCookies(header: string | null | undefined): Record<string, string> {
  if (!header) return {}
  const cookies: Record<string, string> = {}
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    const key = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (key) cookies[key] = decodeURIComponent(value)
  }
  return cookies
}

function signatureFor(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function sameText(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

export function createStudioSessionToken(
  secret: string,
  now = Date.now(),
): string {
  const expiresAt = now + STUDIO_SESSION_MAX_AGE * 1_000
  const payload = Buffer.from(`v1:${expiresAt}`).toString('base64url')
  return `${payload}.${signatureFor(payload, secret)}`
}

export function verifyStudioSessionToken(
  token: string,
  secret: string,
  now = Date.now(),
): boolean {
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra) return false
  if (!sameText(signature, signatureFor(payload, secret))) return false

  let decoded = ''
  try {
    decoded = Buffer.from(payload, 'base64url').toString('utf8')
  } catch {
    return false
  }
  const match = /^v1:(\d+)$/.exec(decoded)
  if (!match) return false
  const expiresAt = Number(match[1])
  return Number.isSafeInteger(expiresAt) && expiresAt > now
}

export function readStudioSession(
  cookieHeader: string | null | undefined,
): string | null {
  return parseCookies(cookieHeader)[STUDIO_SESSION_COOKIE] ?? null
}

export function hasValidStudioSession(
  cookieHeader: string | null | undefined,
): boolean {
  const secret = process.env.STUDIO_SESSION_SECRET
  const token = readStudioSession(cookieHeader)
  return Boolean(
    secret && token && verifyStudioSessionToken(token, secret),
  )
}

export function verifyStudioPassword(password: string): boolean {
  const stored = process.env.STUDIO_ACCESS_PASSWORD_HASH
  if (!stored) return false
  const [scheme, iterationsRaw, salt, expected, extra] = stored.split('$')
  const iterations = Number(iterationsRaw)
  if (
    scheme !== PASSWORD_SCHEME ||
    !Number.isSafeInteger(iterations) ||
    iterations < 100_000 ||
    !salt ||
    !expected ||
    extra
  ) {
    return false
  }

  try {
    const derived = pbkdf2Sync(
      password,
      Buffer.from(salt, 'base64url'),
      iterations,
      32,
      'sha256',
    ).toString('base64url')
    return sameText(derived, expected)
  } catch {
    return false
  }
}

function serializeCookie(value: string, maxAge: number): string {
  return [
    `${STUDIO_SESSION_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ].join('; ')
}

export function studioSessionCookie(): string {
  const secret = process.env.STUDIO_SESSION_SECRET
  if (!secret) throw new Error('STUDIO_SESSION_SECRET não configurado.')
  return serializeCookie(
    createStudioSessionToken(secret),
    STUDIO_SESSION_MAX_AGE,
  )
}

export function clearStudioSessionCookie(): string {
  return serializeCookie('', 0)
}
