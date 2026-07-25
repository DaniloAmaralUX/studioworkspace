import { mkdtempSync, promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Guarda do fluxo abrir/clonar SEM tocar em processos reais: core/github e
// core/launcher são mockados (nunca child_process). O protocolo do automode
// proíbe abrir apps reais em teste — este arquivo é a versão mecânica disso.

vi.mock('../src/core/github', () => ({
  ghAuthOk: vi.fn().mockResolvedValue(false),
  ghRepoList: vi.fn().mockResolvedValue([]),
  ghRepoView: vi.fn().mockRejectedValue(new Error('gh mockado (sem rede em teste)')),
  ghClone: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../src/core/launcher', () => ({
  detectLaunchers: vi.fn().mockResolvedValue({
    explorer: true,
    terminal: true,
    claude: false,
    code: false,
    cursor: false,
  }),
  openTarget: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../src/core/stamp', () => ({
  stampProject: vi.fn().mockResolvedValue({ dir: '', files: [] }),
}))

import { buildApp } from '../src/app'
import { ghClone } from '../src/core/github'
import { detectLaunchers, openTarget } from '../src/core/launcher'

let app: Awaited<ReturnType<typeof buildApp>>
let localDir: string

beforeAll(async () => {
  localDir = mkdtempSync(path.join(tmpdir(), 'ps-openclone-'))
  app = await buildApp({ logger: false })
})
afterAll(async () => {
  await app.close()
  await fs.rm(localDir, { recursive: true, force: true }).catch(() => {})
})
beforeEach(() => {
  vi.clearAllMocks()
})

async function addLocal(): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/projects/local',
    payload: { path: localDir },
  })
  if (res.statusCode === 409) {
    const list = (await app.inject({ method: 'GET', url: '/api/projects' })).json() as Array<{
      id: string
      source: { kind: string; path?: string }
    }>
    return list.find((p) => p.source.kind === 'local' && p.source.path === localDir)!.id
  }
  return res.json().id as string
}

describe('GET /api/launchers', () => {
  it('reporta o que o detector (mockado) diz', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/launchers' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      explorer: true,
      terminal: true,
      claude: false,
      code: false,
      cursor: false,
    })
    expect(detectLaunchers).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/projects/:id/open', () => {
  it('projeto local abre via openTarget (mock) com o path certo', async () => {
    const id = await addLocal()
    const res = await app.inject({
      method: 'POST',
      url: `/api/projects/${id}/open`,
      payload: { with: 'explorer' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().ok).toBe(true)
    expect(openTarget).toHaveBeenCalledTimes(1)
    expect(openTarget).toHaveBeenCalledWith(localDir, 'explorer')
  })

  it('POST /api/projects/github com gh fora do ar responde 503 gh_failed (contrato)', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/projects/github',
      payload: { nameWithOwner: 'dan/sem-clone' },
    })
    // ghRepoView está mockado para rejeitar: a rota TEM que degradar para
    // 503 gh_failed (nunca 500) — guarda real do contrato sob falha do gh.
    expect(created.statusCode).toBe(503)
    expect(created.json().error.code).toBe('gh_failed')
  })

  it('github sem clone responde 409 needs_clone e NÃO chama openTarget', async () => {
    const { addProject } = await import('../src/core/projectIndex')
    const p = await addProject({
      name: 'sem-clone',
      source: { kind: 'github', nameWithOwner: 'dan/sem-clone' },
    })
    const res = await app.inject({
      method: 'POST',
      url: `/api/projects/${p.id}/open`,
      payload: { with: 'explorer' },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('needs_clone')
    expect(openTarget).not.toHaveBeenCalled()
  })
})

describe('POST /api/projects/:id/clone', () => {
  it('clona via ghClone (mock) no WORK_DIR e persiste cloneDir; segundo clone não reclona', async () => {
    const { addProject } = await import('../src/core/projectIndex')
    const p = await addProject({
      name: 'clonavel',
      source: { kind: 'github', nameWithOwner: 'dan/clonavel' },
    })

    const res = await app.inject({ method: 'POST', url: `/api/projects/${p.id}/clone` })
    expect(res.statusCode).toBe(201)
    const cloneDir = res.json().source.cloneDir as string
    expect(cloneDir).toContain(path.join('dan', 'clonavel'))
    expect(ghClone).toHaveBeenCalledTimes(1)
    expect(ghClone).toHaveBeenCalledWith('dan/clonavel', cloneDir)

    // Reclonar: devolve o projeto como está, sem chamar ghClone de novo.
    const again = await app.inject({ method: 'POST', url: `/api/projects/${p.id}/clone` })
    expect(again.statusCode).toBe(200)
    expect(ghClone).toHaveBeenCalledTimes(1)
  })

  it('clone de projeto local responde 400 not_github', async () => {
    const id = await addLocal()
    const res = await app.inject({ method: 'POST', url: `/api/projects/${id}/clone` })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('not_github')
    expect(ghClone).not.toHaveBeenCalled()
  })
})
