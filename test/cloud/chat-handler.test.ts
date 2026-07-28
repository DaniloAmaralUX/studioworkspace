import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type { Project } from '../../shared/types.js'
import { createRequest, createResponse } from './vercel-response.js'

const kvMocks = vi.hoisted(() => ({
  getProject: vi.fn(),
}))

const aiMocks = vi.hoisted(() => ({
  aiConfigured: vi.fn(() => true),
  generateAiChat: vi.fn(),
  generateAiText: vi.fn(),
}))

const githubMocks = vi.hoisted(() => {
  class GithubError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message)
    }
  }
  return {
    GithubError,
    repoContext: vi.fn(),
  }
})

vi.mock('../../api/_lib/kv.js', () => kvMocks)
vi.mock('../../api/_lib/ai.js', () => aiMocks)
vi.mock('../../api/_lib/github.js', () => githubMocks)

import handler from '../../api/projects/[id]/ai-next-action.js'

const project: Project = {
  id: 'project-1',
  name: 'Studio',
  source: { kind: 'github', nameWithOwner: 'owner/studio' },
  status: 'building',
  nextAction: 'Revisar o chat',
  tags: ['design'],
  stack: ['TypeScript'],
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-28T00:00:00.000Z',
}

const snapshot = {
  repository: {
    nameWithOwner: 'owner/studio',
    description: 'Studio',
    primaryLanguage: 'TypeScript',
    pushedAt: '2026-07-28T10:00:00.000Z',
    url: 'https://github.com/owner/studio',
    defaultBranch: 'main',
  },
  readme: {
    text: '# Studio',
    path: 'README.md',
    url: 'https://github.com/owner/studio/blob/main/README.md',
  },
  commits: [
    {
      sha: '1234567890abcdef',
      title: 'feat: contexto',
      url: 'https://github.com/owner/studio/commit/1234567890abcdef',
      committedAt: '2026-07-28T09:00:00.000Z',
    },
  ],
  fetchedAt: '2026-07-28T12:00:00.000Z',
  partial: false,
  warnings: [],
}

beforeEach(() => {
  vi.stubEnv('GITHUB_TOKEN', 'server-only-test-token')
  kvMocks.getProject.mockResolvedValue(project)
  githubMocks.repoContext.mockResolvedValue(snapshot)
  aiMocks.aiConfigured.mockReturnValue(true)
  aiMocks.generateAiChat.mockResolvedValue({
    text: 'Resposta geral',
    model: 'test-model',
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/chat', () => {
  it('mantém o chat geral sem consultar projeto ou GitHub', async () => {
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'POST',
        query: { id: 'context-project' },
        body: {
          messages: [{ role: 'user', content: 'Olá' }],
        },
      }),
      res,
    )

    expect(captured.statusCode).toBe(200)
    expect(captured.body).toEqual({
      message: { role: 'assistant', content: 'Resposta geral' },
      model: 'test-model',
      context: null,
      suggestedNextAction: null,
    })
    expect(captured.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
    expect(captured.headers.get('vercel-cdn-cache-control')).toBe('no-store')
    expect(kvMocks.getProject).not.toHaveBeenCalled()
    expect(githubMocks.repoContext).not.toHaveBeenCalled()
  })

  it('consulta o GitHub a cada mensagem contextual e devolve fontes e ação', async () => {
    aiMocks.generateAiChat.mockResolvedValue({
      text: JSON.stringify({
        answer: 'O projeto está em construção.',
        suggestedNextAction: 'Validar o fluxo contextual.',
      }),
      model: 'kimi-test',
    })
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'POST',
        query: { id: 'context-project' },
        body: {
          projectId: project.id,
          messages: [{ role: 'user', content: 'Qual é o estado?' }],
        },
      }),
      res,
    )

    expect(githubMocks.repoContext).toHaveBeenCalledWith(
      'server-only-test-token',
      'owner/studio',
    )
    expect(captured.statusCode).toBe(200)
    expect(captured.body).toMatchObject({
      message: {
        role: 'assistant',
        content: 'O projeto está em construção.',
      },
      model: 'kimi-test',
      context: {
        projectId: project.id,
        projectName: project.name,
        status: 'complete',
      },
      suggestedNextAction: 'Validar o fluxo contextual.',
    })
    expect(
      (captured.body as { context: { sources: unknown[] } }).context.sources,
    ).toHaveLength(3)
  })

  it('recusa fonte local na variante cloud sem chamar o GitHub', async () => {
    kvMocks.getProject.mockResolvedValue({
      ...project,
      source: { kind: 'local', path: 'C:\\work\\studio' },
    })
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'POST',
        query: { id: 'context-project' },
        body: {
          projectId: project.id,
          messages: [{ role: 'user', content: 'Qual é o estado?' }],
        },
      }),
      res,
    )

    expect(captured.statusCode).toBe(422)
    expect(captured.body).toMatchObject({
      error: { code: 'context_source_unsupported' },
    })
    expect(githubMocks.repoContext).not.toHaveBeenCalled()
  })

  it('diferencia projeto ausente de falha ao carregar o contexto do Studio', async () => {
    kvMocks.getProject.mockResolvedValueOnce(null)
    const missing = createResponse()

    await handler(
      createRequest({
        method: 'POST',
        query: { id: 'context-project' },
        body: {
          projectId: project.id,
          messages: [{ role: 'user', content: 'Estado?' }],
        },
      }),
      missing.res,
    )

    expect(missing.captured.statusCode).toBe(404)
    expect(missing.captured.body).toMatchObject({
      error: { code: 'project_not_found' },
    })

    kvMocks.getProject.mockRejectedValueOnce(new Error('redis secret detail'))
    const failed = createResponse()
    await handler(
      createRequest({
        method: 'POST',
        query: { id: 'context-project' },
        body: {
          projectId: project.id,
          messages: [{ role: 'user', content: 'Estado?' }],
        },
      }),
      failed.res,
    )

    expect(failed.captured.statusCode).toBe(502)
    expect(failed.captured.body).toEqual({
      error: {
        code: 'context_failed',
        message: 'Não foi possível carregar o contexto do projeto.',
      },
    })
    expect(JSON.stringify(failed.captured.body)).not.toContain(
      'redis secret detail',
    )
  })

  it.each([
    ['github_auth_failed', 401],
    ['github_rate_limited', 429],
    ['github_timeout', 502],
  ])(
    'mapeia %s sem vazar detalhes internos',
    async (code, expectedStatus) => {
      githubMocks.repoContext.mockRejectedValueOnce(
        new githubMocks.GithubError(
          expectedStatus,
          code,
          'provider secret detail',
        ),
      )
      const { res, captured } = createResponse()

      await handler(
        createRequest({
          method: 'POST',
          query: { id: 'context-project' },
          body: {
            projectId: project.id,
            messages: [{ role: 'user', content: 'Estado?' }],
          },
        }),
        res,
      )

      expect(captured.statusCode).toBe(expectedStatus)
      expect(
        (captured.body as { error: { code: string } }).error.code,
      ).toBe(
        code === 'github_timeout' ? 'context_failed' : code,
      )
      expect(JSON.stringify(captured.body)).not.toContain(
        'provider secret detail',
      )
    },
  )

  it('bloqueia contexto quando o PAT não está configurado', async () => {
    vi.stubEnv('GITHUB_TOKEN', '   ')
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'POST',
        query: { id: 'context-project' },
        body: {
          projectId: project.id,
          messages: [{ role: 'user', content: 'Estado?' }],
        },
      }),
      res,
    )

    expect(captured.statusCode).toBe(503)
    expect(captured.body).toMatchObject({
      error: { code: 'github_not_configured' },
    })
    expect(githubMocks.repoContext).not.toHaveBeenCalled()
  })

  it('converte falha da inferência no erro público chat_failed', async () => {
    aiMocks.generateAiChat.mockRejectedValueOnce(
      new Error('bedrock secret detail'),
    )
    const { res, captured } = createResponse()

    await handler(
      createRequest({
        method: 'POST',
        query: { id: 'context-project' },
        body: {
          messages: [{ role: 'user', content: 'Olá' }],
        },
      }),
      res,
    )

    expect(captured.statusCode).toBe(502)
    expect(captured.body).toEqual({
      error: {
        code: 'chat_failed',
        message: 'Não foi possível responder agora. Tente novamente.',
      },
    })
    expect(JSON.stringify(captured.body)).not.toContain(
      'bedrock secret detail',
    )
  })
})
