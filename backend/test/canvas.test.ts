import { mkdtempSync, promises as fsp } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'
import { addProject } from '../src/core/projectIndex'

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  app = await buildApp({ logger: false })
  await app.ready() // exigido antes de injectWS
})
afterAll(async () => {
  await app.close()
})

describe('canvas ws echo (M0)', () => {
  it('ecoa a mensagem enviada', async () => {
    const ws = await app.injectWS('/api/canvas/ws-echo')
    const got = new Promise<string>((resolve) => {
      ws.on('message', (m: Buffer) => resolve(m.toString()))
    })
    ws.send('ping-maestri')
    expect(await got).toBe('ping-maestri')
    ws.terminate()
  })
})

describe('spike PTY (M0)', () => {
  it('spawna powershell e recebe output', async () => {
    const pty = await import('@lydell/node-pty')
    const out = await new Promise<string>((resolve, reject) => {
      const p = pty.spawn(
        'powershell.exe',
        ['-NoLogo', '-Command', 'echo maestri-pty-ok'],
        { name: 'xterm-color', cols: 80, rows: 24, cwd: process.cwd() },
      )
      let buf = ''
      const to = setTimeout(() => {
        try {
          p.kill()
        } catch {
          /* já morto */
        }
        reject(new Error('timeout sem output do PTY'))
      }, 20000)
      p.onData((d) => {
        buf += d
        if (buf.includes('maestri-pty-ok')) {
          clearTimeout(to)
          try {
            p.kill()
          } catch {
            /* já morto */
          }
          resolve(buf)
        }
      })
    })
    expect(out).toContain('maestri-pty-ok')
  }, 25000)
})

describe('canvas layout + notas (M1)', () => {
  let projectId: string
  let projectDir: string

  beforeAll(async () => {
    projectDir = mkdtempSync(path.join(tmpdir(), 'ps-canvas-'))
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects/local',
      payload: { path: projectDir },
    })
    projectId = res.json().id
  })

  it('GET sem doc devolve canvas vazio default', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/projects/${projectId}/canvas` })
    expect(res.statusCode).toBe(200)
    expect(res.json().version).toBe(1)
    expect(res.json().nodes).toEqual([])
  })

  it('PUT → GET faz roundtrip do layout', async () => {
    const doc = {
      version: 1,
      floorId: 'main',
      nodes: [
        { id: 'n1', kind: 'text', position: { x: 10, y: 20 }, data: { kind: 'text', text: 'oi' } },
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      routines: [],
    }
    const put = await app.inject({ method: 'PUT', url: `/api/projects/${projectId}/canvas`, payload: doc })
    expect(put.statusCode).toBe(200)
    const get = await app.inject({ method: 'GET', url: `/api/projects/${projectId}/canvas` })
    expect(get.json().nodes[0].id).toBe('n1')
    expect(get.json().updatedAt).toBeTruthy()
  })

  it('cria nota → gera o .md no disco', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/projects/${projectId}/canvas/notes`,
      payload: { title: 'Minha Nota' },
    })
    expect(res.statusCode).toBe(201)
    const id = res.json().id
    const content = await fsp.readFile(
      path.join(projectDir, '.workspace', 'canvas', 'notes', `${id}.md`),
      'utf8',
    )
    expect(content).toContain('# Minha Nota')
  })

  it('noteId inválido → 400', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/projects/${projectId}/canvas/notes/Bad_Id`,
    })
    expect(res.statusCode).toBe(400)
  })

  it('projeto github sem clone → 400 not_local', async () => {
    const p = await addProject({ name: 'gh', source: { kind: 'github', nameWithOwner: 'a/b' }, stack: [] })
    const res = await app.inject({ method: 'GET', url: `/api/projects/${p.id}/canvas` })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('not_local')
  })

  it('watcher: escrever no .md dispara note-changed no WS', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/api/projects/${projectId}/canvas/notes`,
      payload: { title: 'Watch' },
    })
    const noteId = create.json().id
    const ws = await app.injectWS(`/api/projects/${projectId}/canvas/events`)
    const got = new Promise<string>((resolve) => {
      ws.on('message', (m: Buffer) => resolve(m.toString()))
    })
    await new Promise((r) => setTimeout(r, 150)) // watcher assina
    await fsp.writeFile(
      path.join(projectDir, '.workspace', 'canvas', 'notes', `${noteId}.md`),
      '# Watch\n\nlinha nova',
      'utf8',
    )
    const msg = JSON.parse(await got)
    expect(msg.type).toBe('note-changed')
    expect(msg.noteId).toBe(noteId)
    ws.terminate()
  }, 10000)
})
