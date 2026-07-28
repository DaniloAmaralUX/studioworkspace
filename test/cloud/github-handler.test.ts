import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveGithubToken } from '../../api/_lib/auth.js'
import handler from '../../api/github/[resource].js'
import { createRequest, createResponse } from './vercel-response.js'

describe('GitHub cloud handler', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('ignora qualquer token em cookie e usa apenas GITHUB_TOKEN', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'pat-do-servidor')
    const request = createRequest({
      method: 'GET',
      query: { resource: 'status' },
      headers: { cookie: 'gh_session=token-do-browser' },
    })
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ login: 'studio-owner' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { res, captured } = createResponse()

    expect(resolveGithubToken(request)).toBe('pat-do-servidor')
    await handler(request, res)

    expect(captured.body).toEqual({
      authed: true,
      via: 'pat',
      login: 'studio-owner',
    })
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer pat-do-servidor',
    })
    expect(JSON.stringify(captured.body)).not.toContain('pat-do-servidor')
    expect(JSON.stringify(captured.body)).not.toContain('token-do-browser')
  })

  it('diferencia PAT ausente sem sugerir login OAuth', async () => {
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'GET',
        query: { resource: 'repos' },
      }),
      res,
    )

    expect(captured.statusCode).toBe(503)
    expect(captured.body).toEqual({
      error: {
        code: 'github_not_configured',
        message: 'GitHub não está configurado no servidor.',
      },
    })
    expect(captured.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
  })

  it('não repassa detalhes do provedor quando o PAT é recusado', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'pat-invalido')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: 'provider detail with credential metadata',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    )
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'GET',
        query: { resource: 'repos' },
      }),
      res,
    )

    expect(captured.statusCode).toBe(502)
    expect(captured.body).toEqual({
      error: {
        code: 'github_auth_failed',
        message: 'Não foi possível autenticar a conexão do GitHub.',
      },
    })
    expect(JSON.stringify(captured.body)).not.toContain('provider detail')
    expect(JSON.stringify(captured.body)).not.toContain('pat-invalido')
  })
})
