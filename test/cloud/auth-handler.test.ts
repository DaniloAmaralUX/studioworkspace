import { pbkdf2Sync } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRequest, createResponse } from './vercel-response.js'

const kvMocks = vi.hoisted(() => ({
  clearLoginFailures: vi.fn(),
  getLoginAttempts: vi.fn(),
  recordLoginFailure: vi.fn(),
}))

vi.mock('../../api/_lib/kv.js', () => kvMocks)

import handler from '../../api/auth/[action].js'

const PASSWORD = 'uma-senha-forte'
const SESSION_SECRET = 'segredo-de-assinatura-do-studio'

function passwordHash(password = PASSWORD): string {
  const iterations = 100_000
  const salt = Buffer.from('r0-cloud-test-salt').toString('base64url')
  const expected = pbkdf2Sync(
    password,
    Buffer.from(salt, 'base64url'),
    iterations,
    32,
    'sha256',
  ).toString('base64url')
  return `pbkdf2-sha256$${iterations}$${salt}$${expected}`
}

function configureStudio(): void {
  vi.stubEnv('STUDIO_ACCESS_PASSWORD_HASH', passwordHash())
  vi.stubEnv('STUDIO_SESSION_SECRET', SESSION_SECRET)
}

describe('Studio Cloud auth handler', () => {
  beforeEach(() => {
    kvMocks.getLoginAttempts.mockResolvedValue(0)
    kvMocks.recordLoginFailure.mockResolvedValue(1)
    kvMocks.clearLoginFailures.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('cria somente o cookie seguro do Studio após login válido', async () => {
    configureStudio()
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'POST',
        query: { action: 'studio-login' },
        headers: { 'x-forwarded-for': '203.0.113.8' },
        body: { password: PASSWORD },
      }),
      res,
    )

    expect(captured.statusCode).toBe(200)
    expect(captured.body).toEqual({ ok: true })
    expect(captured.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
    expect(captured.headers.get('set-cookie')).toEqual(
      expect.stringContaining('__Host-studio_session='),
    )
    expect(captured.headers.get('set-cookie')).toEqual(
      expect.stringContaining('HttpOnly; Secure; SameSite=Strict'),
    )
    expect(String(captured.headers.get('set-cookie'))).not.toContain(PASSWORD)
    expect(kvMocks.clearLoginFailures).toHaveBeenCalledOnce()
  })

  it('registra falha e devolve mensagem genérica para senha inválida', async () => {
    configureStudio()
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'POST',
        query: { action: 'studio-login' },
        headers: { 'x-forwarded-for': '203.0.113.9' },
        body: { password: 'senha-incorreta' },
      }),
      res,
    )

    expect(captured.statusCode).toBe(401)
    expect(captured.body).toEqual({
      error: {
        code: 'invalid_credentials',
        message: 'Credenciais inválidas.',
      },
    })
    expect(captured.headers.has('set-cookie')).toBe(false)
    expect(kvMocks.recordLoginFailure).toHaveBeenCalledOnce()
  })

  it('bloqueia novas tentativas durante a janela de rate limit', async () => {
    configureStudio()
    kvMocks.getLoginAttempts.mockResolvedValue(5)
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'POST',
        query: { action: 'studio-login' },
        headers: { 'x-forwarded-for': '203.0.113.10' },
        body: { password: PASSWORD },
      }),
      res,
    )

    expect(captured.statusCode).toBe(429)
    expect(captured.headers.get('retry-after')).toBe('900')
    expect(kvMocks.recordLoginFailure).not.toHaveBeenCalled()
    expect(kvMocks.clearLoginFailures).not.toHaveBeenCalled()
  })

  it('expira a sessão no logout e mantém a resposta sem cache', async () => {
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'POST',
        query: { action: 'studio-logout' },
      }),
      res,
    )

    expect(captured.statusCode).toBe(200)
    expect(captured.body).toEqual({ ok: true })
    expect(captured.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
    expect(captured.headers.get('set-cookie')).toEqual(
      expect.stringContaining('Max-Age=0'),
    )
  })

  it('não mantém as antigas rotas OAuth', async () => {
    vi.stubEnv('GITHUB_OAUTH_CLIENT_ID', 'legacy-id')
    vi.stubEnv('GITHUB_OAUTH_CLIENT_SECRET', 'legacy-secret')
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'GET',
        query: { action: 'login' },
      }),
      res,
    )

    expect(captured.statusCode).toBe(404)
    expect(captured.headers.has('location')).toBe(false)
    expect(captured.headers.has('set-cookie')).toBe(false)
    expect(JSON.stringify(captured.body)).not.toContain('legacy-secret')
  })
})
