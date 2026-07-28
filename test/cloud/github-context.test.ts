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

const REPO_BODY = {
  full_name: 'owner/repo',
  description: 'Repo',
  language: 'TypeScript',
  pushed_at: '2026-07-28T10:00:00.000Z',
  html_url: 'https://github.com/owner/repo',
  default_branch: 'main',
}

type RouteMap = {
  repo?: () => Response
  readme?: () => Response
  commits?: () => Response
  issues?: () => Response
  pulls?: () => Response
  runs?: () => Response
}

/** Roteia as 6 chamadas do snapshot; o que não for sobrescrito responde vazio. */
function routeGithub(routes: RouteMap = {}) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.endsWith('/readme')) {
      return (routes.readme ?? (() => jsonResponse({}, 404)))()
    }
    if (url.includes('/commits?')) {
      return (routes.commits ?? (() => jsonResponse([])))()
    }
    if (url.includes('/issues?')) {
      return (routes.issues ?? (() => jsonResponse([])))()
    }
    if (url.includes('/pulls?')) {
      return (routes.pulls ?? (() => jsonResponse([])))()
    }
    if (url.includes('/actions/runs?')) {
      return (routes.runs ?? (() => jsonResponse({ workflow_runs: [] })))()
    }
    return (routes.repo ?? (() => jsonResponse(REPO_BODY)))()
  }) as unknown as typeof fetch
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
      if (url.includes('/issues?')) return jsonResponse([])
      if (url.includes('/pulls?')) return jsonResponse([])
      if (url.includes('/actions/runs?')) {
        return jsonResponse({ workflow_runs: [] })
      }
      return jsonResponse(REPO_BODY)
    }) as typeof fetch

    await repoContext('  token-for-test\n', 'owner/repo')

    expect(authorizationHeaders).toEqual(
      Array.from({ length: 6 }, () => 'Bearer token-for-test'),
    )
  })

  it('estrutura repositório, README e commits com URLs verificáveis', async () => {
    globalThis.fetch = routeGithub({
      readme: () =>
        jsonResponse({
          content: Buffer.from('# Studio').toString('base64'),
          encoding: 'base64',
          path: 'README.md',
          html_url: 'https://github.com/owner/repo/blob/main/README.md',
        }),
      commits: () =>
        jsonResponse([
          {
            sha: 'abcdef1234567890',
            html_url: 'https://github.com/owner/repo/commit/abcdef1234567890',
            commit: {
              message: `feat: ${'x'.repeat(300)}\ncorpo`,
              author: { date: '2026-07-28T10:00:00.000Z' },
              committer: null,
            },
          },
        ]),
    })

    const snapshot = await repoContext('token-for-test', 'owner/repo')

    expect(snapshot.partial).toBe(false)
    expect(snapshot.readme?.text).toBe('# Studio')
    expect(snapshot.commits[0]?.title.length).toBeLessThanOrEqual(240)
    expect(snapshot.commits[0]?.sha).toBe('abcdef1234567890')
    expect(globalThis.fetch).toHaveBeenCalledTimes(6)
  })

  it('separa issues de pull requests no endpoint /issues', async () => {
    globalThis.fetch = routeGithub({
      issues: () =>
        jsonResponse([
          {
            number: 42,
            title: 'Corrigir foco do editor',
            html_url: 'https://github.com/owner/repo/issues/42',
            updated_at: '2026-07-27T21:00:00.000Z',
          },
          {
            number: 43,
            title: 'Na verdade é um PR',
            html_url: 'https://github.com/owner/repo/pull/43',
            updated_at: '2026-07-27T20:00:00.000Z',
            pull_request: { url: 'https://api.github.com/…' },
          },
        ]),
    })

    const snapshot = await repoContext('token-for-test', 'owner/repo')

    expect(snapshot.issues).toEqual([
      {
        number: 42,
        title: 'Corrigir foco do editor',
        url: 'https://github.com/owner/repo/issues/42',
        updatedAt: '2026-07-27T21:00:00.000Z',
      },
    ])
  })

  it('estrutura pull requests abertos preservando rascunho', async () => {
    globalThis.fetch = routeGithub({
      pulls: () =>
        jsonResponse([
          {
            number: 7,
            title: 'x'.repeat(300),
            html_url: 'https://github.com/owner/repo/pull/7',
            updated_at: '2026-07-27T19:00:00.000Z',
            draft: true,
          },
        ]),
    })

    const snapshot = await repoContext('token-for-test', 'owner/repo')

    expect(snapshot.pullRequests[0]?.draft).toBe(true)
    expect(snapshot.pullRequests[0]?.title.length).toBe(240)
  })

  it('lê o envelope workflow_runs das execuções de CI', async () => {
    globalThis.fetch = routeGithub({
      runs: () =>
        jsonResponse({
          total_count: 1,
          workflow_runs: [
            {
              id: 9001,
              name: 'CI',
              status: 'completed',
              conclusion: 'failure',
              head_branch: 'main',
              html_url: 'https://github.com/owner/repo/actions/runs/9001',
              run_started_at: '2026-07-27T18:00:00.000Z',
            },
          ],
        }),
    })

    const snapshot = await repoContext('token-for-test', 'owner/repo')

    expect(snapshot.ciRuns).toEqual([
      {
        id: 9001,
        name: 'CI',
        status: 'completed',
        conclusion: 'failure',
        headBranch: 'main',
        url: 'https://github.com/owner/repo/actions/runs/9001',
        startedAt: '2026-07-27T18:00:00.000Z',
      },
    ])
    expect(
      snapshot.warnings.some((warning) => warning.includes('CI')),
    ).toBe(false)
  })

  it('trata escopo ausente do PAT como aviso acionável, não como bloqueio', async () => {
    // Fine-grained PAT sem Issues/Pull requests/Actions: 403 sem rate limit.
    const denied = () => jsonResponse({}, 403)
    globalThis.fetch = routeGithub({
      issues: denied,
      pulls: denied,
      runs: denied,
    })

    const snapshot = await repoContext('token-for-test', 'owner/repo')

    expect(snapshot.repository.nameWithOwner).toBe('owner/repo')
    expect(snapshot.partial).toBe(true)
    expect(snapshot.issues).toEqual([])
    expect(snapshot.warnings).toEqual([
      'README não encontrado no repositório.',
      'Nenhum commit recente foi encontrado.',
      'Não foi possível consultar as issues abertas — verifique as permissões do token do GitHub.',
      'Não foi possível consultar os pull requests abertos — verifique as permissões do token do GitHub.',
      'Não foi possível consultar as execuções de CI — verifique as permissões do token do GitHub.',
    ])
  })

  it('não avisa quando não há issues, PRs ou CI: ausência é estado saudável', async () => {
    globalThis.fetch = routeGithub({
      readme: () =>
        jsonResponse({
          content: Buffer.from('# Studio').toString('base64'),
          encoding: 'base64',
          path: 'README.md',
          html_url: 'https://github.com/owner/repo/blob/main/README.md',
        }),
      commits: () =>
        jsonResponse([
          {
            sha: 'abcdef1234567890',
            html_url: 'https://github.com/owner/repo/commit/abcdef1234567890',
            commit: {
              message: 'feat: começo',
              author: { date: '2026-07-28T10:00:00.000Z' },
              committer: null,
            },
          },
        ]),
    })

    const snapshot = await repoContext('token-for-test', 'owner/repo')

    expect(snapshot.issues).toEqual([])
    expect(snapshot.pullRequests).toEqual([])
    expect(snapshot.ciRuns).toEqual([])
    expect(snapshot.warnings).toEqual([])
    expect(snapshot.partial).toBe(false)
  })

  it('distingue README ausente e repositório vazio', async () => {
    globalThis.fetch = routeGithub({
      repo: () =>
        jsonResponse({ ...REPO_BODY, full_name: 'owner/empty' }),
      commits: () => jsonResponse({}, 409),
    })

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
      if (url.endsWith('/repos/owner/repo')) return jsonResponse(REPO_BODY)
      return jsonResponse({}, 403, {
        'x-ratelimit-remaining': '0',
      })
    }) as typeof fetch

    const snapshot = await repoContext('token-for-test', 'owner/repo')

    expect(snapshot.partial).toBe(true)
    expect(snapshot.warnings).toEqual([
      'Não foi possível consultar o README por limite do GitHub.',
      'Não foi possível consultar os commits recentes por limite do GitHub.',
      'Não foi possível consultar as issues abertas por limite do GitHub.',
      'Não foi possível consultar os pull requests abertos por limite do GitHub.',
      'Não foi possível consultar as execuções de CI por limite do GitHub.',
    ])
  })

  it('não faz cache persistente entre mensagens', async () => {
    globalThis.fetch = routeGithub()

    await repoContext('token-for-test', 'owner/repo')
    await repoContext('token-for-test', 'owner/repo')
    expect(globalThis.fetch).toHaveBeenCalledTimes(12)
  })
})
