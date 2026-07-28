import { afterEach, describe, expect, it, vi } from 'vitest'
import { repoContext } from '../../api/_lib/github'

const originalFetch = globalThis.fetch

function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('snapshot GitHub efêmero', () => {
  it('rejeita token em branco e normaliza espaços sem expô-los no header', async () => {
    await expect(repoContext('  \n', 'owner/repo')).rejects.toMatchObject({
      code: 'github_not_configured',
    })

    const authorizationHeaders: Array<string | null> = []
    globalThis.fetch = vi.fn(async (input, init) => {
      authorizationHeaders.push(
        new Headers(init?.headers).get('authorization'),
      )
      const url = String(input)
      if (url.endsWith('/readme')) return jsonResponse({}, 404)
      if (url.includes('/commits?')) return jsonResponse({}, 409)
      return jsonResponse({
        full_name: 'owner/repo',
        description: null,
        language: null,
        pushed_at: null,
        html_url: 'https://github.com/owner/repo',
        default_branch: 'main',
      })
    }) as typeof fetch

    await repoContext('  token-for-test\n', 'owner/repo')

    expect(authorizationHeaders).toEqual([
      'Bearer token-for-test',
      'Bearer token-for-test',
      'Bearer token-for-test',
    ])
  })

  it('estrutura repositório, README e commits com URLs verificáveis', async () => {
    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input)
      if (url.endsWith('/readme')) {
        return jsonResponse({
          content: Buffer.from('# Studio').toString('base64'),
          encoding: 'base64',
          path: 'README.md',
          html_url: 'https://github.com/owner/repo/blob/main/README.md',
        })
      }
      if (url.includes('/commits?')) {
        return jsonResponse([
          {
            sha: 'abcdef1234567890',
            html_url:
              'https://github.com/owner/repo/commit/abcdef1234567890',
            commit: {
              message: `feat: ${'x'.repeat(300)}\ncorpo`,
              author: { date: '2026-07-28T10:00:00.000Z' },
              committer: null,
            },
          },
        ])
      }
      return jsonResponse({
        full_name: 'owner/repo',
        description: 'Repo',
        language: 'TypeScript',
        pushed_at: '2026-07-28T10:00:00.000Z',
        html_url: 'https://github.com/owner/repo',
        default_branch: 'main',
      })
    }) as typeof fetch

    const snapshot = await repoContext('token-for-test', 'owner/repo')

    expect(snapshot.partial).toBe(false)
    expect(snapshot.readme?.text).toBe('# Studio')
    expect(snapshot.commits[0]?.title.length).toBeLessThanOrEqual(240)
    expect(snapshot.commits[0]?.sha).toBe('abcdef1234567890')
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  it('distingue README ausente e repositório vazio', async () => {
    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input)
      if (url.endsWith('/readme')) return jsonResponse({}, 404)
      if (url.includes('/commits?')) return jsonResponse({}, 409)
      return jsonResponse({
        full_name: 'owner/empty',
        description: null,
        language: null,
        pushed_at: null,
        html_url: 'https://github.com/owner/empty',
        default_branch: 'main',
      })
    }) as typeof fetch

    const snapshot = await repoContext('token-for-test', 'owner/empty')
    expect(snapshot.partial).toBe(true)
    expect(snapshot.readme).toBeNull()
    expect(snapshot.commits).toEqual([])
    expect(snapshot.warnings).toEqual([
      'README não encontrado no repositório.',
      'Nenhum commit recente foi encontrado.',
    ])
  })

  it('bloqueia credencial recusada ou rate limit', async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({}, 403, { 'x-ratelimit-remaining': '0' }),
    ) as typeof fetch

    await expect(
      repoContext('token-for-test', 'owner/repo'),
    ).rejects.toMatchObject({
      code: 'github_rate_limited',
    })
  })

  it('bloqueia repositório privado sem acesso em vez de inventar metadados', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({}, 404)) as typeof fetch

    await expect(
      repoContext('token-for-test', 'owner/private'),
    ).rejects.toMatchObject({
      code: 'github_not_found',
    })
  })

  it('classifica timeout do GitHub de forma previsível', async () => {
    vi.useFakeTimers()
    globalThis.fetch = vi.fn((_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      })
    }) as typeof fetch

    const pending = repoContext('token-for-test', 'owner/repo')
    const expectation = expect(pending).rejects.toMatchObject({
      code: 'github_timeout',
    })
    await vi.advanceTimersByTimeAsync(10_001)
    await expectation
  })

  it('degrada rate limit apenas em fontes opcionais para contexto parcial', async () => {
    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input)
      if (url.endsWith('/repos/owner/repo')) {
        return jsonResponse({
          full_name: 'owner/repo',
          description: 'Repo',
          language: 'TypeScript',
          pushed_at: '2026-07-28T10:00:00.000Z',
          html_url: 'https://github.com/owner/repo',
          default_branch: 'main',
        })
      }
      return jsonResponse({}, 403, {
        'x-ratelimit-remaining': '0',
      })
    }) as typeof fetch

    const snapshot = await repoContext('token-for-test', 'owner/repo')

    expect(snapshot.partial).toBe(true)
    expect(snapshot.warnings).toEqual([
      'Não foi possível consultar o README por limite do GitHub.',
      'Não foi possível consultar os commits recentes por limite do GitHub.',
    ])
  })

  it('não faz cache persistente entre mensagens', async () => {
    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input)
      if (url.endsWith('/readme')) return jsonResponse({}, 404)
      if (url.includes('/commits?')) return jsonResponse({}, 409)
      return jsonResponse({
        full_name: 'owner/repo',
        description: null,
        language: null,
        pushed_at: null,
        html_url: 'https://github.com/owner/repo',
        default_branch: 'main',
      })
    }) as typeof fetch

    await repoContext('token-for-test', 'owner/repo')
    await repoContext('token-for-test', 'owner/repo')
    expect(globalThis.fetch).toHaveBeenCalledTimes(6)
  })
})
