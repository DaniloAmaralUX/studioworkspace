import { mkdtempSync, promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Estes testes trocam PS_DATA_DIR por caso e usam vi.resetModules porque tanto
// config.ts (lê env no import) quanto projectIndex.ts (cache de módulo) ficam
// stale entre cenários — cada caso importa o app do zero.

let dataDir: string

async function freshApp() {
  vi.resetModules()
  const { buildApp } = await import('../src/app')
  return await buildApp({ logger: false })
}

beforeEach(() => {
  dataDir = mkdtempSync(path.join(tmpdir(), 'ps-resilience-'))
  process.env.PS_DATA_DIR = dataDir
})

afterEach(async () => {
  await fs.rm(dataDir, { recursive: true, force: true }).catch(() => {})
})

describe('resiliência: projects.json corrompido', () => {
  it('GET /api/projects responde 200 com índice vazio (sem re-seed) e preserva .bak', async () => {
    await fs.mkdir(dataDir, { recursive: true })
    const file = path.join(dataDir, 'projects.json')
    await fs.writeFile(file, '{ isso nao é json válido', 'utf8')

    const app = await freshApp()
    try {
      const res = await app.inject({ method: 'GET', url: '/api/projects' })
      expect(res.statusCode).toBe(200)
      // Índice vazio: NÃO re-seeda por cima de dados corrompidos do usuário.
      expect(res.json()).toEqual([])

      const entries = await fs.readdir(dataDir)
      const baks = entries.filter((e) => e.startsWith('projects.json.bak-'))
      expect(baks).toHaveLength(1)
      // O conteúdo original fica preservado para recuperação manual.
      const bak = await fs.readFile(path.join(dataDir, baks[0]!), 'utf8')
      expect(bak).toBe('{ isso nao é json válido')
    } finally {
      await app.close()
    }
  })

  it('JSON válido mas com shape errado (não-array) vira corrupção: 200 + .bak, sem crash', async () => {
    await fs.mkdir(dataDir, { recursive: true })
    const file = path.join(dataDir, 'projects.json')
    await fs.writeFile(file, '{"editado": "na mao"}', 'utf8')

    const app = await freshApp()
    try {
      const res = await app.inject({ method: 'GET', url: '/api/projects' })
      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual([])
      const entries = await fs.readdir(dataDir)
      expect(entries.filter((e) => e.startsWith('projects.json.bak-'))).toHaveLength(1)
    } finally {
      await app.close()
    }
  })

  it('UTF-8 com BOM (PowerShell 5.1) NÃO é tratado como corrupção', async () => {
    await fs.mkdir(dataDir, { recursive: true })
    const file = path.join(dataDir, 'projects.json')
    const now = new Date().toISOString()
    const valid = JSON.stringify([
      {
        id: 'bom',
        name: 'Com BOM',
        source: { kind: 'local', path: dataDir },
        status: 'building',
        tags: [],
        stack: [],
        createdAt: now,
        updatedAt: now,
      },
    ])
    await fs.writeFile(file, '\uFEFF' + valid, 'utf8')

    const app = await freshApp()
    try {
      const res = await app.inject({ method: 'GET', url: '/api/projects' })
      expect(res.statusCode).toBe(200)
      expect(res.json()).toHaveLength(1)
      // Nenhum .bak criado — o arquivo era válido, só tinha BOM.
      const entries = await fs.readdir(dataDir)
      expect(entries.filter((e) => e.includes('.bak-'))).toHaveLength(0)
    } finally {
      await app.close()
    }
  })

  it('arquivo ausente continua semeando normalmente', async () => {
    const app = await freshApp()
    try {
      const res = await app.inject({ method: 'GET', url: '/api/projects' })
      expect(res.statusCode).toBe(200)
      expect(res.json().length).toBeGreaterThan(0)
    } finally {
      await app.close()
    }
  })
})

describe('resiliência: pasta local sumida', () => {
  it('projeto com path inexistente vira blocked + pathMissing sem derrubar os demais', async () => {
    const existingDir = mkdtempSync(path.join(tmpdir(), 'ps-existe-'))
    const missing = path.join(tmpdir(), 'ps-sumiu-de-vez-9999')
    await fs.mkdir(dataDir, { recursive: true })
    const now = new Date().toISOString()
    const base = {
      status: 'building',
      tags: [],
      stack: [],
      createdAt: now,
      updatedAt: now,
    }
    await fs.writeFile(
      path.join(dataDir, 'projects.json'),
      JSON.stringify([
        { ...base, id: 'ok', name: 'Ok', source: { kind: 'local', path: existingDir } },
        { ...base, id: 'gone', name: 'Gone', source: { kind: 'local', path: missing } },
      ]),
      'utf8',
    )

    const app = await freshApp()
    try {
      const res = await app.inject({ method: 'GET', url: '/api/projects' })
      expect(res.statusCode).toBe(200)
      const list = res.json() as Array<{
        id: string
        status: string
        pathMissing?: boolean
      }>
      expect(list).toHaveLength(2)

      const ok = list.find((p) => p.id === 'ok')!
      expect(ok.status).toBe('building')
      expect(ok.pathMissing).toBeUndefined()

      const gone = list.find((p) => p.id === 'gone')!
      expect(gone.status).toBe('blocked')
      expect(gone.pathMissing).toBe(true)

      // A mutação é só na resposta: o arquivo persistido não muda.
      const raw = JSON.parse(
        await fs.readFile(path.join(dataDir, 'projects.json'), 'utf8'),
      ) as Array<{ id: string; status: string }>
      expect(raw.find((p) => p.id === 'gone')!.status).toBe('building')
    } finally {
      await app.close()
      await fs.rm(existingDir, { recursive: true, force: true }).catch(() => {})
    }
  })
})
