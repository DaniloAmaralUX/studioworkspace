import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { internalError } from '../../api/_lib/http.js'
import { createResponse } from './vercel-response.js'

describe('cloud response security', () => {
  it('não expõe mensagens internas e sempre desabilita cache', () => {
    const { res, captured } = createResponse()

    internalError(
      res,
      new Error('KV_REST_API_TOKEN=segredo-interno-e-endpoint-privado'),
    )

    expect(captured.statusCode).toBe(500)
    expect(captured.body).toEqual({
      error: {
        code: 'internal_error',
        message: 'Não foi possível concluir a operação agora.',
      },
    })
    expect(JSON.stringify(captured.body)).not.toContain('segredo-interno')
    expect(captured.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
  })

  it('mantém OAuth e cookies GitHub fora da superfície ativa', async () => {
    const files = [
      'api/_lib/auth.ts',
      'api/auth/[action].ts',
      'api/github/[resource].ts',
      'frontend/src/components/GithubConnect.tsx',
    ]
    const source = (
      await Promise.all(
        files.map((file) => readFile(resolve(process.cwd(), file), 'utf8')),
      )
    ).join('\n')

    expect(source).not.toMatch(/GITHUB_OAUTH|gh_oauth_state|gh_session/)
    expect(source).not.toMatch(/github\.com\/login\/oauth|access_token/)
    expect(source).not.toMatch(/Entrar com GitHub|useGithubLogout/)
  })
})
