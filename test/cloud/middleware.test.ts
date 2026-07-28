import { afterEach, describe, expect, it, vi } from 'vitest'
import middleware from '../../middleware.js'
import { createStudioSessionToken } from '../../api/_lib/studioAuth.js'

function configureStudio(): void {
  vi.stubEnv('STUDIO_ACCESS_PASSWORD_HASH', 'configured-for-middleware')
  vi.stubEnv('STUDIO_SESSION_SECRET', 'middleware-session-secret')
}

describe('Studio Cloud middleware', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('nega API privada sem sessão e impede cache em todas as camadas', async () => {
    configureStudio()

    const response = middleware(
      new Request('https://studio.example/api/projects'),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      error: {
        code: 'studio_auth_required',
        message: 'Entre no Studio para continuar.',
      },
    })
    expect(response.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
    expect(response.headers.get('cdn-cache-control')).toBe('no-store')
    expect(response.headers.get('vercel-cdn-cache-control')).toBe('no-store')
  })

  it('propaga no-store para API pública', () => {
    const response = middleware(
      new Request('https://studio.example/api/auth/studio-status'),
    )

    expect(response.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
  })

  it('propaga no-store para API autenticada', () => {
    configureStudio()
    const token = createStudioSessionToken(
      'middleware-session-secret',
      Date.now(),
    )

    const response = middleware(
      new Request('https://studio.example/api/projects', {
        headers: {
          cookie: `__Host-studio_session=${encodeURIComponent(token)}`,
        },
      }),
    )

    expect(response.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
  })

  it('redireciona páginas para login apenas com destino interno', () => {
    configureStudio()

    const response = middleware(
      new Request('https://studio.example/projects/abc?tab=activity'),
    )

    expect(response.status).toBe(302)
    const location = new URL(response.headers.get('location') as string)
    expect(location.origin).toBe('https://studio.example')
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('next')).toBe(
      '/projects/abc?tab=activity',
    )
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
})
