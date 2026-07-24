import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  app = await buildApp({ logger: false })
})
afterAll(async () => {
  await app.close()
})

describe('health', () => {
  it('responde { ok: true }', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })
  })
})

describe('projects', () => {
  it('semeia 2 projetos de exemplo no primeiro load', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(2)
  })

  it('rejeita body inválido ao associar pasta local (schema)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects/local',
      payload: {},
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('invalid_body')
  })

  it('rejeita caminho que não é pasta', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects/local',
      payload: { path: path.join(tmpdir(), 'ps-nao-existe-de-jeito-nenhum-42') },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('not_a_dir')
  })

  it('associa pasta local, deduplica, edita e remove', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ps-test-proj-'))

    const created = await app.inject({
      method: 'POST',
      url: '/api/projects/local',
      payload: { path: dir },
    })
    expect(created.statusCode).toBe(201)
    const project = created.json()
    expect(project.name).toBe(path.basename(dir))
    expect(project.source.kind).toBe('local')

    const dup = await app.inject({
      method: 'POST',
      url: '/api/projects/local',
      payload: { path: dir },
    })
    expect(dup.statusCode).toBe(409)
    expect(dup.json().error.code).toBe('duplicate')

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/projects/${project.id}`,
      payload: { nextAction: 'Escrever mais testes', status: 'building' },
    })
    expect(patched.statusCode).toBe(200)
    expect(patched.json().nextAction).toBe('Escrever mais testes')
    expect(patched.json().status).toBe('building')

    const badPatch = await app.inject({
      method: 'PATCH',
      url: `/api/projects/${project.id}`,
      payload: { status: 'inventado' },
    })
    expect(badPatch.statusCode).toBe(400)
    expect(badPatch.json().error.code).toBe('invalid_body')

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${project.id}`,
    })
    expect(del.statusCode).toBe(200)
    expect(del.json()).toEqual({ ok: true })

    const delAgain = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${project.id}`,
    })
    expect(delAgain.statusCode).toBe(404)
    expect(delAgain.json().error.code).toBe('not_found')
  })

  it('PATCH em id desconhecido responde 404 no envelope', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/projects/nao-existe',
      payload: { status: 'done' },
    })
    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('not_found')
  })
})

describe('open', () => {
  it('rejeita launcher desconhecido via schema', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects/qualquer/open',
      payload: { with: 'vim' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('invalid_body')
  })

  it('404 para projeto inexistente com launcher válido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects/nao-existe/open',
      payload: { with: 'explorer' },
    })
    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('not_found')
  })
})

describe('templates', () => {
  it('CRUD com validação de schema', async () => {
    const bad = await app.inject({
      method: 'POST',
      url: '/api/templates',
      payload: { name: 'sem repo' },
    })
    expect(bad.statusCode).toBe(400)
    expect(bad.json().error.code).toBe('invalid_body')

    const created = await app.inject({
      method: 'POST',
      url: '/api/templates',
      payload: { name: 'Base Vite', repoUrl: 'https://github.com/acme/base' },
    })
    expect(created.statusCode).toBe(201)
    const tpl = created.json()
    expect(tpl.id).toBeTruthy()

    const list = await app.inject({ method: 'GET', url: '/api/templates' })
    expect(list.json().some((t: { id: string }) => t.id === tpl.id)).toBe(true)

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/templates/${tpl.id}`,
    })
    expect(del.json()).toEqual({ ok: true })
  })
})

describe('error handler global', () => {
  it('JSON malformado responde no envelope { error }', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects/local',
      payload: '{invalido',
      headers: { 'content-type': 'application/json' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.message).toBeTruthy()
  })
})
